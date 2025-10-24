// Provides a list of all barangays in Olongapo City with search functionality

export interface OlongapoLocation {
  name: string
  city: string
  lat: number
  lng: number
}

// All barangays in Olongapo City with their coordinates
export const OLONGAPO_LOCATIONS: OlongapoLocation[] = [
  { name: "Sta Rita", city: "Olongapo City", lat: 14.853, lng: 120.2982 },
  { name: "Gordon Heights", city: "Olongapo City", lat: 14.8156, lng: 120.2689 },
  { name: "East Bajac-Bajac", city: "Olongapo City", lat: 14.8347, lng: 120.2892 },
  { name: "West Bajac-Bajac", city: "Olongapo City", lat: 14.8289, lng: 120.2756 },
  { name: "East Tapinac", city: "Olongapo City", lat: 14.8423, lng: 120.2945 },
  { name: "West Tapinac", city: "Olongapo City", lat: 14.8378, lng: 120.2834 },
  { name: "Barretto", city: "Olongapo City", lat: 14.7989, lng: 120.2567 },
  { name: "New Cabalan", city: "Olongapo City", lat: 14.8512, lng: 120.2978 },
  { name: "Old Cabalan", city: "Olongapo City", lat: 14.8512, lng: 120.3045 },
  { name: "Pag-asa", city: "Olongapo City", lat: 14.8534, lng: 120.3012 },
  { name: "Kalaklan", city: "Olongapo City", lat: 14.8623, lng: 120.3089 },
  { name: "Mabayuan", city: "Olongapo City", lat: 14.8712, lng: 120.3156 },
  { name: "New Kalalake", city: "Olongapo City", lat: 14.8401, lng: 120.2912 },
  { name: "Old Kalalake", city: "Olongapo City", lat: 14.8367, lng: 120.2867 },
  { name: "New Ilalim", city: "Olongapo City", lat: 14.8334, lng: 120.2823 },
  { name: "Old Ilalim", city: "Olongapo City", lat: 14.8301, lng: 120.2789 },
  { name: "Asinan Poblacion", city: "Olongapo City", lat: 14.8234, lng: 120.2712 },
]

/**
 * Search for locations in Olongapo City
 * @param query - Search query (barangay name)
 * @returns Array of matching locations
 */
export function searchLocations(query: string): OlongapoLocation[] {
  if (!query.trim()) return OLONGAPO_LOCATIONS

  const lowerQuery = query.toLowerCase()
  return OLONGAPO_LOCATIONS.filter((location) => location.name.toLowerCase().includes(lowerQuery))
}

/**
 * Get location by name
 * @param name - Barangay name
 * @returns Location object or undefined
 */
export function getLocationByName(name: string): OlongapoLocation | undefined {
  return OLONGAPO_LOCATIONS.find((location) => location.name.toLowerCase() === name.toLowerCase())
}
