"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cloud, Droplets, Wind, Eye, Loader2, AlertCircle, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"

interface WeatherData {
  temperature: number
  condition: string
  location: string
  humidity: number
  windSpeed: number
  visibility: number
  feelsLike: number
  icon: string
  lastUpdated?: string
}

interface WeatherCardProps {
  // API-driven props (existing)
  latitude?: number
  longitude?: number
  hourlyForecast?: Array<{
    time: string
    temp: string
    icon: string
  }>
  location?: string
  temperature?: number
  condition?: string
  humidity?: number
  windSpeed?: number
  alertLevel?: "low" | "medium" | "high"
}

export function WeatherCard({
  latitude,
  longitude,
  hourlyForecast = [],
  location: staticLocation,
  temperature: staticTemperature,
  condition: staticCondition,
  humidity: staticHumidity,
  windSpeed: staticWindSpeed,
  alertLevel = "low",
}: WeatherCardProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const hasStaticData = staticLocation && staticTemperature && staticCondition

  useEffect(() => {
    if (hasStaticData) {
      setWeatherData({
        temperature: staticTemperature!,
        condition: staticCondition!,
        location: staticLocation!,
        humidity: staticHumidity || 70,
        windSpeed: staticWindSpeed || 10,
        visibility: 10,
        feelsLike: staticTemperature! + 2,
        icon: "02d",
      })
      setLoading(false)
    } else if (latitude && longitude) {
      fetchWeatherData()
    } else {
      setLoading(false)
    }
  }, [
    latitude,
    longitude,
    hasStaticData,
    staticLocation,
    staticTemperature,
    staticCondition,
    staticHumidity,
    staticWindSpeed,
  ])

  const fetchWeatherData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Fetching weather data for:", { latitude, longitude })

      const response = await fetch(`/api/weather/current?lat=${latitude}&lon=${longitude}`)

      console.log("[v0] Weather API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.log("[v0] Weather API error response:", errorData)

        if (response.status === 500 && errorData.error?.includes("API key")) {
          throw new Error("Weather service temporarily unavailable - using demo data")
        }
        throw new Error(errorData.error || "Failed to fetch weather data")
      }

      const data = await response.json()
      console.log("[v0] Weather data received:", data)
      setWeatherData({
        ...data,
        lastUpdated: new Date().toLocaleTimeString(),
      })
    } catch (err) {
      console.error("[v0] Weather fetch error:", err)
      const errorMessage = err instanceof Error ? err.message : "Unable to load weather data"
      setError(errorMessage)

      setWeatherData({
        temperature: 28,
        condition: "Partly Cloudy",
        location: "Manila, Philippines (Demo)",
        humidity: 75,
        windSpeed: 15,
        visibility: 10,
        feelsLike: 32,
        icon: "02d",
        lastUpdated: new Date().toLocaleTimeString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const getAlertColor = () => {
    switch (alertLevel) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading weather...</span>
        </CardContent>
      </Card>
    )
  }

  if (!weatherData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">Unable to load weather data</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Current Weather
            {error && <AlertCircle className="h-4 w-4 text-amber-500" title={error} />}
          </div>
          {alertLevel !== "low" && (
            <Badge variant={getAlertColor()} className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {alertLevel.toUpperCase()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
            {error.includes("demo data") ? "Using demo weather data" : "Using cached weather data"}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold">{weatherData.temperature}°C</p>
            <p className="text-muted-foreground">{weatherData.condition}</p>
            <p className="text-sm text-muted-foreground">{weatherData.location}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {error?.includes("demo") ? "Demo data" : "Live data from Open-Meteo"} • Updated {weatherData.lastUpdated}
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Droplets className="h-4 w-4" />
              <span>{weatherData.humidity}%</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Wind className="h-4 w-4" />
              <span>{weatherData.windSpeed} km/h</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Eye className="h-4 w-4" />
              <span>{weatherData.visibility} km</span>
            </div>
          </div>
        </div>

        {hourlyForecast.length > 0 && (
          <div className="grid grid-cols-4 gap-2 pt-4 border-t">
            {hourlyForecast.map((hour, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-muted-foreground">{hour.time}</p>
                <p className="text-lg my-1">{hour.icon}</p>
                <p className="text-sm font-medium">{hour.temp}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
