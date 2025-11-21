// Simple LocalStorage cache for latest weather data
export const WEATHER_CACHE_KEY = "winder-weather-cache"

export interface CachedNotification {
  title: string
  message: string
  type?: string
  timestamp: number
}

export interface CachedWeather {
  data: any
  lat?: number
  lon?: number
  timestamp: number
  lastNotification?: CachedNotification
}

export function saveWeatherCache(data: any, lat?: number, lon?: number, lastNotification?: CachedNotification) {
  try {
    const existingRaw = localStorage.getItem(WEATHER_CACHE_KEY)
    let existing: Partial<CachedWeather> | null = null
    if (existingRaw) {
      try {
        existing = JSON.parse(existingRaw)
      } catch (e) {
        existing = null
      }
    }

    const payload: CachedWeather = {
      data,
      lat,
      lon,
      timestamp: Date.now(),
      lastNotification: lastNotification ?? existing?.lastNotification,
    }

    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error("[v0] Error saving weather cache:", error)
  }
}

export function saveLastNotificationToCache(notification: CachedNotification) {
  try {
    const existingRaw = localStorage.getItem(WEATHER_CACHE_KEY)
    let existing: Partial<CachedWeather> | null = null
    if (existingRaw) {
      try {
        existing = JSON.parse(existingRaw)
      } catch (e) {
        existing = null
      }
    }

    const payload: CachedWeather = {
      data: existing?.data ?? null,
      lat: existing?.lat,
      lon: existing?.lon,
      timestamp: existing?.timestamp ?? Date.now(),
      lastNotification: notification,
    }

    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error("[v0] Error saving last notification to cache:", error)
  }
}

export function loadWeatherCache(): CachedWeather | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedWeather
    if (!parsed || !parsed.data) return null
    return parsed
  } catch (error) {
    console.error("[v0] Error loading weather cache:", error)
    return null
  }
}

export function isNearby(aLat?: number, aLon?: number, bLat?: number, bLon?: number, thresholdDegrees = 0.2) {
  if (aLat == null || aLon == null || bLat == null || bLon == null) return false
  return Math.abs(aLat - bLat) <= thresholdDegrees && Math.abs(aLon - bLon) <= thresholdDegrees
}
