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

const olongapoData: LocationEvacuationData = {
  city: "Olongapo City",
  floodZones: [
    {
      id: "olongapo-1",
      name: "Barretto",
      riskLevel: "high",
      area: "2.1 km²",
      affectedPopulation: 21794,
      coordinates: [14.7989, 120.2567],
    },
    {
      id: "olongapo-2",
      name: "Barreto",
      riskLevel: "high",
      area: "1.8 km²",
      affectedPopulation: 14703,
      coordinates: [14.8623, 120.3089],
    },
    {
      id: "olongapo-17",
      name: "West Tapinac",
      riskLevel: "low",
      area: "1.8 km²",
      affectedPopulation: 7179,
      coordinates: [14.8567, 120.2834],
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
      id: "olongapo-ec-6",
      name: "Kalaklan Community Center",
      capacity: 1200,
      currentOccupancy: 300,
      coordinates: [14.8623, 120.3089],
      address: "Kalaklan Barangay",
    },
  ],
  safeRoutes: [
    {
      id: "olongapo-route-1",
      name: "Barreto To Sports Complex",
      from: "Barreto",
      to: "Olongapo Sports Complex",
      distance: 2.1,
      estimatedTime: 10,
      hazards: ["Flooded Streets", "Traffic Congestion"],
    },
    {
      id: "olongapo-route-17b",
      name: "New Kababae To High School",
      from: "New Kababae",
      to: "Olongapo City High School",
      distance: 1.6,
      estimatedTime: 8,
      hazards: ["Flooded Streets"],
    },
  ],
}

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

const evacuationDataMap: Record<string, LocationEvacuationData> = {
  "Olongapo City": olongapoData,
  Manila: manilaData,
  "Cebu City": cebuData,
}

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

export function getEvacuationDataForLocation(lat: number, lng: number): LocationEvacuationData {
  const closestCity = findClosestCity(lat, lng)
  return evacuationDataMap[closestCity] || olongapoData
}

export function getAvailableCities(): string[] {
  return Object.keys(evacuationDataMap)
}
