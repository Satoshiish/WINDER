// Evacuation data for Philippine cities and municipalities
// Includes flood-prone areas, evacuation centers, and safe routes specific to each location

interface LocationEvacuationData {
  city: string
  floodZones: Array<{
    id: string
    name: string
    riskLevel: "high" | "medium" | "low"
    area: string
    affectedPopulation: number
    coordinates: [number, number]
  }>
  evacuationCenters: Array<{
    id: string
    name: string
    capacity: number
    currentOccupancy: number
    coordinates: [number, number]
    address: string
  }>
  safeRoutes: Array<{
    id: string
    name: string
    from: string
    to: string
    distance: number
    estimatedTime: number
    hazards: string[]
  }>
}

// Olongapo City evacuation data
const olongapoData: LocationEvacuationData = {
  city: "Olongapo City",
  floodZones: [
    {
      id: "olongapo-1",
      name: "Barretto District",
      riskLevel: "high",
      area: "2.1 km²",
      affectedPopulation: 35000,
      coordinates: [14.7989, 120.2567],
    },
    {
      id: "olongapo-2",
      name: "Kalaklan District",
      riskLevel: "high",
      area: "1.8 km²",
      affectedPopulation: 28000,
      coordinates: [14.8623, 120.3089],
    },
    {
      id: "olongapo-3",
      name: "Mabayuan District",
      riskLevel: "medium",
      area: "2.5 km²",
      affectedPopulation: 22000,
      coordinates: [14.8712, 120.3156],
    },
    {
      id: "olongapo-4",
      name: "Gordon Heights",
      riskLevel: "medium",
      area: "1.5 km²",
      affectedPopulation: 18000,
      coordinates: [14.8156, 120.2689],
    },
    {
      id: "olongapo-5",
      name: "Sta Rita District",
      riskLevel: "low",
      area: "1.2 km²",
      affectedPopulation: 12000,
      coordinates: [14.8436, 120.3089],
    },
  ],
  evacuationCenters: [
    {
      id: "olongapo-ec-1",
      name: "Olongapo Sports Complex",
      capacity: 3000,
      currentOccupancy: 1200,
      coordinates: [14.8234, 120.2912],
      address: "Magsaysay Avenue, Olongapo City",
    },
    {
      id: "olongapo-ec-2",
      name: "Olongapo City High School",
      capacity: 2000,
      currentOccupancy: 800,
      coordinates: [14.8367, 120.2867],
      address: "Rizal Avenue, Olongapo City",
    },
    {
      id: "olongapo-ec-3",
      name: "Subic Bay Convention Center",
      capacity: 2500,
      currentOccupancy: 600,
      coordinates: [14.7856, 120.2345],
      address: "Subic Bay Freeport Zone",
    },
  ],
  safeRoutes: [
    {
      id: "olongapo-route-1",
      name: "Barretto to Sports Complex",
      from: "Barretto District",
      to: "Olongapo Sports Complex",
      distance: 2.1,
      estimatedTime: 10,
      hazards: ["Flooded streets", "Traffic congestion"],
    },
    {
      id: "olongapo-route-2",
      name: "Kalaklan to High School",
      from: "Kalaklan District",
      to: "Olongapo City High School",
      distance: 1.8,
      estimatedTime: 8,
      hazards: ["Water level rising"],
    },
    {
      id: "olongapo-route-3",
      name: "Mabayuan to Subic Convention",
      from: "Mabayuan District",
      to: "Subic Bay Convention Center",
      distance: 3.2,
      estimatedTime: 15,
      hazards: ["Minor flooding", "Debris"],
    },
  ],
}

// Manila evacuation data
const manilaData: LocationEvacuationData = {
  city: "Manila",
  floodZones: [
    {
      id: "manila-1",
      name: "Binondo District",
      riskLevel: "high",
      area: "2.5 km²",
      affectedPopulation: 45000,
      coordinates: [14.5967, 120.9789],
    },
    {
      id: "manila-2",
      name: "Tondo District",
      riskLevel: "high",
      area: "3.2 km²",
      affectedPopulation: 62000,
      coordinates: [14.6167, 120.9667],
    },
    {
      id: "manila-3",
      name: "Quiapo District",
      riskLevel: "medium",
      area: "1.8 km²",
      affectedPopulation: 28000,
      coordinates: [14.5995, 120.9842],
    },
    {
      id: "manila-4",
      name: "Ermita District",
      riskLevel: "medium",
      area: "1.5 km²",
      affectedPopulation: 18000,
      coordinates: [14.5764, 121.0051],
    },
    {
      id: "manila-5",
      name: "Malate District",
      riskLevel: "low",
      area: "2.1 km²",
      affectedPopulation: 12000,
      coordinates: [14.5647, 121.0223],
    },
  ],
  evacuationCenters: [
    {
      id: "manila-ec-1",
      name: "Rizal Memorial Sports Complex",
      capacity: 5000,
      currentOccupancy: 2300,
      coordinates: [14.5647, 121.0223],
      address: "Pablo Ocampo Sr. Street, Malate",
    },
    {
      id: "manila-ec-2",
      name: "Luneta Park Evacuation Center",
      capacity: 3000,
      currentOccupancy: 1200,
      coordinates: [14.5764, 121.0051],
      address: "Rizal Park, Ermita",
    },
    {
      id: "manila-ec-3",
      name: "Intramuros Convention Center",
      capacity: 2000,
      currentOccupancy: 800,
      coordinates: [14.5833, 120.9667],
      address: "General Luna Street, Intramuros",
    },
  ],
  safeRoutes: [
    {
      id: "manila-route-1",
      name: "Binondo to Rizal Park Route",
      from: "Binondo District",
      to: "Rizal Memorial Park",
      distance: 3.2,
      estimatedTime: 15,
      hazards: ["Flooded streets", "Traffic congestion"],
    },
    {
      id: "manila-route-2",
      name: "Tondo to Luneta Route",
      from: "Tondo District",
      to: "Luneta Park",
      distance: 4.1,
      estimatedTime: 20,
      hazards: ["Water level rising"],
    },
    {
      id: "manila-route-3",
      name: "Quiapo to Intramuros Route",
      from: "Quiapo District",
      to: "Intramuros",
      distance: 2.8,
      estimatedTime: 12,
      hazards: ["Minor flooding"],
    },
  ],
}

// Cebu City evacuation data
const cebuData: LocationEvacuationData = {
  city: "Cebu City",
  floodZones: [
    {
      id: "cebu-1",
      name: "Pardo District",
      riskLevel: "high",
      area: "2.2 km²",
      affectedPopulation: 38000,
      coordinates: [10.2845, 123.8756],
    },
    {
      id: "cebu-2",
      name: "Mabolo District",
      riskLevel: "high",
      area: "1.9 km²",
      affectedPopulation: 32000,
      coordinates: [10.2934, 123.8845],
    },
    {
      id: "cebu-3",
      name: "Lahug District",
      riskLevel: "medium",
      area: "1.6 km²",
      affectedPopulation: 24000,
      coordinates: [10.3012, 123.8923],
    },
  ],
  evacuationCenters: [
    {
      id: "cebu-ec-1",
      name: "Cebu City Sports Complex",
      capacity: 4000,
      currentOccupancy: 1800,
      coordinates: [10.3157, 123.8854],
      address: "Osmeña Boulevard, Cebu City",
    },
    {
      id: "cebu-ec-2",
      name: "Cebu Coliseum",
      capacity: 3000,
      currentOccupancy: 1200,
      coordinates: [10.3234, 123.8923],
      address: "Plaridel Street, Cebu City",
    },
  ],
  safeRoutes: [
    {
      id: "cebu-route-1",
      name: "Pardo to Sports Complex",
      from: "Pardo District",
      to: "Cebu City Sports Complex",
      distance: 2.5,
      estimatedTime: 12,
      hazards: ["Flooded streets"],
    },
  ],
}

// Map of cities to their evacuation data
const evacuationDataMap: Record<string, LocationEvacuationData> = {
  "Olongapo City": olongapoData,
  Manila: manilaData,
  "Cebu City": cebuData,
}

// Function to find the closest city based on coordinates
function findClosestCity(lat: number, lng: number): string {
  const cities = [
    { name: "Olongapo City", lat: 14.8436, lng: 120.3089 },
    { name: "Manila", lat: 14.5995, lng: 120.9842 },
    { name: "Cebu City", lat: 10.3157, lng: 123.8854 },
  ]

  let closestCity = cities[0].name
  let minDistance = Number.POSITIVE_INFINITY

  for (const city of cities) {
    const distance = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2))
    if (distance < minDistance) {
      minDistance = distance
      closestCity = city.name
    }
  }

  return closestCity
}

// Get evacuation data for a specific location
export function getEvacuationDataForLocation(lat: number, lng: number): LocationEvacuationData {
  const closestCity = findClosestCity(lat, lng)
  return evacuationDataMap[closestCity] || olongapoData
}

// Get all available cities
export function getAvailableCities(): string[] {
  return Object.keys(evacuationDataMap)
}
