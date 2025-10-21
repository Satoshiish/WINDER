import { supabase } from "./supabase-client"

export interface LocationEvacuationData {
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

export async function getEvacuationDataForLocation(lat: number, lng: number): Promise<LocationEvacuationData> {
  try {
    // Find the closest city based on coordinates
    const closestCity = await findClosestCity(lat, lng)

    // Fetch flood zones for the city
    const { data: floodZonesData, error: floodError } = await supabase
      .from("flood_zones")
      .select("*")
      .eq("city", closestCity)

    if (floodError) {
      console.error("Error fetching flood zones:", floodError)
      return getDefaultEvacuationData(closestCity)
    }

    // Fetch evacuation centers for the city
    const { data: centersData, error: centersError } = await supabase
      .from("evacuation_centers")
      .select("*")
      .eq("city", closestCity)

    if (centersError) {
      console.error("Error fetching evacuation centers:", centersError)
      return getDefaultEvacuationData(closestCity)
    }

    // Fetch safe routes for the city
    const { data: routesData, error: routesError } = await supabase
      .from("safe_routes")
      .select("*")
      .eq("city", closestCity)

    if (routesError) {
      console.error("Error fetching safe routes:", routesError)
      return getDefaultEvacuationData(closestCity)
    }

    // Transform the data to match the expected format
    const floodZones = (floodZonesData || []).map((zone: any) => ({
      id: zone.id,
      name: zone.name,
      riskLevel: zone.risk_level,
      area: zone.area,
      affectedPopulation: zone.affected_population,
      coordinates: [zone.latitude, zone.longitude] as [number, number],
    }))

    const evacuationCenters = (centersData || []).map((center: any) => ({
      id: center.id,
      name: center.name,
      capacity: center.capacity,
      currentOccupancy: center.current_occupancy,
      coordinates: [center.latitude, center.longitude] as [number, number],
      address: center.address,
    }))

    const safeRoutes = (routesData || []).map((route: any) => ({
      id: route.id,
      name: route.name,
      from: route.from_location,
      to: route.to_location,
      distance: route.distance,
      estimatedTime: route.estimated_time,
      hazards: route.hazards || [],
    }))

    return {
      city: closestCity,
      floodZones,
      evacuationCenters,
      safeRoutes,
    }
  } catch (error) {
    console.error("Error fetching evacuation data:", error)
    return getDefaultEvacuationData("Unknown")
  }
}

async function findClosestCity(lat: number, lng: number): Promise<string> {
  try {
    const { data: cities, error } = await supabase.from("cities").select("name, latitude, longitude")

    if (error || !cities || cities.length === 0) {
      console.error("Error fetching cities:", error)
      return "Olongapo City" // Default fallback
    }

    let closestCity = cities[0].name
    let minDistance = Number.POSITIVE_INFINITY

    for (const city of cities) {
      const distance = Math.sqrt(Math.pow(lat - city.latitude, 2) + Math.pow(lng - city.longitude, 2))
      if (distance < minDistance) {
        minDistance = distance
        closestCity = city.name
      }
    }

    return closestCity
  } catch (error) {
    console.error("Error finding closest city:", error)
    return "Olongapo City" // Default fallback
  }
}

export async function getAvailableCities(): Promise<string[]> {
  try {
    const { data: cities, error } = await supabase.from("cities").select("name").order("name")

    if (error) {
      console.error("Error fetching cities:", error)
      return ["Olongapo City", "Manila", "Cebu City"]
    }

    return cities?.map((city: any) => city.name) || ["Olongapo City", "Manila", "Cebu City"]
  } catch (error) {
    console.error("Error fetching cities:", error)
    return ["Olongapo City", "Manila", "Cebu City"]
  }
}

function getDefaultEvacuationData(city: string): LocationEvacuationData {
  return {
    city,
    floodZones: [],
    evacuationCenters: [],
    safeRoutes: [],
  }
}

export async function updateEvacuationCenterOccupancy(centerId: string, currentOccupancy: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("evacuation_centers")
      .update({ current_occupancy: currentOccupancy, updated_at: new Date().toISOString() })
      .eq("id", centerId)

    if (error) {
      console.error("Error updating evacuation center occupancy:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating evacuation center occupancy:", error)
    return false
  }
}

export async function updateFloodZoneRiskLevel(zoneId: string, riskLevel: "high" | "medium" | "low"): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("flood_zones")
      .update({ risk_level: riskLevel, updated_at: new Date().toISOString() })
      .eq("id", zoneId)

    if (error) {
      console.error("Error updating flood zone risk level:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating flood zone risk level:", error)
    return false
  }
}

export async function updateSafeRouteStatus(
  routeId: string,
  status: "clear" | "congested" | "blocked",
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("safe_routes")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", routeId)

    if (error) {
      console.error("Error updating safe route status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating safe route status:", error)
    return false
  }
}
