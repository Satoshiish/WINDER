import { type NextRequest, NextResponse } from "next/server"

async function fetchPhivolcsData(userLat: number, userLon: number): Promise<any[]> {
  try {
    const response = await fetch("https://earthquake.phivolcs.dost.gov.ph/", {
      headers: {
        "User-Agent": "WeatherHub/1.0",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      console.log("[v0] PHIVOLCS API returned status:", response.status)
      return []
    }

    const html = await response.text()
    const earthquakes = parsePhivolcsHtml(html, userLat, userLon)
    
    console.log("[v0] PHIVOLCS returned", earthquakes.length, "earthquakes")
    return earthquakes
  } catch (error) {
    console.log("[v0] PHIVOLCS fetch failed:", error instanceof Error ? error.message : String(error))
    return []
  }
}

function parsePhivolcsHtml(html: string, userLat: number, userLon: number): any[] {
  const earthquakes: any[] = []
  
  try {
    // PHIVOLCS has earthquake data in table rows
    const tableRowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi
    const rows = html.match(tableRowRegex) || []
    
    for (const row of rows) {
      try {
        // Extract data from table cells
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
        const cells: string[] = []
        let match
        
        while ((match = cellRegex.exec(row)) !== null) {
          cells.push(match[1].replace(/<[^>]*>/g, '').trim())
        }
        
        if (cells.length >= 6) {
          // Typical PHIVOLCS format: Date/Time, Latitude, Longitude, Depth, Magnitude, Location
          const dateTime = cells[0]
          const latitude = Number.parseFloat(cells[1])
          const longitude = Number.parseFloat(cells[2])
          const depth = Number.parseFloat(cells[3])
          const magnitude = Number.parseFloat(cells[4])
          const location = cells[5]
          
          if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(magnitude) && magnitude >= 1.5) {
            const time = parsePhivolcsDate(dateTime)
            const distance = calculateDistance(userLat, userLon, latitude, longitude)
            
            const maxDistance = getMaxDistanceForLocation(userLat, userLon, magnitude)
            
            if (distance <= maxDistance) {
              earthquakes.push({
                magnitude,
                depth: isNaN(depth) ? 0 : depth,
                latitude,
                longitude,
                location,
                time,
                distance,
                source: 'PHIVOLCS'
              })
            }
          }
        }
      } catch (e) {
        continue
      }
    }
  } catch (error) {
    console.error("[v0] Error parsing PHIVOLCS data:", error)
  }
  
  return earthquakes.sort((a, b) => a.distance - b.distance)
}

function parsePhivolcsDate(dateStr: string): Date {
  try {
    // Handle PHIVOLCS date formats
    return new Date(dateStr)
  } catch {
    return new Date()
  }
}

async function fetchUsgsData(userLat: number, userLon: number): Promise<any[]> {
  try {
    const usgsUrl = new URL("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")

    const response = await fetch(usgsUrl.toString(), {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "WeatherHub/1.0",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.log("[v0] USGS API returned status:", response.status)
      return []
    }

    const data = await response.json()
    console.log("[v0] USGS API returned", data.features?.length || 0, "earthquakes")

    return parseUsgsData(data, userLat, userLon)
  } catch (error) {
    console.log("[v0] USGS fetch failed:", error instanceof Error ? error.message : String(error))
    return []
  }
}

function parseUsgsData(data: any, userLat: number, userLon: number): any[] {
  const earthquakes: any[] = []

  try {
    if (!data.features || !Array.isArray(data.features)) {
      return earthquakes
    }

    for (const feature of data.features) {
      try {
        const coords = feature.geometry?.coordinates
        const props = feature.properties

        if (!coords || coords.length < 2) continue

        const longitude = coords[0]
        const latitude = coords[1]
        const depth = coords[2] || 0
        const magnitude = props.mag || 0
        const location = props.place || "Unknown"
        const time = new Date(props.time)

        // Philippines region check
        const isInPhilippinesRegion = latitude >= 4.5 && latitude <= 21 && longitude >= 116 && longitude <= 127

        if (isInPhilippinesRegion && magnitude >= 1.5) {
          const distance = calculateDistance(userLat, userLon, latitude, longitude)
          
          const maxDistance = getMaxDistanceForLocation(userLat, userLon, magnitude)
          
          if (distance <= maxDistance) {
            earthquakes.push({
              magnitude,
              depth,
              latitude,
              longitude,
              location,
              time,
              distance,
              source: 'USGS'
            })
          }
        }
      } catch (e) {
        continue
      }
    }
  } catch (error) {
    console.error("[v0] Error parsing USGS data:", error)
  }

  return earthquakes.sort((a, b) => a.distance - b.distance)
}

function getMaxDistanceForLocation(userLat: number, userLon: number, magnitude: number): number {
  // Check if user is in Olongapo City area (tighter thresholds due to GPS accuracy)
  const isOlongapo = userLat >= 14.78 && userLat <= 14.90 && userLon >= 120.24 && userLon <= 120.35
  
  // Base distance thresholds by magnitude
  let maxDistance = 300 // Default
  
  if (magnitude >= 6.0) {
    maxDistance = isOlongapo ? 600 : 800  // Major earthquakes
  } else if (magnitude >= 5.0) {
    maxDistance = isOlongapo ? 400 : 500  // Significant
  } else if (magnitude >= 4.0) {
    maxDistance = isOlongapo ? 250 : 300  // Moderate
  } else if (magnitude >= 3.0) {
    maxDistance = isOlongapo ? 100 : 150  // Minor
  } else if (magnitude >= 2.0) {
    maxDistance = isOlongapo ? 50 : 75    // Small
  } else {
    maxDistance = isOlongapo ? 30 : 50    // Micro
  }
  
  return maxDistance
}

function calculateMeanMagnitudes(earthquakes: any[]): any[] {
  if (earthquakes.length === 0) return []
  
  const groups: any[] = []
  const processed = new Set<number>()
  
  // Group earthquakes within 10km of each other
  for (let i = 0; i < earthquakes.length; i++) {
    if (processed.has(i)) continue
    
    const eq = earthquakes[i]
    const nearby: any[] = [eq]
    processed.add(i)
    
    // Find nearby earthquakes
    for (let j = i + 1; j < earthquakes.length; j++) {
      if (processed.has(j)) continue
      
      const other = earthquakes[j]
      const distance = calculateDistance(eq.latitude, eq.longitude, other.latitude, other.longitude)
      
      // Group earthquakes within 10km
      if (distance <= 10) {
        nearby.push(other)
        processed.add(j)
      }
    }
    
    // Calculate mean magnitude for the group
    const meanMagnitude = nearby.reduce((sum, e) => sum + e.magnitude, 0) / nearby.length
    const maxMagnitude = Math.max(...nearby.map(e => e.magnitude))
    const totalCount = nearby.length
    
    // Use the most recent earthquake in the group as the representative
    const latest = nearby.sort((a, b) => b.time.getTime() - a.time.getTime())[0]
    
    groups.push({
      ...latest,
      magnitude: meanMagnitude,  // Use mean magnitude
      maxMagnitude,              // Keep max for reference
      count: totalCount,         // Number of earthquakes in group
      grouped: totalCount > 1    // Flag if this is a grouped result
    })
  }
  
  return groups
}

function calculateEarthquakeRisk(earthquakes: any[], userLat: number, userLon: number): number {
  if (earthquakes.length === 0) return 5

  let riskScore = 0

  const isOlongapo = userLat >= 14.78 && userLat <= 14.90 && userLon >= 120.24 && userLon <= 120.35

  // Base risk from earthquake count
  const earthquakeCount = earthquakes.length
  riskScore += Math.min(15, earthquakeCount * 1.5)

  // Risk from magnitude (use mean magnitudes)
  const avgMagnitude = earthquakes.reduce((sum: number, eq: any) => sum + eq.magnitude, 0) / earthquakes.length
  const maxMagnitude = Math.max(...earthquakes.map((eq: any) => eq.maxMagnitude || eq.magnitude))
  riskScore += Math.min(25, avgMagnitude * 4)
  riskScore += Math.min(30, maxMagnitude * 5)

  const veryCloseThreshold = isOlongapo ? 30 : 50
  const closeThreshold = isOlongapo ? 75 : 100
  const nearbyThreshold = isOlongapo ? 150 : 200

  const veryCloseEarthquakes = earthquakes.filter((eq: any) => eq.distance < veryCloseThreshold)
  const closeEarthquakes = earthquakes.filter((eq: any) => eq.distance < closeThreshold)
  const nearbyEarthquakes = earthquakes.filter((eq: any) => eq.distance < nearbyThreshold)

  if (veryCloseEarthquakes.length > 0) {
    const maxVeryCloseMagnitude = Math.max(...veryCloseEarthquakes.map((eq: any) => eq.magnitude))
    riskScore += Math.min(40, maxVeryCloseMagnitude * 10 + veryCloseEarthquakes.length * 3)
  } else if (closeEarthquakes.length > 0) {
    const maxCloseMagnitude = Math.max(...closeEarthquakes.map((eq: any) => eq.magnitude))
    riskScore += Math.min(30, maxCloseMagnitude * 7 + closeEarthquakes.length * 2)
  } else if (nearbyEarthquakes.length > 0) {
    const maxNearbyMagnitude = Math.max(...nearbyEarthquakes.map((eq: any) => eq.magnitude))
    riskScore += Math.min(20, maxNearbyMagnitude * 4 + nearbyEarthquakes.length * 1)
  }

  // Risk from very recent earthquakes (last 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const veryRecentEarthquakes = earthquakes.filter((eq: any) => eq.time.getTime() > oneDayAgo)
  if (veryRecentEarthquakes.length > 0) {
    const recentMaxMag = Math.max(...veryRecentEarthquakes.map((eq: any) => eq.magnitude))
    riskScore += Math.min(20, veryRecentEarthquakes.length * 4 + recentMaxMag * 2)
  }

  return Math.min(100, Math.round(riskScore))
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  try {
    console.log("[v0] Fetching earthquake data for coordinates:", lat, lon)

    const userLat = Number.parseFloat(lat)
    const userLon = Number.parseFloat(lon)

    let earthquakes = await fetchPhivolcsData(userLat, userLon)
    
    // Fallback to USGS if PHIVOLCS fails
    if (earthquakes.length === 0) {
      console.log("[v0] PHIVOLCS returned no data, falling back to USGS")
      earthquakes = await fetchUsgsData(userLat, userLon)
    }

    const earthquakesWithMean = calculateMeanMagnitudes(earthquakes)
    
    console.log("[v0] Processed", earthquakesWithMean.length, "earthquake groups with mean magnitudes")

    // Filter for recent earthquakes (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentEarthquakes = earthquakesWithMean
      .filter((eq: any) => eq.time.getTime() > sevenDaysAgo)
      .sort((a: any, b: any) => b.time.getTime() - a.time.getTime())

    const earthquakeRisk = calculateEarthquakeRisk(recentEarthquakes, userLat, userLon)

    console.log(
      "[v0] Calculated earthquake risk:",
      earthquakeRisk,
      "from",
      recentEarthquakes.length,
      "earthquake groups",
    )

    return NextResponse.json({
      earthquakes: recentEarthquakes.slice(0, 10),
      earthquakeRisk,
      recentEarthquakes,
    })
  } catch (error) {
    console.error("[v0] Earthquake API error:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({
      earthquakes: [],
      earthquakeRisk: 5,
      recentEarthquakes: [],
    })
  }
}
