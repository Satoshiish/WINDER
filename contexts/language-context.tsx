"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Language = "en" | "tl"

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

    "weather.clearSky": "Clear sky",
    "weather.mainlyClear": "Mainly clear",
    "weather.partlyCloudy": "Partly cloudy",
    "weather.overcast": "Overcast",
    "weather.fog": "Fog",
    "weather.depositingRimeFog": "Depositing rime fog",
    "weather.lightDrizzle": "Light drizzle",
    "weather.moderateDrizzle": "Moderate drizzle",
    "weather.denseDrizzle": "Dense drizzle",
    "weather.slightRain": "Slight rain",
    "weather.moderateRain": "Moderate rain",
    "weather.heavyRain": "Heavy rain",
    "weather.slightRainShowers": "Slight rain showers",
    "weather.moderateRainShowers": "Moderate rain showers",
    "weather.violentRainShowers": "Violent rain showers",
    "weather.thunderstorm": "Thunderstorm",
    "weather.thunderstormSlightHail": "Thunderstorm with slight hail",
    "weather.thunderstormHeavyHail": "Thunderstorm with heavy hail",
    "weather.unknown": "Unknown conditions",

    "risk.heavyRainfallThunderstorm": "Heavy rainfall with thunderstorm risk",
    "risk.moderateRainfallExpected": "Moderate rainfall expected",
    "risk.lightPrecipitationConditions": "Light precipitation conditions",
    "risk.highFloodRiskLowLying": "High flood risk in low-lying areas",
    "risk.moderateFloodRisk": "Moderate flood risk",
    "risk.lowFloodRisk": "Low flood risk",
    "risk.strongSustainedWinds": "Strong sustained winds expected",
    "risk.moderateWindConditions": "Moderate wind conditions",
    "risk.calmWindConditions": "Calm wind conditions",
    "risk.highRiskSoilSaturation": "High risk due to soil saturation",
    "risk.moderateRiskSteepAreas": "Moderate risk in steep areas",
    "risk.lowLandslideRisk": "Low landslide risk",
    "risk.moderateConditions": "Moderate conditions",
    "risk.stableConditions": "Stable conditions",
    "risk.lowSeismicActivity": "Low seismic activity",
    "risk.minorSeismicActivity": "Minor seismic activity",
    "risk.lightSeismicActivity": "Light seismic activity detected",
    "risk.moderateSeismicActivity": "Moderate seismic activity",
    "risk.strongSeismicActivity": "Strong seismic activity detected",

    // Emergency
    "emergency.title": "Emergency Numbers",
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

    // Navigation
  "nav.dashboard": "Dashboard",
  "nav.search": "Search",
  "nav.map": "Map",
  "nav.social": "Social",
  "nav.alerts": "Alerts",
  "nav.sos": "Emergency",
  "nav.settings": "Settings",
  "nav.quick": "Quick Actions",

  // Map
  "map.weather": "Weather Map",
  "map.evacuation": "Evacuation Map",

  // Alerts
  "alerts.title": "Weather Alerts",
  "alerts.affectedAreas": "Affected Areas",
  "alerts.validUntil": "Valid Until",
  "alerts.issued": "Issued",
  "alerts.noAlerts": "No active weather alerts",

  // History
  "history.title": "Weather History",
  "history.recordsFound": "records found",
  "history.noDataTitle": "No weather history",
  "history.noDataDescAll": "Weather history will appear here as you check different locations",
  "history.noDataDescFiltered": "No weather data found for the selected filter",
  "history.viewAll": "View All History",

  // Report Emergency
  "reportEmergency.title": "Report Emergency",
  "reportEmergency.contactInfoPrompt": "Please provide your contact information for emergency services",
  "reportEmergency.fullName": "Full Name",
  "reportEmergency.fullNamePlaceholder": "Enter your full name",
  "reportEmergency.phoneNumber": "Phone Number",
  "reportEmergency.peopleAffected": "Number of People Affected",
  "reportEmergency.typeLabel": "Emergency Type",
  "reportEmergency.selectTypePrompt": "Select the type of emergency",
  "reportEmergency.sendReportButton": "Send Report",

  // Common
  "common.back": "Back",
  },
  tl: {
    // App Header
    "app.title": "WINDER+",
    "app.subtitle": "Panahon, Index (Mainit), Natural Disasters & Emergency Response",

    // Search
    "search.title": "Maghanap ng Lokasyon",
    "search.placeholder": "Maghanap ng lokasyon...",
    "search.button": "Maghanap",
    "search.currentLocation": "Gamitin ang Lokasyon",
    "search.recent": "Mga Kamakailang Paghahanap",

    // Quick Actions
    "quick.actions": "Mabilis na Aksyon",
    "quick.actions.prompt": "Ano ang gusto mong gawin?",
    "quick.emergencyKit": "Kit sa Pang-emerhensiya",
    "quick.emergencyKitDesc": "Mahalagang emerhensiya supplies",
    "quick.reportEmergency": "Mag-ulat ng Emerhensiya",
    "quick.reportEmergencyDesc": "Alertahin ang emergency services",
    "quick.weatherHistory": "Naitala ng Panahon",
    "quick.weatherHistoryDesc": "Tingnan ang nakaraang data ng panahon",
    "quick.adminAccess": "Access ng Admin",
    "quick.adminAccessDesc": "Administrative dashboard",
    "quick.volunteerAccess": "Access ng Volunteer",
    "quick.volunteerAccessDesc": "Volunteer coordination",
    "quick.responderAccess": "Access ng Responder",
    "quick.responderAccessDesc": "Emergency responder tools",

    "suggested.locations": "Inirerekomendang Lokasyon",

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

    "weather.clearSky": "Malinaw na kalangitan",
    "weather.mainlyClear": "Karamihan ay malinaw",
    "weather.partlyCloudy": "Bahagyang maulap",
    "weather.overcast": "Maulap",
    "weather.fog": "Ulap",
    "weather.depositingRimeFog": "Depositing rime fog",
    "weather.lightDrizzle": "Magaan na ulan",
    "weather.moderateDrizzle": "Katamtamang ulan",
    "weather.denseDrizzle": "Malalim na ulan",
    "weather.slightRain": "Kaunting ulan",
    "weather.moderateRain": "Katamtamang ulan",
    "weather.heavyRain": "Mabigat na ulan",
    "weather.slightRainShowers": "Kaunting ulan",
    "weather.moderateRainShowers": "Katamtamang ulan",
    "weather.violentRainShowers": "Malakas na ulan",
    "weather.thunderstorm": "Kidlat at Kulog",
    "weather.thunderstormSlightHail": "Kidlat at Kulog na may kaunting yelo",
    "weather.thunderstormHeavyHail": "Kidlat at Kulog na may mabigat na yelo",
    "weather.unknown": "Hindi kilalang kondisyon",

    "risk.heavyRainfallThunderstorm": "Mabigat na ulan na may panganib ng kidlat",
    "risk.moderateRainfallExpected": "Inaasahang katamtamang ulan",
    "risk.lightPrecipitationConditions": "Magaan na kondisyon ng ulan",
    "risk.highFloodRiskLowLying": "Mataas na panganib ng baha sa mababang lugar",
    "risk.moderateFloodRisk": "Katamtamang panganib ng baha",
    "risk.lowFloodRisk": "Mababang panganib ng baha",
    "risk.strongSustainedWinds": "Malakas na patuloy na hangin",
    "risk.moderateWindConditions": "Katamtamang kondisyon ng hangin",
    "risk.calmWindConditions": "Maayos na kondisyon ng hangin",
    "risk.highRiskSoilSaturation": "Mataas na panganib dahil sa basang lupa",
    "risk.moderateRiskSteepAreas": "Katamtamang panganib sa mataas na lugar",
    "risk.lowLandslideRisk": "Mababang panganib ng landslide",
    "risk.moderateConditions": "Katamtamang kondisyon",
    "risk.stableConditions": "Matatag na kondisyon",
    "risk.lowSeismicActivity": "Mababang seismic activity",
    "risk.minorSeismicActivity": "Maliit na seismic activity",
    "risk.lightSeismicActivity": "Magaan na seismic activity na natuklasan",
    "risk.moderateSeismicActivity": "Katamtamang seismic activity",
    "risk.strongSeismicActivity": "Malakas na seismic activity na natuklasan",

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

    // Navigation
  "nav.dashboard": "Dashboard",
  "nav.search": "Maghanap",
  "nav.map": "Mapa",
  "nav.social": "Social",
  "nav.alerts": "Mga Alerto",
  "nav.sos": "Emergency",
  "nav.settings": "Mga Setting",
  "nav.quick": "Mabilis na Aksyon",

  // Map
  "map.weather": "Mapa ng Panahon",
  "map.evacuation": "Mapa ng Ebakwasyon",

  // Alerts
  "alerts.title": "Mga Alerto sa Panahon",
  "alerts.affectedAreas": "Mga Apektadong Lugar",
  "alerts.validUntil": "Wastong Hanggang",
  "alerts.issued": "Inilabas",
  "alerts.noAlerts": "Walang aktibong mga alerto sa panahon",

  // History
  "history.title": "Kasaysayan ng Panahon",
  "history.recordsFound": "mga rekord na natagpuan",
  "history.noDataTitle": "Walang kasaysayan ng panahon",
  "history.noDataDescAll": "Lalabas ang kasaysayan ng panahon habang nagche-check ka ng iba't ibang lokasyon",
  "history.noDataDescFiltered": "Walang nakitang data ng panahon para sa napiling filter",
  "history.viewAll": "Tingnan ang Lahat ng Kasaysayan",

  // Report Emergency
  "reportEmergency.title": "Mag-ulat ng Emergency",
  "reportEmergency.contactInfoPrompt": "Pakibigay ang iyong impormasyon ng contact para sa mga emergency service",
  "reportEmergency.fullName": "Buong Pangalan",
  "reportEmergency.fullNamePlaceholder": "Ilagay ang iyong buong pangalan",
  "reportEmergency.phoneNumber": "Numero ng Telepono",
  "reportEmergency.peopleAffected": "Bilang ng mga Apektadong Tao",
  "reportEmergency.typeLabel": "Uri ng Emergency",
  "reportEmergency.selectTypePrompt": "Piliin ang uri ng emergency",
  "reportEmergency.sendReportButton": "Ipadala ang Ulat",

  // Common
  "common.back": "Bumalik",
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
