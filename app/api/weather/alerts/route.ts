import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m&hourly=precipitation,wind_speed_10m&timezone=Asia/Manila&forecast_days=3`,
    )

    if (!response.ok) {
      return NextResponse.json({ alerts: [], riskPredictions: await generateRiskPredictions(lat, lon) })
    }

    const data = await response.json()

    const alerts = generatePhilippineAlerts(data, lat, lon)
    const riskPredictions = await generateRiskPredictions(lat, lon, data)

    return NextResponse.json({ alerts, riskPredictions })
  } catch (error) {
    console.error("Alerts API error:", error)
    return NextResponse.json({ error: "Failed to fetch alerts data" }, { status: 500 })
  }
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
      description: `Malakas na ulan na may kasamang pagbaha ay inaasahan. Heavy rainfall with potential flooding expected. Rainfall: ${maxPrecipitation.toFixed(1)}mm/hr`,
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
      description: `Malakas na hangin ay inaasahan. Strong winds expected. Wind speed: ${maxWindSpeed.toFixed(0)} km/h`,
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
      description: `Mainit na panahon. Mag-ingat sa heat stroke. Hot weather conditions. Beware of heat stroke. Temperature: ${current.temperature_2m.toFixed(1)}°C`,
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
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m&hourly=precipitation,wind_speed_10m&timezone=Asia/Manila&forecast_days=1`,
      )
      if (!response.ok) throw new Error("Failed to fetch weather for risk assessment")
      data = await response.json()
    }

    const current = data.current
    const hourly = data.hourly

    const humidity = current.relative_humidity_2m
    const windSpeed = current.wind_speed_10m * 3.6 // Convert to km/h
    const pressure = current.surface_pressure
    const maxPrecipitation = Math.max(...hourly.precipitation.slice(0, 24))

    const rainfallRisk = maxPrecipitation > 10 ? Math.min(90, 30 + maxPrecipitation * 2) : Math.max(10, humidity * 0.3)

    const floodRisk = rainfallRisk > 60 ? Math.min(85, rainfallRisk * 0.8) : Math.max(5, rainfallRisk * 0.4)

    const windRisk = windSpeed > 30 ? Math.min(80, windSpeed * 1.5) : Math.max(10, windSpeed * 0.8)

    const landslideRisk =
      rainfallRisk > 70 && pressure < 1010 ? Math.min(70, rainfallRisk * 0.6) : Math.max(5, rainfallRisk * 0.2)

    return [
      {
        category: "Rainfall Risk",
        risk: Math.round(rainfallRisk),
        trend: rainfallRisk > 60 ? "increasing" : rainfallRisk < 30 ? "decreasing" : "stable",
        description: rainfallRisk > 60 ? "Heavy rainfall expected" : "Light to moderate rainfall",
      },
      {
        category: "Flood Risk",
        risk: Math.round(floodRisk),
        trend: floodRisk > 50 ? "increasing" : "stable",
        description: floodRisk > 50 ? "Moderate to high flood risk" : "Low flood risk",
      },
      {
        category: "Wind Risk",
        risk: Math.round(windRisk),
        trend: windSpeed > 25 ? "increasing" : "decreasing",
        description: windSpeed > 25 ? "Strong winds expected" : "Moderate wind conditions",
      },
      {
        category: "Landslide Risk",
        risk: Math.round(landslideRisk),
        trend: landslideRisk > 40 ? "increasing" : "stable",
        description: landslideRisk > 40 ? "Increased risk due to conditions" : "Low landslide risk",
      },
    ]
  } catch (error) {
    console.error("Risk prediction error:", error)
    return [
      { category: "Rainfall Risk", risk: 35, trend: "stable", description: "Moderate conditions" },
      { category: "Flood Risk", risk: 25, trend: "stable", description: "Low risk conditions" },
      { category: "Wind Risk", risk: 20, trend: "stable", description: "Calm conditions" },
      { category: "Landslide Risk", risk: 15, trend: "stable", description: "Stable conditions" },
    ]
  }
}
