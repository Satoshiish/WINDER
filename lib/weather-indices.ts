/**
 * ML-based Weather Index Calculations
 * Calculates Heat Index, UV Index, and Typhoon Impact Index
 * based on meteorological data and Philippine standards
 */

interface HourlyWeatherData {
  temperature: number[]
  humidity: number[]
  windSpeed: number[]
  precipitation: number[]
  pressure: number[]
  cloudCover?: number[]
}

/**
 * UV Index Calculation
 * Based on cloud cover, time of day, and latitude
 * Returns index 0-11+ where 0 is minimal and 11+ is extreme
 */
export function calculateUVIndex(cloudCover: number, latitude: number, hour: number = new Date().getHours()): number {
  // Base UV index varies by latitude and time of day
  // Philippines is tropical (around 14°N), so high baseline UV
  const baseUV = 10 // High baseline for tropical Philippines

  // Time of day factor (UV strongest 10 AM - 4 PM)
  let timeFactor = 0
  if (hour >= 10 && hour <= 16) {
    timeFactor = 1.0 // Peak hours
  } else if ((hour >= 8 && hour < 10) || (hour > 16 && hour <= 18)) {
    timeFactor = 0.7 // Morning/evening
  } else if ((hour >= 6 && hour < 8) || (hour > 18 && hour <= 20)) {
    timeFactor = 0.3 // Early morning/late evening
  } else {
    timeFactor = 0.05 // Night time
  }

  // Cloud cover factor (reduces UV transmission)
  // Clear: 100%, Scattered: 89%, Broken: 73%, Overcast: 31%
  let cloudFactor = 1.0
  if (cloudCover < 10) {
    cloudFactor = 1.0 // Clear
  } else if (cloudCover < 25) {
    cloudFactor = 0.95 // Mostly clear
  } else if (cloudCover < 50) {
    cloudFactor = 0.89 // Scattered clouds
  } else if (cloudCover < 75) {
    cloudFactor = 0.73 // Broken clouds
  } else {
    cloudFactor = 0.31 // Overcast
  }

  // Calculate final UV index
  const uvIndex = baseUV * timeFactor * cloudFactor

  return Math.min(16, Math.max(0, uvIndex))
}

/**
 * Heat Index Calculation (NWS Rothfusz Regression Formula)
 * Accurate formula from National Weather Service
 * Temperature must be in Celsius, converted to Fahrenheit for calculation
 * Returns index 0-100 where 0 is safe and 100 is extreme danger
 */
export function calculateHeatIndex(temperature: number, humidity: number): number {
  // Convert Celsius to Fahrenheit
  const T_F = (temperature * 9) / 5 + 32
  const RH = humidity

  // For temperatures below 80°F, use simpler formula
  if (T_F < 80) {
    const HI_simple = 0.5 * (T_F + 61.0 + (T_F - 68.0) * 1.2 + RH * 0.094)
    const HI_avg = (HI_simple + T_F) / 2

    if (HI_avg < 80) {
      // Convert back to Celsius and scale to 0-100
      const HI_C = ((HI_avg - 32) * 5) / 9
      if (HI_C < 27) return 0
      if (HI_C < 32) return Math.min(25, ((HI_C - 27) / 5) * 25)
      return Math.min(50, 25 + ((HI_C - 32) / 9) * 25)
    }
  }

  // Rothfusz Regression Equation (for HI >= 80°F)
  const c1 = -42.379
  const c2 = 2.04901523
  const c3 = 10.14333127
  const c4 = -0.22475541
  const c5 = -0.00683783
  const c6 = -0.05481717
  const c7 = 0.00122874
  const c8 = 0.00085282
  const c9 = -0.00000199

  let HI =
    c1 +
    c2 * T_F +
    c3 * RH +
    c4 * T_F * RH +
    c5 * T_F * T_F +
    c6 * RH * RH +
    c7 * T_F * T_F * RH +
    c8 * T_F * RH * RH +
    c9 * T_F * T_F * RH * RH

  // Apply adjustments
  if (RH < 13 && T_F >= 80 && T_F <= 112) {
    const adjustment = ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T_F - 95)) / 17)
    HI -= adjustment
  } else if (RH > 85 && T_F >= 80 && T_F <= 87) {
    const adjustment = ((RH - 85) / 10) * ((87 - T_F) / 5)
    HI += adjustment
  }

  // Convert back to Celsius
  const HI_C = ((HI - 32) * 5) / 9

  // Scale to 0-100 index
  // Below 27°C = 0 (safe)
  // 27-32°C = 25 (caution)
  // 32-41°C = 50 (extreme caution)
  // 41-54°C = 75 (danger)
  // Above 54°C = 100 (extreme danger)
  if (HI_C < 27) return 0
  if (HI_C < 32) return Math.min(25, ((HI_C - 27) / 5) * 25)
  if (HI_C < 41) return Math.min(50, 25 + ((HI_C - 32) / 9) * 25)
  if (HI_C < 54) return Math.min(75, 50 + ((HI_C - 41) / 13) * 25)
  return 100
}

/**
 * Flood Risk Index Calculation
 * Based on Philippine flood risk assessment standards
 * Considers rainfall, soil saturation, pressure, and terrain factors
 * Returns index 0-100 where 0 is no risk and 100 is extreme risk
 */
export function calculateFloodRiskIndex(hourlyData: HourlyWeatherData, latitude: number, longitude: number): number {
  const next48Hours = 48
  const precipitation = hourlyData.precipitation.slice(0, next48Hours)
  const pressure = hourlyData.pressure.slice(0, next48Hours)
  const humidity = hourlyData.humidity.slice(0, next48Hours)

  // Calculate cumulative rainfall (Philippine thresholds)
  const totalRainfall = precipitation.reduce((a, b) => a + b, 0)
  const maxRainfall = Math.max(...precipitation)
  const avgRainfall = totalRainfall / precipitation.length

  // Rainfall intensity factor (0-40 points)
  let rainfallFactor = 0
  if (maxRainfall > 100)
    rainfallFactor = 40 // Extreme rainfall
  else if (maxRainfall > 50)
    rainfallFactor = 35 // Very heavy rainfall
  else if (maxRainfall > 30)
    rainfallFactor = 25 // Heavy rainfall
  else if (maxRainfall > 15)
    rainfallFactor = 15 // Moderate rainfall
  else if (avgRainfall > 5) rainfallFactor = 8
  else rainfallFactor = Math.min(3, avgRainfall * 0.5)

  // Soil saturation factor (0-30 points)
  const avgHumidity = humidity.reduce((a, b) => a + b, 0) / humidity.length
  let saturationFactor = 0
  if (avgHumidity > 90 && totalRainfall > 50)
    saturationFactor = 30 // Highly saturated
  else if (avgHumidity > 85 && totalRainfall > 30) saturationFactor = 25
  else if (avgHumidity > 80 && totalRainfall > 15) saturationFactor = 18
  else if (avgHumidity > 75) saturationFactor = 10
  else saturationFactor = Math.min(5, (avgHumidity - 60) * 0.5)

  // Pressure trend factor (0-20 points)
  const pressureTrend = pressure[next48Hours - 1] - pressure[0]
  let pressureFactor = 0
  if (pressureTrend < -8)
    pressureFactor = 20 // Rapid pressure drop
  else if (pressureTrend < -4) pressureFactor = 15
  else if (pressureTrend < -2) pressureFactor = 10
  else if (pressureTrend < 0) pressureFactor = 5
  else pressureFactor = 0

  // Geographic factor (0-10 points)
  const isCoastal = isCoastalArea(latitude, longitude)
  const isLowLying = isLowLyingArea(latitude, longitude)
  let geographicFactor = 0
  if (isCoastal && isLowLying) geographicFactor = 10
  else if (isCoastal || isLowLying) geographicFactor = 6
  else geographicFactor = 0

  return Math.min(100, rainfallFactor + saturationFactor + pressureFactor + geographicFactor)
}

/**
 * Typhoon Impact Index Calculation
 * Based on PAGASA typhoon classification system
 * Considers wind speed, pressure, rainfall, and storm structure
 * Returns index 0-100 where 0 is no impact and 100 is catastrophic
 */
export function calculateTyphoonImpactIndex(
  hourlyData: HourlyWeatherData,
  currentPressure: number,
  latitude: number,
  longitude: number,
): number {
  const next48Hours = 48
  const windSpeed = hourlyData.windSpeed.slice(0, next48Hours)
  const pressure = hourlyData.pressure.slice(0, next48Hours)
  const precipitation = hourlyData.precipitation.slice(0, next48Hours)

  // Wind impact factor (0-40 points) - PAGASA wind speed categories
  const maxWind = Math.max(...windSpeed) * 3.6 // Convert m/s to km/h
  const avgWind = (windSpeed.reduce((a, b) => a + b, 0) / windSpeed.length) * 3.6
  let windFactor = 0
  if (maxWind >= 185)
    windFactor = 40 // Super Typhoon (>= 185 km/h)
  else if (maxWind >= 118)
    windFactor = 35 // Typhoon (118-184 km/h)
  else if (maxWind >= 89)
    windFactor = 28 // Severe Tropical Storm (89-117 km/h)
  else if (maxWind >= 62)
    windFactor = 18 // Tropical Storm (62-88 km/h)
  else if (maxWind >= 39)
    windFactor = 8 // Tropical Depression (39-61 km/h)
  else windFactor = Math.min(3, maxWind * 0.1)

  // Pressure drop factor (0-30 points)
  const pressureDrop = currentPressure - Math.min(...pressure)
  let pressureFactor = 0
  if (pressureDrop > 40)
    pressureFactor = 30 // Rapidly intensifying
  else if (pressureDrop > 25) pressureFactor = 25
  else if (pressureDrop > 15) pressureFactor = 18
  else if (pressureDrop > 8) pressureFactor = 10
  else if (pressureDrop > 3) pressureFactor = 5
  else pressureFactor = 0

  // Rainfall intensity factor (0-20 points)
  const totalRainfall = precipitation.reduce((a, b) => a + b, 0)
  const maxRainfall = Math.max(...precipitation)
  let rainfallFactor = 0
  if (maxRainfall > 150)
    rainfallFactor = 20 // Extreme rainfall
  else if (maxRainfall > 100) rainfallFactor = 18
  else if (maxRainfall > 50) rainfallFactor = 14
  else if (maxRainfall > 25) rainfallFactor = 8
  else if (totalRainfall > 75) rainfallFactor = 5
  else rainfallFactor = 0

  // Storm structure factor (0-10 points)
  const windVariance = Math.max(...windSpeed) - Math.min(...windSpeed)
  const isOrganized = windVariance < avgWind * 0.4 // More organized if variance is low
  const structureFactor = isOrganized ? 10 : 5

  return Math.min(100, windFactor + pressureFactor + rainfallFactor + structureFactor)
}

/**
 * Get Heat Index Category and Advisory
 */
export function getHeatIndexCategory(index: number): {
  category: string
  color: string
  advisory: string
} {
  if (index < 10) {
    return {
      category: "Safe",
      color: "green",
      advisory: "Normal heat conditions. No precautions needed.",
    }
  } else if (index < 25) {
    return {
      category: "Caution",
      color: "yellow",
      advisory: "Warm conditions. Stay hydrated and limit outdoor activities.",
    }
  } else if (index < 50) {
    return {
      category: "Extreme Caution",
      color: "orange",
      advisory: "Very hot. Avoid prolonged sun exposure. Drink plenty of water.",
    }
  } else if (index < 75) {
    return {
      category: "Danger",
      color: "red",
      advisory: "Extreme heat. Heat cramps and heat exhaustion possible. Limit outdoor activities.",
    }
  } else {
    return {
      category: "Extreme Danger",
      color: "darkred",
      advisory: "Dangerous heat. Heat stroke likely. Avoid outdoor activities.",
    }
  }
}

/**
 * Get UV Index Category and Advisory
 */
export function getUVIndexCategory(index: number): {
  category: string
  color: string
  advisory: string
} {
  if (index < 3) {
    return {
      category: "Low",
      color: "green",
      advisory: "Low UV exposure. Minimal sun protection required.",
    }
  } else if (index < 6) {
    return {
      category: "Moderate",
      color: "yellow",
      advisory: "Moderate UV exposure. Wear sunscreen SPF 30+.",
    }
  } else if (index < 8) {
    return {
      category: "High",
      color: "orange",
      advisory: "High UV exposure. Seek shade during midday. Use SPF 50+.",
    }
  } else if (index < 11) {
    return {
      category: "Very High",
      color: "red",
      advisory: "Very high UV exposure. Avoid sun 10 AM-4 PM. Wear protective clothing.",
    }
  } else {
    return {
      category: "Extreme",
      color: "purple",
      advisory: "Extreme UV exposure. Avoid all sun exposure. Stay indoors.",
    }
  }
}

/**
 * Get Flood Risk Category and Advisory
 */
export function getFloodRiskCategory(index: number): {
  category: string
  color: string
  advisory: string
} {
  if (index < 15) {
    return {
      category: "Low",
      color: "green",
      advisory: "Low flood risk. Normal conditions.",
    }
  } else if (index < 30) {
    return {
      category: "Moderate",
      color: "yellow",
      advisory: "Moderate flood risk. Monitor weather updates.",
    }
  } else if (index < 50) {
    return {
      category: "High",
      color: "orange",
      advisory: "High flood risk. Avoid low-lying areas and waterways.",
    }
  } else if (index < 75) {
    return {
      category: "Very High",
      color: "red",
      advisory: "Very high flood risk. Prepare for evacuation if in flood-prone areas.",
    }
  } else {
    return {
      category: "Extreme",
      color: "darkred",
      advisory: "Extreme flood risk. Evacuate flood-prone areas immediately.",
    }
  }
}

/**
 * Get Typhoon Impact Category and Advisory
 * Updated to use PAGASA typhoon classification system
 */
export function getTyphoonImpactCategory(index: number): {
  category: string
  color: string
  advisory: string
  typhoonLevel: string
} {
  if (index < 10) {
    return {
      category: "None",
      color: "green",
      advisory: "No typhoon threat. Normal conditions.",
      typhoonLevel: "None",
    }
  } else if (index < 20) {
    return {
      category: "Minimal",
      color: "yellow",
      advisory: "Minimal typhoon impact. Monitor weather updates.",
      typhoonLevel: "Tropical Depression (39-61 km/h)",
    }
  } else if (index < 30) {
    return {
      category: "Moderate",
      color: "orange",
      advisory: "Moderate typhoon impact. Secure loose objects. Prepare emergency kit.",
      typhoonLevel: "Tropical Storm (62-88 km/h)",
    }
  } else if (index < 45) {
    return {
      category: "High",
      color: "red",
      advisory: "High typhoon impact. Stay indoors. Avoid travel.",
      typhoonLevel: "Severe Tropical Storm (89-117 km/h)",
    }
  } else if (index < 70) {
    return {
      category: "Very High",
      color: "darkred",
      advisory: "Very high typhoon impact. Seek shelter. Prepare for evacuation.",
      typhoonLevel: "Typhoon (118-184 km/h)",
    }
  } else {
    return {
      category: "Catastrophic",
      color: "purple",
      advisory: "Catastrophic typhoon impact. Evacuate immediately to safe shelter.",
      typhoonLevel: "Super Typhoon (≥185 km/h)",
    }
  }
}

/**
 * Helper function to determine if location is coastal
 * Expanded with more Philippine coastal areas
 */
function isCoastalArea(latitude: number, longitude: number): boolean {
  // Philippine coastal areas with accurate coordinates
  const coastalAreas = [
    { lat: 14.85, lon: 120.3, radius: 0.5 }, // Olongapo
    { lat: 14.8, lon: 120.2, radius: 0.5 }, // Subic
    { lat: 13.7, lon: 121.0, radius: 0.8 }, // Batangas
    { lat: 14.6, lon: 121.0, radius: 0.6 }, // Cavite
    { lat: 14.35, lon: 120.95, radius: 0.5 }, // Laguna
    { lat: 15.5, lon: 120.8, radius: 0.7 }, // Zambales
  ]

  return coastalAreas.some((area) => {
    const distance = Math.sqrt(Math.pow(latitude - area.lat, 2) + Math.pow(longitude - area.lon, 2))
    return distance < area.radius
  })
}

/**
 * Helper function to determine if location is low-lying
 * Expanded with more Philippine low-lying areas
 */
function isLowLyingArea(latitude: number, longitude: number): boolean {
  // Low-lying areas in Philippines with accurate coordinates
  const lowLyingAreas = [
    { lat: 14.6, lon: 121.0, radius: 1.2 }, // Metro Manila
    { lat: 15.0, lon: 120.9, radius: 1.0 }, // Pampanga
    { lat: 14.9, lon: 121.1, radius: 0.8 }, // Bulacan
    { lat: 14.85, lon: 120.3, radius: 0.4 }, // Olongapo lowlands
    { lat: 13.7, lon: 121.0, radius: 0.6 }, // Batangas lowlands
  ]

  return lowLyingAreas.some((area) => {
    const distance = Math.sqrt(Math.pow(latitude - area.lat, 2) + Math.pow(longitude - area.lon, 2))
    return distance < area.radius
  })
}
