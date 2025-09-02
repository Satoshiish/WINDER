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
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean&timezone=Asia/Manila&forecast_days=7`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch forecast data")
    }

    const data = await response.json()
    const daily = data.daily

    const dailyForecasts = []

    for (let i = 0; i < daily.time.length; i++) {
      const weatherCondition = mapWeatherCode(daily.weather_code[i])

      dailyForecasts.push({
        date: daily.time[i] + "T00:00:00.000Z",
        temperature: {
          min: Math.round(daily.temperature_2m_min[i]),
          max: Math.round(daily.temperature_2m_max[i]),
        },
        humidity: Math.round(daily.relative_humidity_2m_mean[i]),
        windSpeed: Math.round(daily.wind_speed_10m_max[i] * 3.6), // Convert m/s to km/h
        rainfall: Math.round(daily.precipitation_sum[i]),
        condition: weatherCondition.main,
        description: weatherCondition.description,
        icon: weatherCondition.icon,
      })
    }

    return NextResponse.json({ forecasts: dailyForecasts })
  } catch (error) {
    console.error("Forecast API error:", error)
    return NextResponse.json({ error: "Failed to fetch forecast data" }, { status: 500 })
  }
}

function mapWeatherCode(code: number) {
  const weatherCodes: { [key: number]: { main: string; description: string; icon: string } } = {
    0: { main: "Clear", description: "Clear sky", icon: "01d" },
    1: { main: "Clear", description: "Mainly clear", icon: "01d" },
    2: { main: "Clouds", description: "Partly cloudy", icon: "02d" },
    3: { main: "Clouds", description: "Overcast", icon: "03d" },
    45: { main: "Fog", description: "Fog", icon: "50d" },
    48: { main: "Fog", description: "Depositing rime fog", icon: "50d" },
    51: { main: "Drizzle", description: "Light drizzle", icon: "09d" },
    53: { main: "Drizzle", description: "Moderate drizzle", icon: "09d" },
    55: { main: "Drizzle", description: "Dense drizzle", icon: "09d" },
    61: { main: "Rain", description: "Slight rain", icon: "10d" },
    63: { main: "Rain", description: "Moderate rain", icon: "10d" },
    65: { main: "Rain", description: "Heavy rain", icon: "10d" },
    80: { main: "Rain", description: "Slight rain showers", icon: "09d" },
    81: { main: "Rain", description: "Moderate rain showers", icon: "09d" },
    82: { main: "Rain", description: "Violent rain showers", icon: "09d" },
    95: { main: "Thunderstorm", description: "Thunderstorm", icon: "11d" },
    96: { main: "Thunderstorm", description: "Thunderstorm with slight hail", icon: "11d" },
    99: { main: "Thunderstorm", description: "Thunderstorm with heavy hail", icon: "11d" },
  }

  return weatherCodes[code] || { main: "Unknown", description: "Unknown conditions", icon: "01d" }
}
