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
    const windSpeed = current.wind_speed_10m * 3.6 // Convert to km/h
    const pressure = current.surface_pressure
    const temperature = current.temperature_2m

    // Analyze 48-hour precipitation patterns
    const next48HoursPrecip = hourly.precipitation.slice(0, 48)
    const next48HoursTemp = hourly.temperature_2m.slice(0, 48)
    const next48HoursWind = hourly.wind_speed_10m.slice(0, 48)

    const maxPrecipitation = Math.max(...next48HoursPrecip)
    const avgPrecipitation = next48HoursPrecip.reduce((a, b) => a + b, 0) / next48HoursPrecip.length
    const precipTrend =
      next48HoursPrecip.slice(24).reduce((a, b) => a + b, 0) - next48HoursPrecip.slice(0, 24).reduce((a, b) => a + b, 0)

    // Temperature trend analysis
    const tempTrend =
      next48HoursTemp.slice(24).reduce((a, b) => a + b, 0) / 24 -
      next48HoursTemp.slice(0, 24).reduce((a, b) => a + b, 0) / 24

    // Wind pattern analysis
    const maxWindSpeed = Math.max(...next48HoursWind) * 3.6
    const avgWindSpeed = (next48HoursWind.reduce((a, b) => a + b, 0) / next48HoursWind.length) * 3.6

    // Enhanced rainfall risk with compound factors
    let rainfallRisk = 0
    if (maxPrecipitation > 15) {
      rainfallRisk = Math.min(95, 40 + maxPrecipitation * 2.5 + avgPrecipitation * 1.5)
    } else if (avgPrecipitation > 5) {
      rainfallRisk = Math.min(70, 25 + avgPrecipitation * 3)
    } else {
      rainfallRisk = Math.max(5, humidity * 0.4 + (pressure < 1010 ? 15 : 0))
    }

    // Add thunderstorm compound factor (high temp + high humidity)
    if (temperature > 30 && humidity > 75) {
      rainfallRisk = Math.min(90, rainfallRisk + 20)
    }

    // Enhanced flood risk with trend analysis
    let floodRisk = 0
    if (rainfallRisk > 70) {
      floodRisk = Math.min(90, rainfallRisk * 0.85 + (precipTrend > 0 ? 10 : 0))
    } else if (rainfallRisk > 40) {
      floodRisk = Math.min(65, rainfallRisk * 0.6 + (avgPrecipitation > 8 ? 15 : 0))
    } else {
      floodRisk = Math.max(3, rainfallRisk * 0.3)
    }

    // Enhanced wind risk with sustained wind analysis
    let windRisk = 0
    if (maxWindSpeed > 40) {
      windRisk = Math.min(85, maxWindSpeed * 1.8 + (avgWindSpeed > 25 ? 15 : 0))
    } else if (avgWindSpeed > 20) {
      windRisk = Math.min(60, avgWindSpeed * 2.2)
    } else {
      windRisk = Math.max(5, windSpeed * 0.9)
    }

    // Enhanced landslide risk with multiple factors
    let landslideRisk = 0
    const soilSaturationFactor = avgPrecipitation > 10 ? 1.5 : avgPrecipitation > 5 ? 1.2 : 1.0
    const pressureFactor = pressure < 1005 ? 1.3 : pressure < 1010 ? 1.1 : 1.0
    const temperatureFactor = tempTrend < -3 ? 1.2 : 1.0 // Rapid cooling can destabilize soil

    if (rainfallRisk > 60) {
      landslideRisk = Math.min(75, rainfallRisk * 0.7 * soilSaturationFactor * pressureFactor * temperatureFactor)
    } else {
      landslideRisk = Math.max(2, rainfallRisk * 0.25 * soilSaturationFactor)
    }

    // Determine trends based on 48-hour analysis
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
