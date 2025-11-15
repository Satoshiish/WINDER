export interface Weather {
  temperature: number
  condition: string
  description?: string
  location: string
  humidity: number
  windSpeed: number
  visibility?: number
  feelsLike?: number
  icon?: string
  lastUpdated?: string
  latitude?: number
  longitude?: number
}

export interface HourlyForecastEntry {
  time: string
  temp: string | number
  icon?: string
}

export interface WeatherIndex {
  value: number
  category: string
  color: string
  advisory: string
  typhoonLevel?: string
}

export interface WeatherCardProps {
  latitude?: number
  longitude?: number
  hourlyForecast?: HourlyForecastEntry[]
  location?: string
  temperature?: number
  condition?: string
  humidity?: number
  windSpeed?: number
  alertLevel?: "low" | "medium" | "high"
  heatIndex?: WeatherIndex
  floodRiskIndex?: WeatherIndex
  typhoonImpactIndex?: WeatherIndex
}

export interface RiskPrediction {
  category: string
  risk: number
  trend: "increasing" | "decreasing" | "stable"
  description: string
}

export interface WeatherIndices {
  heatIndex?: WeatherIndex
  uvIndex?: WeatherIndex
  typhoonImpactIndex?: WeatherIndex
}

export interface Alert {
  id?: string
  type?: string
  severity?: string
  title?: string
  description?: string
  areas?: string[]
  validUntil?: string | Date
  issued?: string | Date
}

export interface User {
  id: string
  name?: string
  phone?: string
  email?: string
  role?: string
}
