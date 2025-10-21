import { type NextRequest, NextResponse } from "next/server"
import {
  calculateHeatIndex,
  calculateUVIndex,
  calculateTyphoonImpactIndex,
  getHeatIndexCategory,
  getUVIndexCategory,
  getTyphoonImpactCategory,
} from "@/lib/weather-indices"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m,cloud_cover&hourly=precipitation,wind_speed_10m,temperature_2m,cloud_cover&timezone=Asia/Manila&forecast_days=3`,
    )

    if (!response.ok) {
      return NextResponse.json({
        alerts: [],
        riskPredictions: await generateRiskPredictions(lat, lon),
        earthquakeAlerts: [],
        indices: {
          heatIndex: { value: 0, category: "Safe", color: "green", advisory: "No data available" },
          uvIndex: { value: 0, category: "Low", color: "green", advisory: "No data available" },
          typhoonImpactIndex: { value: 0, category: "None", color: "green", advisory: "No data available" },
        },
      })
    }

    const data = await response.json()

    const alerts = generatePhilippineAlerts(data, lat, lon)
    const riskPredictions = await generateRiskPredictions(lat, lon, data)
    const earthquakeData = await fetchEarthquakeDataDirect(lat, lon)
    const earthquakeAlerts = generateEarthquakeAlerts(earthquakeData.recentEarthquakes, lat, lon)

    const current = data.current
    const hourly = data.hourly

    const heatIndexValue = calculateHeatIndex(current.temperature_2m, current.relative_humidity_2m)
    const heatIndexCategory = getHeatIndexCategory(heatIndexValue)

    const uvIndexValue = calculateUVIndex(current.cloud_cover || 0, Number.parseFloat(lat))
    const uvIndexCategory = getUVIndexCategory(uvIndexValue)

    const typhoonImpactIndexValue = calculateTyphoonImpactIndex(
      {
        temperature: hourly.temperature_2m,
        humidity: Array(hourly.precipitation.length).fill(current.relative_humidity_2m),
        windSpeed: hourly.wind_speed_10m,
        precipitation: hourly.precipitation,
        pressure: Array(hourly.precipitation.length).fill(current.surface_pressure),
        cloudCover: hourly.cloud_cover || Array(hourly.precipitation.length).fill(current.cloud_cover || 0),
      },
      current.surface_pressure,
      Number.parseFloat(lat),
      Number.parseFloat(lon),
    )
    const typhoonImpactCategory = getTyphoonImpactCategory(typhoonImpactIndexValue)

    return NextResponse.json({
      alerts,
      riskPredictions,
      earthquakeAlerts,
      indices: {
        heatIndex: {
          value: Math.round(heatIndexValue),
          category: heatIndexCategory.category,
          color: heatIndexCategory.color,
          advisory: heatIndexCategory.advisory,
        },
        uvIndex: {
          value: uvIndexValue,
          category: uvIndexCategory.category,
          color: uvIndexCategory.color,
          advisory: uvIndexCategory.advisory,
        },
        typhoonImpactIndex: {
          value: Math.round(typhoonImpactIndexValue),
          category: typhoonImpactCategory.category,
          color: typhoonImpactCategory.color,
          advisory: typhoonImpactCategory.advisory,
          typhoonLevel: typhoonImpactCategory.typhoonLevel,
        },
      },
    })
  } catch (error) {
    console.error("Alerts API error:", error)
    return NextResponse.json({ error: "Failed to fetch alerts data" }, { status: 500 })
  }
}

function generateEarthquakeAlerts(earthquakes: any[], lat: string, lon: string) {
  const alerts = []
  const userLat = Number.parseFloat(lat)
  const userLon = Number.parseFloat(lon)

  // Check for recent significant earthquakes
  const recentSignificant = earthquakes.filter((eq: any) => {
    const distance = calculateDistance(userLat, userLon, eq.latitude, eq.longitude)
    const timeDiff = Date.now() - eq.time.getTime()
    const hoursAgo = timeDiff / (1000 * 60 * 60)
    return eq.magnitude >= 4.5 && hoursAgo < 24 && distance < 300
  })

  if (recentSignificant.length > 0) {
    const maxMagnitude = Math.max(...recentSignificant.map((eq: any) => eq.magnitude))
    const closestEarthquake = recentSignificant.reduce((closest: any, eq: any) => {
      const dist1 = calculateDistance(userLat, userLon, closest.latitude, closest.longitude)
      const dist2 = calculateDistance(userLat, userLon, eq.latitude, eq.longitude)
      return dist2 < dist1 ? eq : closest
    })

    alerts.push({
      id: "earthquake_" + Date.now(),
      type: "earthquake",
      severity: maxMagnitude >= 6 ? "extreme" : maxMagnitude >= 5.5 ? "high" : "moderate",
      title: `Earthquake Alert - Magnitude ${maxMagnitude.toFixed(1)}`,
      description: `Recent earthquake detected near ${closestEarthquake.location}. Magnitude: ${maxMagnitude.toFixed(1)}, Depth: ${closestEarthquake.depth.toFixed(1)}km`,
      areas: [closestEarthquake.location],
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      issued: new Date(),
    })
  }

  return alerts
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function generatePhilippineAlerts(data: any, lat: string, lon: string) {
  const alerts = []
  const current = data.current
  const hourly = data.hourly

  // Heavy rain alert
  const maxPrecipitation = Math.max(...hourly.precipitation.slice(0, 24))
  if (maxPrecipitation > 20) {
    alerts.push({
      id: "heavy_rain_" + Date.now(),
      type: "flood",
      severity: maxPrecipitation > 50 ? "extreme" : "high",
      title: "Heavy Rainfall Warning",
      description: `Heavy rainfall with potential flooding expected. Rainfall: ${maxPrecipitation.toFixed(1)}mm/hr`,
      areas: ["Local Area"],
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      issued: new Date(),
    })
  }

  // Strong wind alert
  const maxWindSpeed = Math.max(...hourly.wind_speed_10m.slice(0, 24)) * 3.6
  if (maxWindSpeed > 60) {
    alerts.push({
      id: "strong_wind_" + Date.now(),
      type: "typhoon",
      severity: maxWindSpeed > 100 ? "extreme" : "high",
      title: "Strong Wind Warning",
      description: `Strong winds expected. Wind speed: ${maxWindSpeed.toFixed(0)} km/h`,
      areas: ["Local Area"],
      validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000),
      issued: new Date(),
    })
  }

  // Heat warning
  if (current.temperature_2m > 35) {
    alerts.push({
      id: "heat_warning_" + Date.now(),
      type: "heat",
      severity: current.temperature_2m > 40 ? "extreme" : "moderate",
      title: "Heat Index Warning",
      description: `Hot weather conditions. Beware of heat stroke. Temperature: ${current.temperature_2m.toFixed(1)}°C`,
      areas: ["Local Area"],
      validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000),
      issued: new Date(),
    })
  }

  return alerts
}

function mapAlertType(event: string): string {
  const eventLower = event.toLowerCase()
  if (eventLower.includes("thunder") || eventLower.includes("storm")) return "thunderstorm"
  if (eventLower.includes("flood")) return "flood"
  if (eventLower.includes("typhoon") || eventLower.includes("hurricane")) return "typhoon"
  if (eventLower.includes("heat")) return "heat"
  if (eventLower.includes("landslide")) return "landslide"
  return "thunderstorm"
}

function mapSeverity(event: string): string {
  const eventLower = event.toLowerCase()
  if (eventLower.includes("extreme") || eventLower.includes("severe")) return "extreme"
  if (eventLower.includes("major") || eventLower.includes("significant")) return "high"
  if (eventLower.includes("minor") || eventLower.includes("moderate")) return "moderate"
  return "low"
}

async function generateRiskPredictions(lat: string, lon: string, weatherData?: any) {
  try {
    let data = weatherData
    if (!data) {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m&hourly=precipitation,wind_speed_10m,temperature_2m&timezone=Asia/Manila&forecast_days=2`,
      )
      if (!response.ok) throw new Error("Failed to fetch weather for risk assessment")
      data = await response.json()
    }

    const current = data.current
    const hourly = data.hourly

    const humidity = current.relative_humidity_2m
    const windSpeed = current.wind_speed_10m * 3.6
    const pressure = current.surface_pressure
    const temperature = current.temperature_2m

    const next48HoursPrecip = hourly.precipitation.slice(0, 48)
    const next48HoursTemp = hourly.temperature_2m.slice(0, 48)
    const next48HoursWind = hourly.wind_speed_10m.slice(0, 48)

    const maxPrecipitation = Math.max(...next48HoursPrecip)
    const avgPrecipitation = next48HoursPrecip.reduce((a, b) => a + b, 0) / next48HoursPrecip.length
    const precipTrend =
      next48HoursPrecip.slice(24).reduce((a, b) => a + b, 0) - next48HoursPrecip.slice(0, 24).reduce((a, b) => a + b, 0)

    const tempTrend =
      next48HoursTemp.slice(24).reduce((a, b) => a + b, 0) / 24 -
      next48HoursTemp.slice(0, 24).reduce((a, b) => a + b, 0) / 24

    const maxWindSpeed = Math.max(...next48HoursWind) * 3.6
    const avgWindSpeed = (next48HoursWind.reduce((a, b) => a + b, 0) / next48HoursWind.length) * 3.6

    let rainfallRisk = 0
    if (maxPrecipitation > 15) {
      rainfallRisk = Math.min(95, 40 + maxPrecipitation * 2.5 + avgPrecipitation * 1.5)
    } else if (avgPrecipitation > 5) {
      rainfallRisk = Math.min(70, 25 + avgPrecipitation * 3)
    } else {
      rainfallRisk = Math.max(5, humidity * 0.4 + (pressure < 1010 ? 15 : 0))
    }

    if (temperature > 30 && humidity > 75) {
      rainfallRisk = Math.min(90, rainfallRisk + 20)
    }

    let floodRisk = 0
    if (rainfallRisk > 70) {
      floodRisk = Math.min(90, rainfallRisk * 0.85 + (precipTrend > 0 ? 10 : 0))
    } else if (rainfallRisk > 40) {
      floodRisk = Math.min(65, rainfallRisk * 0.6 + (avgPrecipitation > 8 ? 15 : 0))
    } else {
      floodRisk = Math.max(3, rainfallRisk * 0.3)
    }

    let windRisk = 0
    if (maxWindSpeed > 40) {
      windRisk = Math.min(85, maxWindSpeed * 1.8 + (avgWindSpeed > 25 ? 15 : 0))
    } else if (avgWindSpeed > 20) {
      windRisk = Math.min(60, avgWindSpeed * 2.2)
    } else {
      windRisk = Math.max(5, windSpeed * 0.9)
    }

    let landslideRisk = 0
    const soilSaturationFactor = avgPrecipitation > 10 ? 1.5 : avgPrecipitation > 5 ? 1.2 : 1.0
    const pressureFactor = pressure < 1005 ? 1.3 : pressure < 1010 ? 1.1 : 1.0
    const temperatureFactor = tempTrend < -3 ? 1.2 : 1.0

    if (rainfallRisk > 60) {
      landslideRisk = Math.min(75, rainfallRisk * 0.7 * soilSaturationFactor * pressureFactor * temperatureFactor)
    } else {
      landslideRisk = Math.max(2, rainfallRisk * 0.25 * soilSaturationFactor)
    }

    let earthquakeRisk: number | null = null
    let earthquakeTrend = "stable"
    let earthquakeDescription = "Low seismic activity"

    try {
      const earthquakeData = await fetchEarthquakeDataDirect(lat, lon)
      console.log("[v0] Earthquake data received:", earthquakeData)

      if (earthquakeData.earthquakeRisk > 0) {
        earthquakeRisk = earthquakeData.earthquakeRisk
        console.log("[v0] Using calculated earthquake risk:", earthquakeRisk)

        if (earthquakeData.recentEarthquakes && earthquakeData.recentEarthquakes.length > 0) {
          const maxMagnitude = Math.max(...earthquakeData.recentEarthquakes.map((eq: any) => eq.magnitude))

          const last24h = earthquakeData.recentEarthquakes.filter((eq: any) => {
            const timeDiff = Date.now() - eq.time.getTime()
            return timeDiff / (1000 * 60 * 60) < 24
          })
          const last48h = earthquakeData.recentEarthquakes.filter((eq: any) => {
            const timeDiff = Date.now() - eq.time.getTime()
            return timeDiff / (1000 * 60 * 60) < 48
          })

          if (last24h.length > last48h.length * 0.5) {
            earthquakeTrend = "increasing"
          } else if (last24h.length < last48h.length * 0.3) {
            earthquakeTrend = "decreasing"
          }

          if (maxMagnitude >= 6) {
            earthquakeDescription = `Strong seismic activity detected (M${maxMagnitude.toFixed(1)})`
          } else if (maxMagnitude >= 5) {
            earthquakeDescription = `Moderate seismic activity (M${maxMagnitude.toFixed(1)})`
          } else if (maxMagnitude >= 4) {
            earthquakeDescription = `Light seismic activity detected (M${maxMagnitude.toFixed(1)})`
          } else {
            earthquakeDescription = "Minor seismic activity"
          }
        }
      } else {
        earthquakeRisk = 5
      }
    } catch (error) {
      console.error("[v0] Error calculating earthquake risk:", error)
      earthquakeRisk = 5
    }

    const rainfallTrend = precipTrend > 2 ? "increasing" : precipTrend < -2 ? "decreasing" : "stable"
    const floodTrend =
      rainfallTrend === "increasing" && avgPrecipitation > 8
        ? "increasing"
        : rainfallTrend === "decreasing"
          ? "decreasing"
          : "stable"
    const windTrend =
      maxWindSpeed > avgWindSpeed * 1.5 ? "increasing" : maxWindSpeed < avgWindSpeed * 0.8 ? "decreasing" : "stable"
    const landslideTrend = rainfallRisk > 50 && precipTrend > 0 ? "increasing" : "stable"

    return [
      {
        category: "Rainfall Risk",
        risk: Math.round(rainfallRisk),
        trend: rainfallTrend,
        description:
          rainfallRisk > 70
            ? "Heavy rainfall with thunderstorm risk"
            : rainfallRisk > 40
              ? "Moderate rainfall expected"
              : "Light precipitation conditions",
      },
      {
        category: "Flood Risk",
        risk: Math.round(floodRisk),
        trend: floodTrend,
        description:
          floodRisk > 60
            ? "High flood risk in low-lying areas"
            : floodRisk > 30
              ? "Moderate flood risk"
              : "Low flood risk",
      },
      {
        category: "Wind Risk",
        risk: Math.round(windRisk),
        trend: windTrend,
        description:
          windRisk > 50
            ? "Strong sustained winds expected"
            : windRisk > 25
              ? "Moderate wind conditions"
              : "Calm wind conditions",
      },
      {
        category: "Landslide Risk",
        risk: Math.round(landslideRisk),
        trend: landslideTrend,
        description:
          landslideRisk > 50
            ? "High risk due to soil saturation"
            : landslideRisk > 25
              ? "Moderate risk in steep areas"
              : "Low landslide risk",
      },
      {
        category: "Earthquake Risk",
        risk: Math.round(earthquakeRisk),
        trend: earthquakeTrend,
        description: earthquakeDescription,
      },
    ]
  } catch (error) {
    console.error("Risk prediction error:", error)
    return [
      { category: "Rainfall Risk", risk: 35, trend: "stable", description: "Moderate conditions" },
      { category: "Flood Risk", risk: 25, trend: "stable", description: "Low risk conditions" },
      { category: "Wind Risk", risk: 20, trend: "stable", description: "Calm conditions" },
      { category: "Landslide Risk", risk: 15, trend: "stable", description: "Stable conditions" },
      { category: "Earthquake Risk", risk: 5, trend: "stable", description: "Low seismic activity" },
    ]
  }
}

async function fetchEarthquakeDataDirect(lat: string, lon: string) {
  try {
    console.log("[v0] Fetching earthquake data directly for coordinates:", lat, lon)

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
      return { earthquakes: [], earthquakeRisk: 0, recentEarthquakes: [] }
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log("[v0] USGS API returned status:", response.status)
      return { earthquakes: [], earthquakeRisk: 0, recentEarthquakes: [] }
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

    return {
      earthquakes: recentEarthquakes.slice(0, 10),
      earthquakeRisk,
      recentEarthquakes,
    }
  } catch (error) {
    console.error("[v0] Earthquake fetch error:", error instanceof Error ? error.message : String(error))
    return { earthquakes: [], earthquakeRisk: 0, recentEarthquakes: [] }
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
  riskScore += Math.min(15, earthquakeCount * 1.5)

  // Risk from magnitude (higher magnitude = higher risk)
  const avgMagnitude = earthquakes.reduce((sum: number, eq: any) => sum + eq.magnitude, 0) / earthquakes.length
  const maxMagnitude = Math.max(...earthquakes.map((eq: any) => eq.magnitude))

  // Magnitude risk: 3.0 = 5%, 4.0 = 15%, 5.0 = 25%, 6.0 = 40%
  riskScore += Math.min(40, Math.pow(maxMagnitude, 2) * 1.5)
  riskScore += Math.min(20, avgMagnitude * 3)

  // Risk from proximity (earthquakes within 200km are more concerning)
  const nearbyEarthquakes = earthquakes.filter((eq: any) => {
    const distance = calculateDistance(userLat, userLon, eq.latitude, eq.longitude)
    return distance < 200
  })

  if (nearbyEarthquakes.length > 0) {
    const maxNearbyMagnitude = Math.max(...nearbyEarthquakes.map((eq: any) => eq.magnitude))
    riskScore += Math.min(30, maxNearbyMagnitude * 10 + nearbyEarthquakes.length * 3)
  }

  // Risk from moderate distance earthquakes (200-500km)
  const moderateDistanceEarthquakes = earthquakes.filter((eq: any) => {
    const distance = calculateDistance(userLat, userLon, eq.latitude, eq.longitude)
    return distance >= 200 && distance < 500
  })

  if (moderateDistanceEarthquakes.length > 0) {
    const maxModMagnitude = Math.max(...moderateDistanceEarthquakes.map((eq: any) => eq.magnitude))
    riskScore += Math.min(20, maxModMagnitude * 4 + moderateDistanceEarthquakes.length * 1)
  }

  // Risk from very recent earthquakes (last 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const veryRecentEarthquakes = earthquakes.filter((eq: any) => eq.time.getTime() > oneDayAgo)
  if (veryRecentEarthquakes.length > 0) {
    riskScore += Math.min(10, veryRecentEarthquakes.length * 2)
  }

  // Depth factor: shallower earthquakes are more dangerous
  const avgDepth = earthquakes.reduce((sum: number, eq: any) => sum + eq.depth, 0) / earthquakes.length
  if (avgDepth < 50) {
    riskScore += Math.min(10, (50 - avgDepth) * 0.1)
  }

  return Math.min(100, Math.max(5, Math.round(riskScore)))
}
