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

// Olongapo City evacuation data - EXPANDED with all 17 barangays
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
      id: "olongapo-3",
      name: "East Tapinac",
      riskLevel: "low",
      area: "3.2 km²",
      affectedPopulation: 9952,
      coordinates: [14.7856, 120.2345],
    },
    {
      id: "olongapo-4",
      name: "Gordon Heights",
      riskLevel: "medium",
      area: "1.5 km²",
      affectedPopulation: 30729,
      coordinates: [14.8156, 120.2689],
    },
    {
      id: "olongapo-5",
      name: "Kalaklan",
      riskLevel: "high",
      area: "1.8 km²",
      affectedPopulation: 14703,
      coordinates: [14.8623, 120.3089],
    },
    {
      id: "olongapo-6",
      name: "Mabayuan",
      riskLevel: "high",
      area: "2.5 km²",
      affectedPopulation: 12436,
      coordinates: [14.8712, 120.3156],
    },
    {
      id: "olongapo-7",
      name: "New Asinan",
      riskLevel: "medium",
      area: "2.2 km²",
      affectedPopulation: 3485,
      coordinates: [14.8456, 120.3012],
    },
    {
      id: "olongapo-8",
      name: "New Cabalan",
      riskLevel: "medium",
      area: "1.7 km²",
      affectedPopulation: 33349,
      coordinates: [14.8567, 120.3234],
    },
    {
      id: "olongapo-9",
      name: "New Kalalake",
      riskLevel: "high",
      area: "1.6 km²",
      affectedPopulation: 10296,
      coordinates: [14.8234, 120.2756],
    },
    {
      id: "olongapo-10",
      name: "Nicodemus",
      riskLevel: "medium",
      area: "1.3 km²",
      affectedPopulation: 7563,
      coordinates: [14.8345, 120.2945],
    },
    {
      id: "olongapo-11",
      name: "Olongapo City Proper",
      riskLevel: "high",
      area: "2.8 km²",
      affectedPopulation: 6593,
      coordinates: [14.7945, 120.2456],
    },
    {
      id: "olongapo-12",
      name: "Potalan",
      riskLevel: "medium",
      area: "1.5 km²",
      affectedPopulation: 1561,
      coordinates: [14.8234, 120.2912],
    },
    {
      id: "olongapo-13",
      name: "Santa Rita",
      riskLevel: "high",
      area: "1.2 km²",
      affectedPopulation: 47034,
      coordinates: [14.8436, 120.3089],
    },
    {
      id: "olongapo-14",
      name: "San Isidro",
      riskLevel: "low",
      area: "1.8 km²",
      affectedPopulation: 7179,
      coordinates: [14.8567, 120.2834],
    },
    {
      id: "olongapo-15",
      name: "San Jose",
      riskLevel: "medium",
      area: "1.4 km²",
      affectedPopulation: 23401,
      coordinates: [14.8789, 120.3345],
    },
    {
      id: "olongapo-16",
      name: "West Bajac-Bajac",
      riskLevel: "medium",
      area: "2.0 km²",
      affectedPopulation: 8433,
      coordinates: [14.8145, 120.2834],
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
    {
      id: "olongapo-ec-4",
      name: "Olongapo City Gymnasium",
      capacity: 1500,
      currentOccupancy: 400,
      coordinates: [14.8456, 120.2945],
      address: "Magsaysay Avenue Extension",
    },
    {
      id: "olongapo-ec-5",
      name: "Subic National High School",
      capacity: 1800,
      currentOccupancy: 500,
      coordinates: [14.7945, 120.2456],
      address: "Subic Bay Freeport Zone",
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
      id: "olongapo-route-1b",
      name: "Barreto To Subic Convention",
      from: "Barreto",
      to: "Subic Bay Convention Center",
      distance: 3.5,
      estimatedTime: 18,
      hazards: ["Water Level Rising", "Debris"],
    },
    {
      id: "olongapo-route-1c",
      name: "Barreto To City Gymnasium",
      from: "Barreto",
      to: "Olongapo City Gymnasium",
      distance: 1.8,
      estimatedTime: 9,
      hazards: ["Flooded Streets"],
    },
    {
      id: "olongapo-route-2",
      name: "Kalaklan To High School",
      from: "Kalaklan",
      to: "Olongapo City High School",
      distance: 1.8,
      estimatedTime: 8,
      hazards: ["Water Level Rising"],
    },
    {
      id: "olongapo-route-2b",
      name: "Kalaklan To Community Center",
      from: "Kalaklan",
      to: "Kalaklan Community Center",
      distance: 0.5,
      estimatedTime: 3,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-2c",
      name: "Kalaklan To Sports Complex",
      from: "Kalaklan",
      to: "Olongapo Sports Complex",
      distance: 2.3,
      estimatedTime: 11,
      hazards: ["Flooded Streets", "Traffic Congestion"],
    },
    {
      id: "olongapo-route-3",
      name: "Mabayuan To Subic Convention",
      from: "Mabayuan",
      to: "Subic Bay Convention Center",
      distance: 3.2,
      estimatedTime: 15,
      hazards: ["Minor Flooding", "Debris", "Landslide Risk"],
    },
    {
      id: "olongapo-route-3b",
      name: "Mabayuan To High School",
      from: "Mabayuan",
      to: "Olongapo City High School",
      distance: 2.1,
      estimatedTime: 10,
      hazards: ["Flooded Streets"],
    },
    {
      id: "olongapo-route-3c",
      name: "Mabayuan To Sports Complex",
      from: "Mabayuan",
      to: "Olongapo Sports Complex",
      distance: 2.8,
      estimatedTime: 13,
      hazards: ["Water Level Rising", "Traffic Congestion"],
    },
    {
      id: "olongapo-route-4",
      name: "Gordon Heights To Sports Complex",
      from: "Gordon Heights",
      to: "Olongapo Sports Complex",
      distance: 1.5,
      estimatedTime: 7,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-4b",
      name: "Gordon Heights To Gymnasium",
      from: "Gordon Heights",
      to: "Olongapo City Gymnasium",
      distance: 1.2,
      estimatedTime: 6,
      hazards: ["Flooded Streets"],
    },
    {
      id: "olongapo-route-4c",
      name: "Gordon Heights To High School",
      from: "Gordon Heights",
      to: "Olongapo City High School",
      distance: 2.0,
      estimatedTime: 9,
      hazards: ["Water Level Rising"],
    },
    {
      id: "olongapo-route-5",
      name: "Santa Rita To Sports Complex",
      from: "Santa Rita",
      to: "Olongapo Sports Complex",
      distance: 1.3,
      estimatedTime: 6,
      hazards: ["Severe Flooding", "Water Level Rising"],
    },
    {
      id: "olongapo-route-5b",
      name: "Santa Rita To High School",
      from: "Santa Rita",
      to: "Olongapo City High School",
      distance: 0.9,
      estimatedTime: 4,
      hazards: ["Flooded Streets"],
    },
    {
      id: "olongapo-route-5c",
      name: "Santa Rita To Gymnasium",
      from: "Santa Rita",
      to: "Olongapo City Gymnasium",
      distance: 1.6,
      estimatedTime: 8,
      hazards: ["Severe Flooding", "Debris"],
    },
    {
      id: "olongapo-route-6",
      name: "East Bajac-Bajac To Sports Complex",
      from: "East Bajac-Bajac",
      to: "Olongapo Sports Complex",
      distance: 1.2,
      estimatedTime: 6,
      hazards: ["Flooded Streets", "Traffic Congestion"],
    },
    {
      id: "olongapo-route-6b",
      name: "East Bajac-Bajac To Gymnasium",
      from: "East Bajac-Bajac",
      to: "Olongapo City Gymnasium",
      distance: 0.8,
      estimatedTime: 4,
      hazards: ["Water Level Rising"],
    },
    {
      id: "olongapo-route-6c",
      name: "East Bajac-Bajac To High School",
      from: "East Bajac-Bajac",
      to: "Olongapo City High School",
      distance: 1.5,
      estimatedTime: 7,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-7",
      name: "West Bajac-Bajac To Sports Complex",
      from: "West Bajac-Bajac",
      to: "Olongapo Sports Complex",
      distance: 1.4,
      estimatedTime: 7,
      hazards: ["Flooded Streets"],
    },
    {
      id: "olongapo-route-7b",
      name: "West Bajac-Bajac To Gymnasium",
      from: "West Bajac-Bajac",
      to: "Olongapo City Gymnasium",
      distance: 1.1,
      estimatedTime: 5,
      hazards: ["Water Level Rising", "Debris"],
    },
    {
      id: "olongapo-route-7c",
      name: "West Bajac-Bajac To Subic Convention",
      from: "West Bajac-Bajac",
      to: "Subic Bay Convention Center",
      distance: 2.8,
      estimatedTime: 14,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-8",
      name: "New Cabalan To High School",
      from: "New Cabalan",
      to: "Olongapo City High School",
      distance: 1.6,
      estimatedTime: 8,
      hazards: ["Flooded Streets", "Water Level Rising"],
    },
    {
      id: "olongapo-route-8b",
      name: "New Cabalan To Sports Complex",
      from: "New Cabalan",
      to: "Olongapo Sports Complex",
      distance: 2.2,
      estimatedTime: 11,
      hazards: ["Traffic Congestion"],
    },
    {
      id: "olongapo-route-8c",
      name: "New Cabalan To Community Center",
      from: "New Cabalan",
      to: "Kalaklan Community Center",
      distance: 1.3,
      estimatedTime: 6,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-9",
      name: "Old Cabalan To High School",
      from: "Old Cabalan",
      to: "Olongapo City High School",
      distance: 1.9,
      estimatedTime: 9,
      hazards: ["Flooded Streets"],
    },
    {
      id: "olongapo-route-9b",
      name: "Old Cabalan To Community Center",
      from: "Old Cabalan",
      to: "Kalaklan Community Center",
      distance: 1.1,
      estimatedTime: 5,
      hazards: ["Water Level Rising"],
    },
    {
      id: "olongapo-route-9c",
      name: "Old Cabalan To Sports Complex",
      from: "Old Cabalan",
      to: "Olongapo Sports Complex",
      distance: 2.5,
      estimatedTime: 12,
      hazards: ["Minor Flooding", "Debris"],
    },
    {
      id: "olongapo-route-10",
      name: "East Tapinac To High School",
      from: "East Tapinac",
      to: "Olongapo City High School",
      distance: 1.4,
      estimatedTime: 7,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-10b",
      name: "East Tapinac To Sports Complex",
      from: "East Tapinac",
      to: "Olongapo Sports Complex",
      distance: 2.1,
      estimatedTime: 10,
      hazards: ["Flooded Streets"],
    },
    {
      id: "olongapo-route-11",
      name: "New Kalalake To Sports Complex",
      from: "New Kalalake",
      to: "Olongapo Sports Complex",
      distance: 1.1,
      estimatedTime: 5,
      hazards: ["Flooded Streets", "Traffic Congestion"],
    },
    {
      id: "olongapo-route-11b",
      name: "New Kalalake To Gymnasium",
      from: "New Kalalake",
      to: "Olongapo City Gymnasium",
      distance: 0.9,
      estimatedTime: 4,
      hazards: ["Water Level Rising"],
    },
    {
      id: "olongapo-route-11c",
      name: "New Kalalake To High School",
      from: "New Kalalake",
      to: "Olongapo City High School",
      distance: 1.7,
      estimatedTime: 8,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-12",
      name: "Banicain To Sports Complex",
      from: "Banicain",
      to: "Olongapo Sports Complex",
      distance: 1.4,
      estimatedTime: 7,
      hazards: ["Flooded Streets"],
    },
    {
      id: "olongapo-route-12b",
      name: "Banicain To Gymnasium",
      from: "Banicain",
      to: "Olongapo City Gymnasium",
      distance: 1.2,
      estimatedTime: 6,
      hazards: ["Water Level Rising", "Debris"],
    },
    {
      id: "olongapo-route-12c",
      name: "Banicain To High School",
      from: "Banicain",
      to: "Olongapo City High School",
      distance: 1.9,
      estimatedTime: 9,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-13",
      name: "Asinan To High School",
      from: "Asinan",
      to: "Olongapo City High School",
      distance: 2.3,
      estimatedTime: 11,
      hazards: ["Flooded Streets", "Traffic Congestion"],
    },
    {
      id: "olongapo-route-13b",
      name: "Asinan To Sports Complex",
      from: "Asinan",
      to: "Olongapo Sports Complex",
      distance: 2.8,
      estimatedTime: 13,
      hazards: ["Water Level Rising"],
    },
    {
      id: "olongapo-route-13c",
      name: "Asinan To Community Center",
      from: "Asinan",
      to: "Kalaklan Community Center",
      distance: 1.6,
      estimatedTime: 8,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-14",
      name: "West Tapinac To Sports Complex",
      from: "West Tapinac",
      to: "Olongapo Sports Complex",
      distance: 2.1,
      estimatedTime: 10,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-14b",
      name: "West Tapinac To High School",
      from: "West Tapinac",
      to: "Olongapo City High School",
      distance: 1.8,
      estimatedTime: 8,
      hazards: ["Flooded Streets"],
    },
    {
      id: "olongapo-route-15",
      name: "Pag-Asa To Convention Center",
      from: "Pag-Asa",
      to: "Subic Bay Convention Center",
      distance: 1.2,
      estimatedTime: 6,
      hazards: ["Flooded Streets", "Water Level Rising"],
    },
    {
      id: "olongapo-route-15b",
      name: "Pag-Asa To National High School",
      from: "Pag-Asa",
      to: "Subic National High School",
      distance: 0.8,
      estimatedTime: 4,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-15c",
      name: "Pag-Asa To Sports Complex",
      from: "Pag-Asa",
      to: "Olongapo Sports Complex",
      distance: 2.5,
      estimatedTime: 12,
      hazards: ["Debris", "Traffic Congestion"],
    },
    {
      id: "olongapo-route-16",
      name: "New Ilalim To High School",
      from: "New Ilalim",
      to: "Olongapo City High School",
      distance: 1.5,
      estimatedTime: 7,
      hazards: ["Flooded Streets"],
    },
    {
      id: "olongapo-route-16b",
      name: "New Ilalim To Community Center",
      from: "New Ilalim",
      to: "Kalaklan Community Center",
      distance: 0.7,
      estimatedTime: 3,
      hazards: ["Minor Flooding"],
    },
    {
      id: "olongapo-route-17",
      name: "New Kababae To Sports Complex",
      from: "New Kababae",
      to: "Olongapo Sports Complex",
      distance: 1.9,
      estimatedTime: 9,
      hazards: ["Minor Flooding"],
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
