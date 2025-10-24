"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "tl";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // App Header
    "app.title": "WINDER+",
    "app.subtitle":
      "Weather, Index (Heat), Natural Disasters & Emergency Response",

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
    "history.noDataDescAll":
      "Weather history will appear here as you check different locations",
    "history.noDataDescFiltered":
      "No weather data found for the selected filter",
    "history.viewAll": "View All History",

    // Report Emergency
    "reportEmergency.title": "Report Emergency",
    "reportEmergency.contactInfoPrompt":
      "Please provide your contact information for emergency services",
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
    "app.subtitle":
      "Panahon, Index (Mainit), Natural Disasters & Emergency Response",

    // Search
    "search.title": "Maghanap ng Lokasyon",
    "search.placeholder": "Ilagay ang lokasyon...",
    "search.button": "Maghanap",
    "search.currentLocation": "Gamitin ang Kasalukuyang Lokasyon",
    "search.recent": "Kamakailang Paghahanap",

    // Quick Actions
    "quick.actions": "Mabilis na Aksyon",
    "quick.actions.prompt": "Ano ang gusto mong gawin?",
    "quick.emergencyKit": "Kit ng Emergency",
    "quick.emergencyKitDesc": "Mahalagang gamit para sa emergency",
    "quick.reportEmergency": "Mag-ulat ng Emergency",
    "quick.reportEmergencyDesc": "Ipaalam sa mga awtoridad ang emergency",
    "quick.weatherHistory": "Kasaysayan ng Panahon",
    "quick.weatherHistoryDesc": "Tingnan ang nakaraang tala ng panahon",
    "quick.adminAccess": "Access ng Admin",
    "quick.adminAccessDesc": "Dashboard ng mga administrador",
    "quick.volunteerAccess": "Access ng Volunteer",
    "quick.volunteerAccessDesc": "Koordinasyon ng mga boluntaryo",
    "quick.responderAccess": "Access ng Responder",
    "quick.responderAccessDesc": "Mga gamit ng tagatugon sa emergency",

    "suggested.locations": "Inirerekomendang Lokasyon",

    // Settings
    "settings.title": "Mga Setting",
    "settings.temperature": "Yunit ng Temperatura",
    "settings.temperature.celsius": "Celsius (°C)",
    "settings.temperature.fahrenheit": "Fahrenheit (°F)",
    "settings.wind": "Yunit ng Bilis ng Hangin",
    "settings.wind.kmh": "km/h",
    "settings.wind.mph": "mph",
    "settings.wind.ms": "m/s",
    "settings.location": "Mga Serbisyo sa Lokasyon",
    "settings.location.desc":
      "Gamitin ang iyong lokasyon para sa lokal na ulat ng panahon",
    "settings.notifications": "Mga Notipikasyon",
    "settings.notifications.desc":
      "Paganahin ang mga alerto at update sa panahon",
    "settings.push": "Mga Push Notification",
    "settings.push.desc": "Paganahin ang mga push alerto",
    "settings.enabled": "Pinagana",
    "settings.disabled": "Hindi Pinagana",
    "settings.language": "Wika",
    "settings.language.desc": "Piliin ang iyong wika",
    "settings.english": "English",
    "settings.tagalog": "Tagalog (Filipino)",

    // Main
    "main.weather": "Panahon",
    "main.alerts": "Mga Alerto",
    "main.forecast": "Pagtataya ng Panahon",
    "main.risks": "Panganib",
    "main.emergency": "Emergency",
    "main.search": "Maghanap",
    "main.location": "Lokasyon",
    "main.temperature": "Temperatura",
    "main.humidity": "Kahalumigmigan",
    "main.windSpeed": "Bilis ng Hangin",
    "main.feelsLike": "Pakiramdam",
    "main.visibility": "Bisyibilidad",
    "main.pressure": "Presyon",
    "main.noAlerts": "Walang aktibong alerto sa panahon",
    "main.noForecast": "Walang magagamit na datos ng pagtataya",
    "main.noRisks": "Walang magagamit na datos ng panganib",

    // Weather Descriptions (refined)
    "weather.clearSky": "Malinaw ang langit",
    "weather.mainlyClear": "Karamihang malinaw",
    "weather.partlyCloudy": "Bahagyang maulap",
    "weather.overcast": "Makulimlim",
    "weather.fog": "Mahamog",
    "weather.depositingRimeFog": "Hamog na nagyeyelo",
    "weather.lightDrizzle": "Magaan na ambon",
    "weather.moderateDrizzle": "Katamtamang ambon",
    "weather.denseDrizzle": "Masaning ambon",
    "weather.slightRain": "Magaan na ulan",
    "weather.moderateRain": "Katamtamang ulan",
    "weather.heavyRain": "Malakas na ulan",
    "weather.slightRainShowers": "Magagaan na pag-ulan",
    "weather.moderateRainShowers": "Katamtamang pag-ulan",
    "weather.violentRainShowers": "Matinding pag-ulan na may buhos",
    "weather.thunderstorm": "Bagyo na may kulog at kidlat",
    "weather.thunderstormSlightHail":
      "Bagyo na may kulog/kidlat at kaunting yelo",
    "weather.thunderstormHeavyHail":
      "Bagyo na may kulog/kidlat at malakas na yelo",
    "weather.unknown": "Hindi matukoy na kondisyon ng panahon",

    // Risk Descriptions (refined)
    "risk.heavyRainfallThunderstorm":
      "Malakas na pag-ulan na may panganib ng kulog at kidlat",
    "risk.moderateRainfallExpected": "Inaasahang katamtamang pag-ulan",
    "risk.lightPrecipitationConditions": "Magaan na kondisyon ng pag-ulan",
    "risk.highFloodRiskLowLying":
      "Mataas na panganib ng pagbaha sa mabababang lugar",
    "risk.moderateFloodRisk": "Katamtamang panganib ng pagbaha",
    "risk.lowFloodRisk": "Mababang panganib ng pagbaha",
    "risk.strongSustainedWinds": "Matitinding tuloy-tuloy na hangin",
    "risk.moderateWindConditions": "Katamtamang lakas ng hangin",
    "risk.calmWindConditions": "Kalmadong kondisyon ng hangin",
    "risk.highRiskSoilSaturation":
      "Mataas na panganib dahil sa pagbabad ng lupa",
    "risk.moderateRiskSteepAreas": "Katamtamang panganib sa matatarik na lugar",
    "risk.lowLandslideRisk": "Mababang panganib ng pagguho ng lupa",
    "risk.moderateConditions": "Katamtamang kondisyon",
    "risk.stableConditions": "Matatag na kondisyon",
    "risk.lowSeismicActivity": "Mababang aktibidad ng lindol",
    "risk.minorSeismicActivity": "Maliit na aktibidad ng lindol",
    "risk.lightSeismicActivity": "Magaan na aktibidad ng lindol",
    "risk.moderateSeismicActivity": "Katamtamang aktibidad ng lindol",
    "risk.strongSeismicActivity": "Malakas na aktibidad ng lindol",

    // History
    "history.title": "Kasaysayan ng Panahon",
    "history.recordsFound": "mga rekord na natagpuan",
    "history.noDataTitle": "Walang kasaysayan ng panahon",
    "history.noDataDescAll":
      "Lalabas dito ang kasaysayan ng panahon habang nagche-check ka ng mga lokasyon",
    "history.noDataDescFiltered":
      "Walang nakitang tala ng panahon para sa napiling filter",
    "history.viewAll": "Tingnan ang Lahat ng Kasaysayan",

    // Report Emergency
    "reportEmergency.title": "Mag-ulat ng Emergency",
    "reportEmergency.contactInfoPrompt":
      "Pakibigay ang iyong impormasyon ng contact para sa mga emergency service",
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
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "winder-language"
    ) as Language | null;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "tl")) {
      setLanguageState(savedLanguage);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("winder-language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
