"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface UserPreferences {
  temperatureUnit: "celsius" | "fahrenheit"
  windSpeedUnit: "kmh" | "mph" | "ms"
  language: "en" | "fil"
  notificationsEnabled: boolean
  pushNotificationsEnabled: boolean
  locationServicesEnabled: boolean
  theme: "light" | "dark" | "system"
  recentSearches: string[]
}

interface UserPreferencesContextType {
  preferences: UserPreferences
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void
  addRecentSearch: (location: string) => void
  clearRecentSearches: () => void
}

const defaultPreferences: UserPreferences = {
  temperatureUnit: "celsius",
  windSpeedUnit: "kmh",
  language: "en",
  notificationsEnabled: true,
  pushNotificationsEnabled: false,
  locationServicesEnabled: true,
  theme: "system",
  recentSearches: [],
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("weather-app-preferences")
      if (stored) {
        const parsedPreferences = JSON.parse(stored)
        setPreferences({ ...defaultPreferences, ...parsedPreferences })
      }
    } catch (error) {
      console.error("Failed to load preferences:", error)
    }
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("weather-app-preferences", JSON.stringify(preferences))
    } catch (error) {
      console.error("Failed to save preferences:", error)
    }
  }, [preferences])

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const addRecentSearch = (location: string) => {
    setPreferences((prev) => ({
      ...prev,
      recentSearches: [location, ...prev.recentSearches.filter((s) => s !== location)].slice(0, 10),
    }))
  }

  const clearRecentSearches = () => {
    setPreferences((prev) => ({ ...prev, recentSearches: [] }))
  }

  const contextValue: UserPreferencesContextType = {
    preferences,
    updatePreference,
    addRecentSearch,
    clearRecentSearches,
  }

  return <UserPreferencesContext.Provider value={contextValue}>{children}</UserPreferencesContext.Provider>
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider")
  }
  return context
}
