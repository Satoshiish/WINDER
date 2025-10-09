// Reverse geocoding utility for Philippine barangays using Nominatim API
// This provides accurate barangay lookup for any coordinates in the Philippines

interface GeocodingResult {
  barangay?: string
  municipality?: string
  city?: string
  province?: string
  formatted: string
}

// Cache for geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, GeocodingResult>()

// Generate cache key from coordinates (rounded to 5 decimal places for ~1m precision)
function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`
}

// Reverse geocode coordinates to get barangay information
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
  const cacheKey = getCacheKey(lat, lng)

  // Check cache first
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!
  }

  try {
    // Use Nominatim API (OpenStreetMap) for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "WeatherHub/1.0",
        },
      },
    )

    if (!response.ok) {
      throw new Error("Geocoding API request failed")
    }

    const data = await response.json()
    const address = data.address || {}

    // Extract barangay and location information
    const barangay = address.suburb || address.neighbourhood || address.hamlet || address.village
    const city = address.city || address.town || address.municipality
    const province = address.state || address.province

    // Format the result
    let formatted = "Unknown Location"
    if (barangay && city) {
      formatted = `${barangay}, ${city}`
    } else if (city && province) {
      formatted = `${city}, ${province}`
    } else if (city) {
      formatted = city
    } else if (province) {
      formatted = province
    }

    const result: GeocodingResult = {
      barangay,
      municipality: city,
      city,
      province,
      formatted: formatLocation(formatted),
    }

    // Cache the result
    geocodingCache.set(cacheKey, result)

    return result
  } catch (error) {
    console.error("[v0] Geocoding error:", error)

    // Return fallback result
    const fallback: GeocodingResult = {
      formatted: "Unknown Location",
    }
    return fallback
  }
}

// Format location with proper capitalization
function formatLocation(location: string): string {
  if (location === "Unknown Location") {
    return location
  }

  // Split by comma to separate parts
  const parts = location.split(",").map((part) => part.trim())

  // Apply title case to each part
  return parts
    .map((part) => {
      return part
        .split(" ")
        .map((word) => {
          // Handle special cases
          const lower = word.toLowerCase()
          if (lower === "sta" || lower === "sta.") return "Sta"
          if (lower === "sto" || lower === "sto.") return "Sto"
          if (lower === "san") return "San"
          if (lower === "santa") return "Santa"
          if (lower === "santo") return "Santo"
          if (lower === "de") return "de"
          if (lower === "del") return "del"
          if (lower === "las") return "las"
          if (lower === "los") return "los"

          // Capitalize first letter of each word
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join(" ")
    })
    .join(", ")
}

// Get barangay from coordinates (main export function)
export async function getBarangayFromCoordinates(lat: number, lng: number): Promise<string> {
  const result = await reverseGeocode(lat, lng)
  return result.formatted
}
