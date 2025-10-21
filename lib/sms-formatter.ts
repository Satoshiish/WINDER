import type { WeatherData } from "@/app/page"

interface RiskData {
  category: string
  risk: number
  description: string
}

interface AlertData {
  type: string
  severity: string
  title: string
  description: string
  areas: string[]
}

/**
 * Format weather data into a formal SMS message
 */
export function formatWeatherSMS(weather: WeatherData, location: string): string {
  const temp = Math.round(weather.temperature)
  const feelsLike = Math.round(weather.feelsLike)

  return `WINDER+ Weather Update - ${location}
Temperature: ${temp}°C (feels like ${feelsLike}°C)
Condition: ${weather.condition}
Humidity: ${weather.humidity}%
Wind Speed: ${weather.windSpeed} km/h
Status: ${weather.description}`
}

/**
 * Format risk prediction into a formal SMS message
 */
export function formatRiskSMS(risks: RiskData[], location: string): string {
  const riskSummary = risks.map((r) => `${r.category}: ${Math.round(r.risk * 100)}% - ${r.description}`).join("\n")

  return `WINDER+ Risk Assessment - ${location}
${riskSummary}

Stay prepared and monitor updates regularly.`
}

/**
 * Format alert into a formal SMS message
 */
export function formatAlertSMS(alert: AlertData, location: string): string {
  const severity = alert.severity.toUpperCase()
  const areas = alert.areas.join(", ")

  return `WINDER+ ${severity} ALERT - ${location}
Type: ${alert.type}
Title: ${alert.title}
Description: ${alert.description}
Affected Areas: ${areas}

Take appropriate precautions immediately.`
}

/**
 * Format emergency update into a formal SMS message
 */
export function formatEmergencySMS(emergencyType: string, location: string, details: string): string {
  return `WINDER+ EMERGENCY UPDATE - ${location}
Type: ${emergencyType}
Details: ${details}

Contact emergency services if needed: 911 or local emergency number`
}

/**
 * Format combined weather and risk update
 */
export function formatCombinedUpdateSMS(weather: WeatherData, risks: RiskData[], location: string): string {
  const temp = Math.round(weather.temperature)
  const highestRisk = risks.reduce((max, r) => (r.risk > max.risk ? r : max), risks[0])

  return `WINDER+ Update - ${location}
Weather: ${weather.condition}, ${temp}°C
Highest Risk: ${highestRisk.category} (${Math.round(highestRisk.risk * 100)}%)
Humidity: ${weather.humidity}% | Wind: ${weather.windSpeed} km/h

Stay alert and prepared.`
}
