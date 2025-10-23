// Reverse geocoding utility for Philippine barangays using Nominatim API
// Now with accurate Olongapo barangay coordinates and precision-based selection

interface GeocodingResult {
  barangay?: string
  municipality?: string
  city?: string
  province?: string
  formatted: string
}

// Barangay boundaries for accurate local lookup
interface BarangayBoundary {
  name: string
  city: string
  lat: number
  lng: number
  radius: number // in kilometers
}

// --- Olongapo City Accurate Barangays ---
const fallbackBarangayData: BarangayBoundary[] = [
  { name: "Asinan", city: "Olongapo City", lat: 14.8279, lng: 120.2761, radius: 0.6 },
  { name: "Barretto", city: "Olongapo City", lat: 14.8042, lng: 120.2596, radius: 0.8 },
  { name: "East Bajac-Bajac", city: "Olongapo City", lat: 14.8373, lng: 120.2882, radius: 0.5 },
  { name: "East Tapinac", city: "Olongapo City", lat: 14.8458, lng: 120.2958, radius: 0.6 },
  { name: "Gordon Heights", city: "Olongapo City", lat: 14.8209, lng: 120.2719, radius: 0.6 },
  { name: "Kalaklan", city: "Olongapo City", lat: 14.8631, lng: 120.3084, radius: 0.7 },
  { name: "Mabayuan", city: "Olongapo City", lat: 14.8723, lng: 120.3145, radius: 0.7 },
  { name: "New Asinan", city: "Olongapo City", lat: 14.8318, lng: 120.2795, radius: 0.5 },
  { name: "New Cabalan", city: "Olongapo City", lat: 14.8526, lng: 120.3059, radius: 0.6 },
  { name: "New Kalalake", city: "Olongapo City", lat: 14.8418, lng: 120.2916, radius: 0.5 },
  { name: "Old Cabalan", city: "Olongapo City", lat: 14.8502, lng: 120.3104, radius: 0.5 },
  { name: "Old Kalalake", city: "Olongapo City", lat: 14.8389, lng: 120.2852, radius: 0.5 },
  { name: "Pag-asa", city: "Olongapo City", lat: 14.8506, lng: 120.2993, radius: 0.6 },
  { name: "Sta. Rita", city: "Olongapo City", lat: 14.8574, lng: 120.3018, radius: 0.7 },
  { name: "West Bajac-Bajac", city: "Olongapo City", lat: 14.8315, lng: 120.2812, radius: 0.5 },
  { name: "West Tapinac", city: "Olongapo City", lat: 14.8395, lng: 120.2868, radius: 0.6 },
  { name: "East Kalayaan", city: "Olongapo City", lat: 14.8531, lng: 120.3122, radius: 0.6 },
  { name: "West Kalayaan", city: "Olongapo City", lat: 14.8479, lng: 120.3095, radius: 0.6 },
]

// Cache for geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, GeocodingResult>()

// Calculate distance using the Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Improved local barangay lookup (prevents overlapping)
function getBarangayFromLocalData(lat: number, lng: number): string {
  const distances = fallbackBarangayData.map((b) => ({
    ...b,
    distance: calculateDistance(lat, lng, b.lat, b.lng),
  }))

  distances.sort((a, b) => a.distance - b.distance)

  const closest = distances[0]
  const nextClosest = distances[1]

  // Check that the closest is within radius and clearly distinct
  if (
    closest &&
    closest.distance <= closest.radius &&
    (!nextClosest || nextClosest.distance - closest.distance > 0.3)
  ) {
    return `${closest.name}, ${closest.city}`
  }

  return "Unknown Location"
}

// Cache key generator (round coordinates to 5 decimals)
function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`
}

// Reverse geocode using Nominatim with Olongapo bias
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
  const cacheKey = getCacheKey(lat, lng)

  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
      {
        headers: {
          "User-Agent": "EvacMap/1.0 (Olongapo Disaster System)",
        },
      }
    )

    if (!response.ok) throw new Error("Geocoding API request failed")

    const data = await response.json()
    const address = data.address || {}

    const barangay =
      address.suburb ||
      address.neighbourhood ||
      address.hamlet ||
      address.village ||
      address.quarter
    const city = address.city || address.town || address.municipality
    const province = address.state || address.province

    let formatted = "Unknown Location"

    // Prioritize Olongapo City barangays
    if (barangay && city?.toLowerCase().includes("olongapo")) {
      formatted = `${barangay}, Olongapo City`
    } else if (city?.toLowerCase().includes("olongapo")) {
      formatted = getBarangayFromLocalData(lat, lng)
    } else if (barangay && city) {
      formatted = `${barangay}, ${city}`
    } else if (city) {
      formatted = city
    } else if (province) {
      formatted = province
    } else {
      formatted = getBarangayFromLocalData(lat, lng)
    }

    const result: GeocodingResult = {
      barangay,
      municipality: city,
      city,
      province,
      formatted: formatLocation(formatted),
    }

    geocodingCache.set(cacheKey, result)
    return result
  } catch (error) {
    console.error("[Geocoding Error]:", error)
    const fallback = getBarangayFromLocalData(lat, lng)
    return { formatted: fallback }
  }
}

// Proper title-cased formatting
function formatLocation(location: string): string {
  if (location === "Unknown Location") return location

  return location
    .split(",")
    .map((part) =>
      part
        .trim()
        .split(" ")
        .map((word) => {
          const lower = word.toLowerCase()
          if (["sta", "sta.", "santa"].includes(lower)) return "Sta."
          if (["sto", "sto.", "santo"].includes(lower)) return "Sto."
          if (["de", "del", "las", "los"].includes(lower)) return lower
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join(" ")
    )
    .join(", ")
}

// Public function to get barangay from coordinates
export async function getBarangayFromCoordinates(lat: number, lng: number): Promise<string> {
  const result = await reverseGeocode(lat, lng)
  return result.formatted
}
