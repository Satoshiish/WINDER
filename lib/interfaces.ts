export interface WeatherData {
  temperature: number
  condition: string
  description?: string
  location: string
  humidity: number
  windSpeed: number
  visibility: number
  feelsLike: number
  icon: string
  lastUpdated?: string
}

export interface WeatherIndex {
  value: number
  category: string
  color: string
  advisory: string
  typhoonLevel?: string
}

export interface HourlyForecast {
  time: string
  temp: string
  icon: string
}

export type AlertLevel = "low" | "medium" | "high"

export interface WeatherCardProps {
  latitude?: number
  longitude?: number
  hourlyForecast?: HourlyForecast[]
  location?: string
  temperature?: number
  condition?: string
  humidity?: number
  windSpeed?: number
  alertLevel?: AlertLevel
  heatIndex?: WeatherIndex
  floodRiskIndex?: WeatherIndex
  typhoonImpactIndex?: WeatherIndex
}

export interface ApiResponse<T = any> {
  data: T
  error?: string
}
