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
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=Asia/Manila`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch weather data")
    }

    const data = await response.json()
    const current = data.current

    const weatherCondition = mapWeatherCode(current.weather_code)

    const weatherData = {
      temperature: Math.round(current.temperature_2m),
      condition: weatherCondition.main,
      description: weatherCondition.description,
      location: `${Number.parseFloat(lat).toFixed(2)}, ${Number.parseFloat(lon).toFixed(2)}`, // Open-Meteo doesn't provide location names
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m * 3.6), // Convert m/s to km/h
      visibility: 10, // Default visibility as Open-Meteo doesn't provide this
      pressure: Math.round(current.surface_pressure),
      feelsLike: Math.round(current.apparent_temperature),
      icon: weatherCondition.icon,
    }

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
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
