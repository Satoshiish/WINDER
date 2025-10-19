// Barangay and street lookup utility using reverse geocoding for nationwide coverage
// Uses Nominatim API (OpenStreetMap) for accurate barangay identification across the Philippines

interface BarangayBoundary {
  name: string
  city: string
  lat: number
  lng: number
  radius: number // in kilometers
}

// Comprehensive barangay data for Luzon, Visayas, and Mindanao
const fallbackBarangayData: BarangayBoundary[] = [
  // LUZON - Olongapo City Barangays
  { name: "Sta Rita", city: "Olongapo City", lat: 14.8436, lng: 120.3089, radius: 1.2 },
  { name: "Gordon Heights", city: "Olongapo City", lat: 14.8156, lng: 120.2689, radius: 1.2 },
  { name: "East Bajac-Bajac", city: "Olongapo City", lat: 14.8347, lng: 120.2892, radius: 1.0 },
  { name: "West Bajac-Bajac", city: "Olongapo City", lat: 14.8289, lng: 120.2756, radius: 1.0 },
  { name: "East Tapinac", city: "Olongapo City", lat: 14.8423, lng: 120.2945, radius: 1.0 },
  { name: "West Tapinac", city: "Olongapo City", lat: 14.8378, lng: 120.2834, radius: 1.0 },
  { name: "Barretto", city: "Olongapo City", lat: 14.7989, lng: 120.2567, radius: 2.0 },
  { name: "New Cabalan", city: "Olongapo City", lat: 14.8512, lng: 120.2978, radius: 1.5 },
  { name: "Old Cabalan", city: "Olongapo City", lat: 14.8512, lng: 120.3045, radius: 1.0 },
  { name: "Pag-asa", city: "Olongapo City", lat: 14.8534, lng: 120.3012, radius: 1.2 },
  { name: "Kalaklan", city: "Olongapo City", lat: 14.8623, lng: 120.3089, radius: 0.8 },
  { name: "Mabayuan", city: "Olongapo City", lat: 14.8712, lng: 120.3156, radius: 2.0 },
  { name: "New Kalalake", city: "Olongapo City", lat: 14.8401, lng: 120.2912, radius: 1.0 },
  { name: "Old Kalalake", city: "Olongapo City", lat: 14.8367, lng: 120.2867, radius: 0.8 },
  { name: "New Ilalim", city: "Olongapo City", lat: 14.8334, lng: 120.2823, radius: 0.8 },
  { name: "Old Ilalim", city: "Olongapo City", lat: 14.8301, lng: 120.2789, radius: 0.8 },
  { name: "New Asinan", city: "Olongapo City", lat: 14.8267, lng: 120.2745, radius: 1.0 },
  { name: "Asinan Poblacion", city: "Olongapo City", lat: 14.8234, lng: 120.2712, radius: 0.8 },

  // LUZON - Subic Bay Barangays
  { name: "Barrio Barretto", city: "Subic", lat: 14.7856, lng: 120.2345, radius: 1.5 },
  { name: "Barrio Kanluran", city: "Subic", lat: 14.7923, lng: 120.2412, radius: 1.2 },
  { name: "Barrio Timog", city: "Subic", lat: 14.7834, lng: 120.2534, radius: 1.0 },

  // LUZON - Manila Barangays
  { name: "Ermita", city: "Manila", lat: 14.5764, lng: 121.0851, radius: 1.2 },
  { name: "Intramuros", city: "Manila", lat: 14.5972, lng: 120.9789, radius: 1.0 },
  { name: "Malate", city: "Manila", lat: 14.5647, lng: 121.0223, radius: 1.3 },
  { name: "Quiapo", city: "Manila", lat: 14.5995, lng: 120.9842, radius: 1.1 },
  { name: "Sampaloc", city: "Manila", lat: 14.6089, lng: 121.0012, radius: 1.4 },
  { name: "Santa Cruz", city: "Manila", lat: 14.6156, lng: 121.0089, radius: 1.2 },
  { name: "Tondo", city: "Manila", lat: 14.6234, lng: 120.9756, radius: 1.5 },
  { name: "Binondo", city: "Manila", lat: 14.5956, lng: 120.9834, radius: 1.0 },
  { name: "San Nicolas", city: "Manila", lat: 14.6012, lng: 120.9923, radius: 0.9 },
  { name: "Pandacan", city: "Manila", lat: 14.6345, lng: 121.0234, radius: 1.1 },

  // LUZON - Quezon City Barangays
  { name: "Quezon City Proper", city: "Quezon City", lat: 14.6042, lng: 121.0122, radius: 2.0 },
  { name: "Diliman", city: "Quezon City", lat: 14.6352, lng: 121.0456, radius: 1.8 },
  { name: "Cubao", city: "Quezon City", lat: 14.6234, lng: 121.0567, radius: 1.5 },
  { name: "Novaliches", city: "Quezon City", lat: 14.7123, lng: 121.0234, radius: 2.2 },
  { name: "Fairview", city: "Quezon City", lat: 14.7456, lng: 121.0789, radius: 1.9 },
  { name: "Kamuning", city: "Quezon City", lat: 14.6456, lng: 121.0345, radius: 1.3 },
  { name: "Makiki", city: "Quezon City", lat: 14.6567, lng: 121.0456, radius: 1.2 },

  // LUZON - Makati Barangays
  { name: "Makati Proper", city: "Makati", lat: 14.5567, lng: 121.0234, radius: 1.5 },
  { name: "Bangkal", city: "Makati", lat: 14.5634, lng: 121.0345, radius: 1.2 },
  { name: "Bel-Air", city: "Makati", lat: 14.5456, lng: 121.0456, radius: 1.1 },
  { name: "Dasmariñas", city: "Makati", lat: 14.5345, lng: 121.0567, radius: 1.3 },
  { name: "Pio del Pilar", city: "Makati", lat: 14.5234, lng: 121.0234, radius: 1.0 },

  // LUZON - Cebu City (Visayas)
  { name: "Cebu City Proper", city: "Cebu City", lat: 10.3157, lng: 123.8854, radius: 1.8 },
  { name: "Apas", city: "Cebu City", lat: 10.3234, lng: 123.8923, radius: 1.2 },
  { name: "Basak San Nicolas", city: "Cebu City", lat: 10.3345, lng: 123.9012, radius: 1.3 },
  { name: "Busay", city: "Cebu City", lat: 10.3456, lng: 123.8834, radius: 1.4 },
  { name: "Calamba", city: "Cebu City", lat: 10.3567, lng: 123.8945, radius: 1.1 },
  { name: "Carreta", city: "Cebu City", lat: 10.3234, lng: 123.8756, radius: 1.0 },
  { name: "Cogon", city: "Cebu City", lat: 10.3123, lng: 123.8834, radius: 1.2 },
  { name: "Lahug", city: "Cebu City", lat: 10.3012, lng: 123.8923, radius: 1.1 },
  { name: "Mabolo", city: "Cebu City", lat: 10.2934, lng: 123.8845, radius: 1.3 },
  { name: "Pardo", city: "Cebu City", lat: 10.2845, lng: 123.8756, radius: 1.4 },

  // VISAYAS - Iloilo City Barangays
  { name: "Iloilo City Proper", city: "Iloilo City", lat: 10.6952, lng: 122.5597, radius: 1.6 },
  { name: "Arevalo", city: "Iloilo City", lat: 10.6834, lng: 122.5456, radius: 1.4 },
  { name: "Caluya", city: "Iloilo City", lat: 10.7012, lng: 122.5678, radius: 1.2 },
  { name: "Jaro", city: "Iloilo City", lat: 10.7123, lng: 122.5789, radius: 1.5 },
  { name: "Mandurriao", city: "Iloilo City", lat: 10.7234, lng: 122.5834, radius: 1.3 },
  { name: "Molo", city: "Iloilo City", lat: 10.6845, lng: 122.5345, radius: 1.2 },

  // VISAYAS - Bacolod City Barangays
  { name: "Bacolod City Proper", city: "Bacolod City", lat: 10.4064, lng: 123.0237, radius: 1.7 },
  { name: "Abutin", city: "Bacolod City", lat: 10.4156, lng: 123.0345, radius: 1.2 },
  { name: "Banago", city: "Bacolod City", lat: 10.4234, lng: 123.0456, radius: 1.3 },
  { name: "Handumanan", city: "Bacolod City", lat: 10.4345, lng: 123.0234, radius: 1.1 },
  { name: "Mansilingan", city: "Bacolod City", lat: 10.4456, lng: 123.0567, radius: 1.4 },

  // MINDANAO - Davao City Barangays
  { name: "Davao City Proper", city: "Davao City", lat: 7.1108, lng: 125.6423, radius: 2.0 },
  { name: "Agdao", city: "Davao City", lat: 7.1234, lng: 125.6534, radius: 1.5 },
  { name: "Bucana", city: "Davao City", lat: 7.1345, lng: 125.6645, radius: 1.3 },
  { name: "Bunawan", city: "Davao City", lat: 7.1456, lng: 125.6756, radius: 1.4 },
  { name: "Calinan", city: "Davao City", lat: 7.1567, lng: 125.6234, radius: 1.6 },
  { name: "Guiwan", city: "Davao City", lat: 7.1012, lng: 125.6345, radius: 1.2 },
  { name: "Jacinto Panal", city: "Davao City", lat: 7.0923, lng: 125.6456, radius: 1.1 },
  { name: "Paquibato", city: "Davao City", lat: 7.0834, lng: 125.6567, radius: 1.5 },
  { name: "Talomo", city: "Davao City", lat: 7.0745, lng: 125.6234, radius: 1.3 },

  // MINDANAO - Cagayan de Oro City Barangays
  { name: "Cagayan de Oro Proper", city: "Cagayan de Oro", lat: 8.4866, lng: 124.6648, radius: 1.8 },
  { name: "Balulang", city: "Cagayan de Oro", lat: 8.4956, lng: 124.6756, radius: 1.4 },
  { name: "Bulua", city: "Cagayan de Oro", lat: 8.5012, lng: 124.6834, radius: 1.3 },
  { name: "Camaman-an", city: "Cagayan de Oro", lat: 8.5123, lng: 124.6945, radius: 1.2 },
  { name: "Gingoog", city: "Cagayan de Oro", lat: 8.5234, lng: 124.6567, radius: 1.5 },
  { name: "Lapasan", city: "Cagayan de Oro", lat: 8.5345, lng: 124.6456, radius: 1.1 },

  // MINDANAO - General Santos City Barangays
  { name: "General Santos City Proper", city: "General Santos", lat: 6.1136, lng: 125.1925, radius: 1.6 },
  { name: "Apopong", city: "General Santos", lat: 6.1234, lng: 125.2012, radius: 1.2 },
  { name: "Bula", city: "General Santos", lat: 6.1345, lng: 125.2123, radius: 1.1 },
  { name: "Dadiangas", city: "General Santos", lat: 6.1456, lng: 125.1834, radius: 1.4 },
  { name: "Lagao", city: "General Santos", lat: 6.1567, lng: 125.1945, radius: 1.3 },

  // MINDANAO - Zamboanga City Barangays
  { name: "Zamboanga City Proper", city: "Zamboanga City", lat: 6.9271, lng: 122.0724, radius: 1.9 },
  { name: "Baliwasan", city: "Zamboanga City", lat: 6.9345, lng: 122.0834, radius: 1.5 },
  { name: "Bunguran", city: "Zamboanga City", lat: 6.9456, lng: 122.0945, radius: 1.3 },
  { name: "Lunzuran", city: "Zamboanga City", lat: 6.9567, lng: 122.0567, radius: 1.2 },
  { name: "Tetuan", city: "Zamboanga City", lat: 6.9234, lng: 122.0456, radius: 1.4 },
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
    // First, check local database for Olongapo City area (14.7-14.9 lat, 120.2-120.4 lng)
    if (lat >= 14.7 && lat <= 14.9 && lng >= 120.2 && lng <= 120.4) {
      console.log(`[v0] Coordinates in Olongapo City area, checking local database first`)
      const localResult = getBarangayFromLocalData(lat, lng)
      if (localResult !== "Unknown Barangay") {
        console.log(`[v0] Found in local database: ${localResult}`)
        return localResult
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "WeatherHub/1.0",
        },
        signal: controller.signal,
      },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`[v0] Nominatim API returned ${response.status}`)
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
      console.log(`[v0] Reverse geocoded from API: ${barangay}, ${city}`)
      return `${barangay}, ${city}`
    } else if (barangay) {
      console.log(`[v0] Reverse geocoded from API: ${barangay}`)
      return barangay
    } else if (city) {
      console.log(`[v0] Reverse geocoded from API: ${city}`)
      return city
    }

    // If no barangay found in API, try local database
    console.log(`[v0] No barangay from API, using local database`)
    return getBarangayFromLocalData(lat, lng)
  } catch (error) {
    console.warn(`[v0] Reverse geocoding error: ${error instanceof Error ? error.message : String(error)}`)
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
