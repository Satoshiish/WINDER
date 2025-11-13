import { type NextRequest, NextResponse } from "next/server"

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

    const usgsUrl = new URL("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    let response
    try {
      response = await fetch(usgsUrl.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent": "WeatherHub/1.0",
          Accept: "application/json",
        },
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.log("[v0] USGS API fetch failed, using fallback data")
      // Return fallback data if fetch fails
      return NextResponse.json({
        earthquakes: [],
        earthquakeRisk: 5,
        recentEarthquakes: [],
      })
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log("[v0] USGS API returned status:", response.status)
      return NextResponse.json({
        earthquakes: [],
        earthquakeRisk: 5,
        recentEarthquakes: [],
      })
    }

    const data = await response.json()
    console.log("[v0] USGS API returned", data.features?.length || 0, "earthquakes")

    const earthquakes = parseUsgsData(data, userLat, userLon)
    console.log("[v0] Parsed", earthquakes.length, "earthquakes from USGS")

    // Filter for recent earthquakes (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentEarthquakes = earthquakes
      .filter((eq: any) => eq.time.getTime() > sevenDaysAgo)
      .sort((a: any, b: any) => b.time.getTime() - a.time.getTime())

    // Calculate earthquake risk based on recent activity
    const earthquakeRisk = calculateEarthquakeRisk(recentEarthquakes, userLat, userLon)

    console.log(
      "[v0] Calculated earthquake risk:",
      earthquakeRisk,
      "from",
      recentEarthquakes.length,
      "recent earthquakes",
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

function parseUsgsData(data: any, userLat: number, userLon: number): any[] {
  const earthquakes: any[] = []

  try {
    if (!data.features || !Array.isArray(data.features)) {
      console.log("[v0] No features found in USGS response")
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

        // Calculate distance from user first
        const distance = calculateDistance(userLat, userLon, latitude, longitude)

        // Enhanced filtering logic with thresholds:
        // 1. Must be in Philippines region (with extended buffer for nearby areas)
        const isInPhilippinesRegion = latitude >= 4.5 && latitude <= 21 && longitude >= 116 && longitude <= 127

        // 2. Distance-based filtering with magnitude consideration
        // - Higher magnitude earthquakes are relevant from farther away
        // - Lower magnitude earthquakes only matter if they're close
        let maxRelevantDistance = 300 // Base: 300km for any earthquake

        if (magnitude >= 6.0) {
          maxRelevantDistance = 800 // Major earthquakes felt up to 800km away
        } else if (magnitude >= 5.0) {
          maxRelevantDistance = 500 // Significant earthquakes up to 500km
        } else if (magnitude >= 4.0) {
          maxRelevantDistance = 300 // Moderate earthquakes up to 300km
        } else if (magnitude >= 3.0) {
          maxRelevantDistance = 150 // Minor earthquakes up to 150km
        } else if (magnitude >= 2.0) {
          maxRelevantDistance = 75 // Small earthquakes up to 75km
        } else {
          maxRelevantDistance = 50 // Micro earthquakes only within 50km
        }

        // Only include earthquakes that are:
        // - In Philippines region
        // - Within relevant distance based on magnitude
        // - Magnitude >= 1.5 (filter out micro tremors)
        if (isInPhilippinesRegion && distance <= maxRelevantDistance && magnitude >= 1.5) {
          earthquakes.push({
            magnitude,
            depth,
            latitude,
            longitude,
            location,
            time,
            distance,
          })
        }
      } catch (e) {
        continue
      }
    }
  } catch (error) {
    console.error("[v0] Error parsing USGS data:", error)
  }

  // Sort by distance (closest first)
  return earthquakes.sort((a, b) => a.distance - b.distance)
}

function calculateEarthquakeRisk(earthquakes: any[], userLat: number, userLon: number): number {
  if (earthquakes.length === 0) return 5

  let riskScore = 0

  // Base risk from earthquake count (more earthquakes = higher risk)
  const earthquakeCount = earthquakes.length
  riskScore += Math.min(15, earthquakeCount * 1.5)

  // Risk from magnitude (higher magnitude = higher risk)
  const avgMagnitude = earthquakes.reduce((sum: number, eq: any) => sum + eq.magnitude, 0) / earthquakes.length
  const maxMagnitude = Math.max(...earthquakes.map((eq: any) => eq.magnitude))
  riskScore += Math.min(25, avgMagnitude * 4)
  riskScore += Math.min(30, maxMagnitude * 5)

  // Enhanced proximity-based risk with graduated thresholds
  const veryCloseEarthquakes = earthquakes.filter((eq: any) => eq.distance < 50) // Within 50km
  const closeEarthquakes = earthquakes.filter((eq: any) => eq.distance < 100) // Within 100km
  const nearbyEarthquakes = earthquakes.filter((eq: any) => eq.distance < 200) // Within 200km

  if (veryCloseEarthquakes.length > 0) {
    const maxVeryCloseMagnitude = Math.max(...veryCloseEarthquakes.map((eq: any) => eq.magnitude))
    // Very close earthquakes have the highest impact
    riskScore += Math.min(40, maxVeryCloseMagnitude * 10 + veryCloseEarthquakes.length * 3)
  } else if (closeEarthquakes.length > 0) {
    const maxCloseMagnitude = Math.max(...closeEarthquakes.map((eq: any) => eq.magnitude))
    // Close earthquakes have moderate impact
    riskScore += Math.min(30, maxCloseMagnitude * 7 + closeEarthquakes.length * 2)
  } else if (nearbyEarthquakes.length > 0) {
    const maxNearbyMagnitude = Math.max(...nearbyEarthquakes.map((eq: any) => eq.magnitude))
    // Nearby earthquakes have lower impact
    riskScore += Math.min(20, maxNearbyMagnitude * 4 + nearbyEarthquakes.length * 1)
  }

  // Risk from very recent earthquakes (last 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const veryRecentEarthquakes = earthquakes.filter((eq: any) => eq.time.getTime() > oneDayAgo)
  if (veryRecentEarthquakes.length > 0) {
    const recentMaxMag = Math.max(...veryRecentEarthquakes.map((eq: any) => eq.magnitude))
    // Recent activity increases risk, especially if magnitude is high
    riskScore += Math.min(20, veryRecentEarthquakes.length * 4 + recentMaxMag * 2)
  }

  // Cap the risk score at 100
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
