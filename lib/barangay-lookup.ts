// Reverse geocoding utility for Olongapo City Barangays
// Uses OpenStreetMap (Nominatim) with local fallback data

interface BarangayBoundary {
  name: string
  city: string
  lat: number
  lng: number
  radius: number // in kilometers
}

// --- Local Barangay Data (Olongapo City only) ---
const fallbackBarangayData: BarangayBoundary[] = [
  { name: "Sta Rita", city: "Olongapo City", lat: 14.853, lng: 120.2982, radius: 1.5 },
  { name: "Gordon Heights", city: "Olongapo City", lat: 14.8156, lng: 120.2689, radius: 1.2 },
  { name: "East Bajac-Bajac", city: "Olongapo City", lat: 14.8347, lng: 120.2892, radius: 1.0 },
  { name: "West Bajac-Bajac", city: "Olongapo City", lat: 14.8289, lng: 120.2756, radius: 1.0 },
  { name: "East Tapinac", city: "Olongapo City", lat: 14.8423, lng: 120.2945, radius: 1.0 },
  { name: "West Tapinac", city: "Olongapo City", lat: 14.8378, lng: 120.2834, radius: 1.0 },
  { name: "Barretto", city: "Olongapo City", lat: 14.7989, lng: 120.2567, radius: 2.0 },
  { name: "New Cabalan", city: "Olongapo City", lat: 14.8512, lng: 120.2978, radius: 0.8 },
  { name: "Old Cabalan", city: "Olongapo City", lat: 14.8512, lng: 120.3045, radius: 1.0 },
  { name: "Pag-asa", city: "Olongapo City", lat: 14.8534, lng: 120.3012, radius: 1.2 },
  { name: "Kalaklan", city: "Olongapo City", lat: 14.8623, lng: 120.3089, radius: 0.8 },
  { name: "Mabayuan", city: "Olongapo City", lat: 14.8712, lng: 120.3156, radius: 2.0 },
  { name: "New Kalalake", city: "Olongapo City", lat: 14.8401, lng: 120.2912, radius: 1.0 },
  { name: "Old Kalalake", city: "Olongapo City", lat: 14.8367, lng: 120.2867, radius: 0.8 },
  { name: "New Ilalim", city: "Olongapo City", lat: 14.8334, lng: 120.2823, radius: 0.8 },
  { name: "Old Ilalim", city: "Olongapo City", lat: 14.8301, lng: 120.2789, radius: 0.8 },
  { name: "Asinan Poblacion", city: "Olongapo City", lat: 14.8234, lng: 120.2712, radius: 0.8 },
]

// --- Cache to prevent redundant API calls ---
const geocodingCache = new Map<string, string>()

// --- Distance Calculation (Haversine formula) ---
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

// --- Local Fallback Barangay Matching ---
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

  return closestBarangay ? `${closestBarangay.name}, ${closestBarangay.city}` : "Unknown Barangay"
}

// --- Reverse Geocoding Function ---
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // Prioritize local data for Olongapo coordinates
    if (lat >= 14.7 && lat <= 14.9 && lng >= 120.2 && lng <= 120.4) {
      const localResult = getBarangayFromLocalData(lat, lng)
      if (localResult !== "Unknown Barangay") return localResult
    }

    // Fetch from Nominatim if not found locally
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "OlongapoEvacuation/1.0" }, signal: controller.signal }
    )

    clearTimeout(timeout)

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json()
    const addr = data.address || {}

    const barangay =
      addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || addr.quarter
    const city = addr.city || addr.town || addr.municipality

    if (barangay && city) return `${barangay}, ${city}`
    if (barangay) return barangay
    if (city) return city

    return getBarangayFromLocalData(lat, lng)
  } catch {
    return getBarangayFromLocalData(lat, lng)
  }
}

// --- Public Function: Get Barangay from Coordinates ---
export async function getBarangayFromCoordinates(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
  if (geocodingCache.has(cacheKey)) return geocodingCache.get(cacheKey)!
  const barangay = await reverseGeocode(lat, lng)
  geocodingCache.set(cacheKey, barangay)
  return barangay
}

// --- Barangay Name Formatter ---
export function formatBarangay(barangay: string | undefined | null): string {
  if (!barangay || barangay === "Unknown Barangay") return "Unknown Barangay"

  return barangay
    .split(",")
    .map((part) =>
      part
        .trim()
        .split(" ")
        .map(
          (word) =>
            ({
              sta: "Sta",
              sto: "Sto",
              san: "San",
              santa: "Santa",
              santo: "Santo",
            }[word.toLowerCase()] ||
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        )
        .join(" ")
    )
    .join(", ")
}
