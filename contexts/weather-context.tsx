"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { WeatherData } from "@/lib/interfaces"

interface Alert {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "extreme"
  type: string
  timestamp: Date
}

interface RiskPrediction {
  id: string
  type: string
  probability: number
  severity: string
  timeframe: string
  description: string
}

interface ForecastDay {
  date: string
  temperature: { min: number; max: number }
  condition: string
  description: string
  icon: string
  humidity: number
  windSpeed: number
}

interface WeatherState {
  currentWeather: WeatherData | null
  alerts: Alert[]
  riskPredictions: RiskPrediction[]
  forecast: ForecastDay[]
  location: { lat: number; lon: number } | null
  loading: boolean
  error: string | null
  locationName: string
  temperatureUnit: "celsius" | "fahrenheit"
  windSpeedUnit: "kmh" | "mph" | "ms"
}

type WeatherAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CURRENT_WEATHER"; payload: WeatherData }
  | { type: "SET_ALERTS"; payload: Alert[] }
  | { type: "SET_RISK_PREDICTIONS"; payload: RiskPrediction[] }
  | { type: "SET_FORECAST"; payload: ForecastDay[] }
  | { type: "SET_LOCATION"; payload: { lat: number; lon: number } }
  | { type: "SET_LOCATION_NAME"; payload: string }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_TEMPERATURE_UNIT"; payload: "celsius" | "fahrenheit" }
  | { type: "SET_WIND_SPEED_UNIT"; payload: "kmh" | "mph" | "ms" }

const initialState: WeatherState = {
  currentWeather: null,
  alerts: [],
  riskPredictions: [],
  forecast: [],
  location: null,
  loading: true,
  error: null,
  locationName: "",
  temperatureUnit: "celsius",
  windSpeedUnit: "kmh",
}

function weatherReducer(state: WeatherState, action: WeatherAction): WeatherState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_CURRENT_WEATHER":
      return { ...state, currentWeather: action.payload, error: null }
    case "SET_ALERTS":
      return { ...state, alerts: action.payload }
    case "SET_RISK_PREDICTIONS":
      return { ...state, riskPredictions: action.payload }
    case "SET_FORECAST":
      return { ...state, forecast: action.payload }
    case "SET_LOCATION":
      return { ...state, location: action.payload }
    case "SET_LOCATION_NAME":
      return { ...state, locationName: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "SET_TEMPERATURE_UNIT":
      return { ...state, temperatureUnit: action.payload }
    case "SET_WIND_SPEED_UNIT":
      return { ...state, windSpeedUnit: action.payload }
    default:
      return state
  }
}

interface WeatherContextType {
  state: WeatherState
  dispatch: React.Dispatch<WeatherAction>
  fetchWeatherData: (lat: number, lon: number, locationName?: string) => Promise<void>
  searchLocation: (location: string) => Promise<WeatherData | null>
  getCurrentLocation: () => Promise<void>
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined)

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(weatherReducer, initialState)

  const fetchWeatherData = async (lat: number, lon: number, locationName?: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "SET_ERROR", payload: null })

      // Fetch current weather
      const currentResponse = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}`)
      if (!currentResponse.ok) throw new Error("Failed to fetch current weather")
      const currentData = await currentResponse.json()

      const weatherData: WeatherData = {
        temperature: currentData.temperature,
        condition: currentData.condition,
        description: currentData.description || currentData.condition,
        location: locationName || currentData.location,
        humidity: currentData.humidity,
        windSpeed: currentData.windSpeed,
        feelsLike: currentData.feelsLike,
        icon: currentData.icon,
      }

      dispatch({ type: "SET_CURRENT_WEATHER", payload: weatherData })
      dispatch({ type: "SET_LOCATION", payload: { lat, lon } })
      dispatch({ type: "SET_LOCATION_NAME", payload: locationName || currentData.location })

      // Fetch forecast
      const forecastResponse = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`)
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json()
        dispatch({ type: "SET_FORECAST", payload: forecastData.forecasts || [] })
      }

      // Fetch alerts
      const alertsResponse = await fetch(`/api/weather/alerts?lat=${lat}&lon=${lon}`)
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        dispatch({ type: "SET_ALERTS", payload: alertsData.alerts || [] })
        dispatch({ type: "SET_RISK_PREDICTIONS", payload: alertsData.riskPredictions || [] })
      }
    } catch (error) {
      console.error("Weather fetch error:", error)
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to fetch weather data" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const searchLocation = async (location: string): Promise<WeatherData | null> => {
    try {
      // This would integrate with your existing location search logic
      // For now, returning null as placeholder
      return null
    } catch (error) {
      console.error("Location search error:", error)
      return null
    }
  }

  const getCurrentLocation = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })

      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser")
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      const { latitude, longitude } = position.coords
      await fetchWeatherData(latitude, longitude)
    } catch (error) {
      console.error("Geolocation error:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to get current location" })
    }
  }

  // Auto-fetch location on mount
  useEffect(() => {
    getCurrentLocation()
  }, [])

  const contextValue: WeatherContextType = {
    state,
    dispatch,
    fetchWeatherData,
    searchLocation,
    getCurrentLocation,
  }

  return <WeatherContext.Provider value={contextValue}>{children}</WeatherContext.Provider>
}

export function useWeather() {
  const context = useContext(WeatherContext)
  if (context === undefined) {
    throw new Error("useWeather must be used within a WeatherProvider")
  }
  return context
}
