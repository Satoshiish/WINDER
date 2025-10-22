// Map English weather descriptions to translation keys
const weatherDescriptionMap: Record<string, string> = {
  "Clear sky": "weather.clearSky",
  "Mainly clear": "weather.mainlyClear",
  "Partly cloudy": "weather.partlyCloudy",
  Overcast: "weather.overcast",
  Fog: "weather.fog",
  "Depositing rime fog": "weather.depositingRimeFog",
  "Light drizzle": "weather.lightDrizzle",
  "Moderate drizzle": "weather.moderateDrizzle",
  "Dense drizzle": "weather.denseDrizzle",
  "Slight rain": "weather.slightRain",
  "Moderate rain": "weather.moderateRain",
  "Heavy rain": "weather.heavyRain",
  "Slight rain showers": "weather.slightRainShowers",
  "Moderate rain showers": "weather.moderateRainShowers",
  "Violent rain showers": "weather.violentRainShowers",
  Thunderstorm: "weather.thunderstorm",
  "Thunderstorm with slight hail": "weather.thunderstormSlightHail",
  "Thunderstorm with heavy hail": "weather.thunderstormHeavyHail",
  "Unknown conditions": "weather.unknown",
}

// Map English risk descriptions to translation keys
const riskDescriptionMap: Record<string, string> = {
  "Heavy rainfall with thunderstorm risk": "risk.heavyRainfallThunderstorm",
  "Moderate rainfall expected": "risk.moderateRainfallExpected",
  "Light precipitation conditions": "risk.lightPrecipitationConditions",
  "High flood risk in low-lying areas": "risk.highFloodRiskLowLying",
  "Moderate flood risk": "risk.moderateFloodRisk",
  "Low flood risk": "risk.lowFloodRisk",
  "Strong sustained winds expected": "risk.strongSustainedWinds",
  "Moderate wind conditions": "risk.moderateWindConditions",
  "Calm wind conditions": "risk.calmWindConditions",
  "High risk due to soil saturation": "risk.highRiskSoilSaturation",
  "Moderate risk in steep areas": "risk.moderateRiskSteepAreas",
  "Low landslide risk": "risk.lowLandslideRisk",
  "Moderate conditions": "risk.moderateConditions",
  "Stable conditions": "risk.stableConditions",
  "Low seismic activity": "risk.lowSeismicActivity",
  "Minor seismic activity": "risk.minorSeismicActivity",
  "Light seismic activity detected": "risk.lightSeismicActivity",
  "Moderate seismic activity": "risk.moderateSeismicActivity",
  "Strong seismic activity detected": "risk.strongSeismicActivity",
}

export function getWeatherDescriptionKey(description: string): string {
  return weatherDescriptionMap[description] || description
}

export function getRiskDescriptionKey(description: string): string {
  return riskDescriptionMap[description] || description
}

export function translateWeatherDescription(description: string, t: (key: string) => string): string {
  const key = getWeatherDescriptionKey(description)
  return t(key)
}

export function translateRiskDescription(description: string, t: (key: string) => string): string {
  const key = getRiskDescriptionKey(description)
  return t(key)
}
