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

        const isPhilippines = latitude >= 5 && latitude <= 20 && longitude >= 120 && longitude <= 130

        // Only include earthquakes with magnitude >= 2.0 in Philippines region
        if (isPhilippines && magnitude >= 2.0) {
          const distance = calculateDistance(userLat, userLon, latitude, longitude)

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

  return earthquakes
}

function calculateEarthquakeRisk(earthquakes: any[], userLat: number, userLon: number): number {
  if (earthquakes.length === 0) return 5

  let riskScore = 0

  // Base risk from earthquake count (more earthquakes = higher risk)
  const earthquakeCount = earthquakes.length
  riskScore += Math.min(20, earthquakeCount * 2)

  // Risk from magnitude (higher magnitude = higher risk)
  const avgMagnitude = earthquakes.reduce((sum: number, eq: any) => sum + eq.magnitude, 0) / earthquakes.length
  const maxMagnitude = Math.max(...earthquakes.map((eq: any) => eq.magnitude))
  riskScore += Math.min(30, avgMagnitude * 5)
  riskScore += Math.min(25, maxMagnitude * 3)

  // Risk from proximity (earthquakes within 100km are more concerning)
  const nearbyEarthquakes = earthquakes.filter((eq: any) => {
    const distance = calculateDistance(userLat, userLon, eq.latitude, eq.longitude)
    return distance < 100
  })

  if (nearbyEarthquakes.length > 0) {
    const maxNearbyMagnitude = Math.max(...nearbyEarthquakes.map((eq: any) => eq.magnitude))
    riskScore += Math.min(35, maxNearbyMagnitude * 8 + nearbyEarthquakes.length * 2)
  }

  // Risk from very recent earthquakes (last 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const veryRecentEarthquakes = earthquakes.filter((eq: any) => eq.time.getTime() > oneDayAgo)
  if (veryRecentEarthquakes.length > 0) {
    riskScore += Math.min(15, veryRecentEarthquakes.length * 3)
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
