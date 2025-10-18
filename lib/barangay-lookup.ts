// Barangay lookup utility using reverse geocoding for nationwide coverage
// Uses Nominatim API (OpenStreetMap) for accurate barangay identification across the Philippines

interface BarangayBoundary {
  name: string
  city: string
  lat: number
  lng: number
  radius: number // in kilometers
}

// Fallback barangay data for offline scenarios or API failures
const fallbackBarangayData: BarangayBoundary[] = [
  // Olongapo City Barangays - Updated with accurate coordinates
  { name: "Sta Rita", city: "Olongapo City", lat: 14.8458, lng: 120.2914, radius: 1.5 },
  { name: "Gordon Heights", city: "Olongapo City", lat: 14.8156, lng: 120.2689, radius: 1.2 },
  { name: "East Bajac-Bajac", city: "Olongapo City", lat: 14.8347, lng: 120.2892, radius: 1.0 },
  { name: "West Bajac-Bajac", city: "Olongapo City", lat: 14.8289, lng: 120.2756, radius: 1.0 },
  { name: "East Tapinac", city: "Olongapo City", lat: 14.8423, lng: 120.2945, radius: 1.0 },
  { name: "West Tapinac", city: "Olongapo City", lat: 14.8378, lng: 120.2834, radius: 1.0 },
  { name: "Barretto", city: "Olongapo City", lat: 14.7989, lng: 120.2567, radius: 2.0 },
  { name: "New Cabalan", city: "Olongapo City", lat: 14.8512, lng: 120.2978, radius: 1.5 },
  { name: "Old Cabalan", city: "Olongapo City", lat: 14.8512, lng: 120.3045, radius: 1.0 },
  { name: "Pag-asa", city: "Olongapo City", lat: 14.8534, lng: 120.3012, radius: 1.2 },
  { name: "Kalaklan", city: "Olongapo City", lat: 14.8623, lng: 120.3089, radius: 1.5 },
  { name: "Mabayuan", city: "Olongapo City", lat: 14.8712, lng: 120.3156, radius: 2.0 },
  { name: "New Kalalake", city: "Olongapo City", lat: 14.8401, lng: 120.2912, radius: 1.0 },
  { name: "Old Kalalake", city: "Olongapo City", lat: 14.8367, lng: 120.2867, radius: 0.8 },
  { name: "New Ilalim", city: "Olongapo City", lat: 14.8334, lng: 120.2823, radius: 0.8 },
  { name: "Old Ilalim", city: "Olongapo City", lat: 14.8301, lng: 120.2789, radius: 0.8 },
  { name: "New Asinan", city: "Olongapo City", lat: 14.8267, lng: 120.2745, radius: 1.0 },
  { name: "Asinan Poblacion", city: "Olongapo City", lat: 14.8234, lng: 120.2712, radius: 0.8 },
]

// Cache for geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, string>()

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Fallback function using local database
function getBarangayFromLocalData(lat: number, lng: number): string {
  let closestBarangay: BarangayBoundary | null = null
  let minDistance = Number.POSITIVE_INFINITY

  for (const barangay of fallbackBarangayData) {
    const distance = calculateDistance(lat, lng, barangay.lat, barangay.lng)

    if (distance <= barangay.radius && distance < minDistance) {
      minDistance = distance
      closestBarangay = barangay
    }
  }

  if (closestBarangay) {
    return `${closestBarangay.name}, ${closestBarangay.city}`
  }

  return "Unknown Barangay"
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // Use Nominatim API for reverse geocoding
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

    // Extract barangay and city from the response
    const address = data.address || {}

    // Try to get barangay (suburb, neighbourhood, or village in OSM)
    const barangay =
      address.suburb || address.neighbourhood || address.village || address.hamlet || address.quarter || null

    // Try to get city (city, town, or municipality)
    const city =
      address.city || address.town || address.municipality || address.county || address.state_district || null

    if (barangay && city) {
      return `${barangay}, ${city}`
    } else if (barangay) {
      return barangay
    } else if (city) {
      return city
    }

    // If no barangay found in API, try local database
    return getBarangayFromLocalData(lat, lng)
  } catch (error) {
    console.error("[v0] Reverse geocoding error:", error)
    // Fallback to local database on error
    return getBarangayFromLocalData(lat, lng)
  }
}

export async function getBarangayFromCoordinates(lat: number, lng: number): Promise<string> {
  // Create cache key (rounded to 4 decimal places for ~11m precision)
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`

  // Check cache first
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!
  }

  // Perform reverse geocoding
  const barangay = await reverseGeocode(lat, lng)

  // Cache the result
  geocodingCache.set(cacheKey, barangay)

  return barangay
}

// Format barangay name with proper capitalization
export function formatBarangay(barangay: string | undefined | null): string {
  if (!barangay || typeof barangay !== "string") {
    return "Unknown Barangay"
  }

  if (barangay === "Unknown Barangay") {
    return barangay
  }

  // Split by comma to separate barangay and city
  const parts = barangay.split(",").map((part) => part.trim())

  // Apply title case to each part
  return parts
    .map((part) => {
      return part
        .split(" ")
        .map((word) => {
          // Handle special cases
          if (word.toLowerCase() === "sta") return "Sta"
          if (word.toLowerCase() === "sto") return "Sto"
          if (word.toLowerCase() === "san") return "San"
          if (word.toLowerCase() === "santa") return "Santa"
          if (word.toLowerCase() === "santo") return "Santo"
          // Capitalize first letter of each word
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join(" ")
    })
    .join(", ")
}
