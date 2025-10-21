"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "tl"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Record<string, string>> = {
  en: {
    // App Header
    "app.title": "WINDER+",
    "app.subtitle": "Weather, Index (Heat), Natural Disasters & Emergency Response",

    // Search
    "search.title": "Search Location",
    "search.placeholder": "Search for a location...",
    "search.button": "Search",
    "search.currentLocation": "Use Current Location",
    "search.recent": "Recent Searches",

    // Quick Actions
    "quick.actions": "Quick Actions",
    "quick.actions.prompt": "What would you like to do?",
    "quick.emergencyKit": "Emergency Kit",
    "quick.emergencyKitDesc": "Essential emergency supplies",
    "quick.reportEmergency": "Report Emergency",
    "quick.reportEmergencyDesc": "Alert emergency services",
    "quick.weatherHistory": "Weather History",
    "quick.weatherHistoryDesc": "View past weather data",
    "quick.adminAccess": "Admin Access",
    "quick.adminAccessDesc": "Administrative dashboard",
    "quick.volunteerAccess": "Volunteer Access",
    "quick.volunteerAccessDesc": "Volunteer coordination",
    "quick.responderAccess": "Responder Access",
    "quick.responderAccessDesc": "Emergency responder tools",

    "suggested.locations": "Suggested Locations",

    // Settings Modal
    "settings.title": "Settings",
    "settings.temperature": "Temperature Unit",
    "settings.temperature.celsius": "Celsius (°C)",
    "settings.temperature.fahrenheit": "Fahrenheit (°F)",
    "settings.wind": "Wind Speed Unit",
    "settings.wind.kmh": "km/h",
    "settings.wind.mph": "mph",
    "settings.wind.ms": "m/s",
    "settings.location": "Location Services",
    "settings.location.desc": "Use your location for local weather",
    "settings.notifications": "Notifications",
    "settings.notifications.desc": "Enable weather alerts and updates",
    "settings.push": "Push Notifications",
    "settings.push.desc": "Enable push notifications for alerts",
    "settings.enabled": "Enabled",
    "settings.disabled": "Disabled",
    "settings.language": "Language",
    "settings.language.desc": "Choose your preferred language",
    "settings.english": "English",
    "settings.tagalog": "Tagalog (Filipino)",

    // Main Page
    "main.weather": "Weather",
    "main.alerts": "Alerts",
    "main.forecast": "Forecast",
    "main.risks": "Risk Predictions",
    "main.emergency": "Emergency",
    "main.search": "Search",
    "main.location": "Location",
    "main.temperature": "Temperature",
    "main.humidity": "Humidity",
    "main.windSpeed": "Wind Speed",
    "main.feelsLike": "Feels Like",
    "main.visibility": "Visibility",
    "main.pressure": "Pressure",
    "main.noAlerts": "No active weather alerts",
    "main.noForecast": "No forecast data available",
    "main.noRisks": "No risk predictions available",

    // Weather Details
    "weather.feelsLike": "Feels Like",
    "weather.humidity": "Humidity",
    "weather.windSpeed": "Wind Speed",
    "weather.forecast": "Weather Forecast",
    "weather.risks": "Risk Predictions",
    "weather.indices": "Weather Indices",
    "weather.heatIndex": "Heat Index",
    "weather.uvIndex": "UV Index",
    "weather.typhoonImpact": "Typhoon Impact",

    // Emergency
    "emergency.title": "Emergency",
    "emergency.report": "Report Emergency",
    "emergency.kit": "Emergency Kit",
    "emergency.evacuation": "Evacuation Map",
    "emergency.sms": "SMS Settings",
    "emergency.call911": "Call 911",
    "emergency.call143": "Call 143",
    "emergency.call117": "Call 117",
    "emergency.medical": "Medical Emergency",
    "emergency.medicalDesc": "Ambulance and medical assistance",
    "emergency.fire": "Fire Emergency",
    "emergency.fireDesc": "Fire department and rescue",
    "emergency.crime": "Crime/Safety",
    "emergency.crimeDesc": "Police and security assistance",
    "emergency.disaster": "Natural Disaster",
    "emergency.disasterDesc": "Disaster response and evacuation",
    "emergency.accident": "Accident/Injury",
    "emergency.accidentDesc": "Emergency medical response",
    "emergency.contactDirectly": "Contact emergency services directly",
    "emergency.call911Button": "Call 911",
    "emergency.call143Button": "Call 143",

    // Risk Categories
    "risk.rainfall": "Rainfall Risk",
    "risk.flood": "Flood Risk",
    "risk.wind": "Wind Risk",
    "risk.landslide": "Landslide Risk",
    "risk.earthquake": "Earthquake Risk",
    "risk.stable": "Stable",
    "risk.increasing": "Increasing",
    "risk.decreasing": "Decreasing",
  },
  tl: {
    // App Header
    "app.title": "WINDER+",
    "app.subtitle": "Panahon, Index (Mainit), Natural Disasters & Emergency Response",

    // Search
    "search.title": "Maghanap ng Lokasyon",
    "search.placeholder": "Maghanap ng lokasyon...",
    "search.button": "Maghanap",
    "search.currentLocation": "Gamitin Lokasyon",
    "search.recent": "Mga Kamakailang Paghahanap",

    // Quick Actions
    "quick.actions": "Mabilis na Aksyon",
    "quick.actions.prompt": "Ano ang gusto mong gawin?",
    "quick.emergencyKit": "Emergency Kit",
    "quick.emergencyKitDesc": "Mahalagang emergency supplies",
    "quick.reportEmergency": "Mag-ulat ng Emergency",
    "quick.reportEmergencyDesc": "Alertahin ang emergency services",
    "quick.weatherHistory": "Kasaysayan ng Panahon",
    "quick.weatherHistoryDesc": "Tingnan ang nakaraang data ng panahon",
    "quick.adminAccess": "Admin Access",
    "quick.adminAccessDesc": "Administrative dashboard",
    "quick.volunteerAccess": "Volunteer Access",
    "quick.volunteerAccessDesc": "Volunteer coordination",
    "quick.responderAccess": "Responder Access",
    "quick.responderAccessDesc": "Emergency responder tools",

    "suggested.locations": "Isinasaad na Lokasyon",

    // Settings Modal
    "settings.title": "Mga Setting",
    "settings.temperature": "Yunit ng Temperatura",
    "settings.temperature.celsius": "Celsius (°C)",
    "settings.temperature.fahrenheit": "Fahrenheit (°F)",
    "settings.wind": "Yunit ng Bilis ng Hangin",
    "settings.wind.kmh": "km/h",
    "settings.wind.mph": "mph",
    "settings.wind.ms": "m/s",
    "settings.location": "Mga Serbisyo sa Lokasyon",
    "settings.location.desc": "Gamitin ang iyong lokasyon para sa lokal na panahon",
    "settings.notifications": "Mga Notipikasyon",
    "settings.notifications.desc": "Paganahin ang mga alerto sa panahon at mga update",
    "settings.push": "Mga Push Notification",
    "settings.push.desc": "Paganahin ang mga push notification para sa mga alerto",
    "settings.enabled": "Pinagana",
    "settings.disabled": "Hindi Pinagana",
    "settings.language": "Wika",
    "settings.language.desc": "Piliin ang iyong ginustong wika",
    "settings.english": "English",
    "settings.tagalog": "Tagalog (Filipino)",

    // Main Page
    "main.weather": "Panahon",
    "main.alerts": "Mga Alerto",
    "main.forecast": "Pagtataya",
    "main.risks": "Mga Hula ng Panganib",
    "main.emergency": "Emergency",
    "main.search": "Maghanap",
    "main.location": "Lokasyon",
    "main.temperature": "Temperatura",
    "main.humidity": "Kahalumigmigan",
    "main.windSpeed": "Bilis ng Hangin",
    "main.feelsLike": "Pakiramdam",
    "main.visibility": "Visibility",
    "main.pressure": "Presyon",
    "main.noAlerts": "Walang aktibong mga alerto sa panahon",
    "main.noForecast": "Walang available na forecast data",
    "main.noRisks": "Walang available na mga hula ng panganib",

    // Weather Details
    "weather.feelsLike": "Pakiramdam",
    "weather.humidity": "Kahalumigmigan",
    "weather.windSpeed": "Bilis ng Hangin",
    "weather.forecast": "Pagtataya ng Panahon",
    "weather.risks": "Mga Hula ng Panganib",
    "weather.indices": "Mga Indeks ng Panahon",
    "weather.heatIndex": "Heat Index",
    "weather.uvIndex": "UV Index",
    "weather.typhoonImpact": "Epekto ng Bagyo",

    // Emergency
    "emergency.title": "Emergency",
    "emergency.report": "Mag-ulat ng Emergency",
    "emergency.kit": "Emergency Kit",
    "emergency.evacuation": "Evacuation Map",
    "emergency.sms": "SMS Settings",
    "emergency.call911": "Tawagan ang 911",
    "emergency.call143": "Tawagan ang 143",
    "emergency.call117": "Tawagan ang 117",
    "emergency.medical": "Medical Emergency",
    "emergency.medicalDesc": "Ambulansya at medikal na tulong",
    "emergency.fire": "Fire Emergency",
    "emergency.fireDesc": "Departamento ng Bombero at rescue",
    "emergency.crime": "Krimen/Kaligtasan",
    "emergency.crimeDesc": "Tulong ng Pulis at seguridad",
    "emergency.disaster": "Natural Disaster",
    "emergency.disasterDesc": "Disaster response at evacuation",
    "emergency.accident": "Aksidente/Pinsala",
    "emergency.accidentDesc": "Emergency medical response",
    "emergency.contactDirectly": "Makipag-ugnayan sa emergency services nang direkta",
    "emergency.call911Button": "Tawagan ang 911",
    "emergency.call143Button": "Tawagan ang 143",

    // Risk Categories
    "risk.rainfall": "Panganib ng Ulan",
    "risk.flood": "Panganib ng Baha",
    "risk.wind": "Panganib ng Hangin",
    "risk.landslide": "Panganib ng Landslide",
    "risk.earthquake": "Panganib ng Lindol",
    "risk.stable": "Matatag",
    "risk.increasing": "Tumataas",
    "risk.decreasing": "Bumababa",
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedLanguage = localStorage.getItem("winder-language") as Language | null
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "tl")) {
      setLanguageState(savedLanguage)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("winder-language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || translations["en"][key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
