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

export async function getEvacuationDataForLocation(): Promise<LocationEvacuationData> {
  try {
    // Instead of finding closest city, fetch everything in DB (Olongapo only)
    const city = "Olongapo City"

    // Fetch ALL flood zones
    const { data: floodZonesData, error: floodError } = await supabase
      .from("flood_zones")
      .select("*")
      .eq("city", city)

    if (floodError) {
      console.error("Error fetching flood zones:", floodError)
      return getDefaultEvacuationData(city)
    }

    // Fetch ALL evacuation centers
    const { data: centersData, error: centersError } = await supabase
      .from("evacuation_centers")
      .select("*")
      .eq("city", city)

    if (centersError) {
      console.error("Error fetching evacuation centers:", centersError)
      return getDefaultEvacuationData(city)
    }

    // Fetch ALL safe routes
    const { data: routesData, error: routesError } = await supabase
      .from("safe_routes")
      .select("*")
      .eq("city", city)

    if (routesError) {
      console.error("Error fetching safe routes:", routesError)
      return getDefaultEvacuationData(city)
    }

    // Map DB results into the expected structure
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
      city,
      floodZones,
      evacuationCenters,
      safeRoutes,
    }
  } catch (error) {
    console.error("Error fetching evacuation data:", error)
    return getDefaultEvacuationData("Olongapo City")
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

// Keep these utility functions as-is for updating
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

export async function getAvailableCities(): Promise<string[]> {
  try {
    const { data: cities, error } = await supabase.from("cities").select("name").order("name")

    if (error) {
      console.error("Error fetching cities:", error)
      // Fallback list
      return ["Olongapo City", "Manila", "Cebu City"]
    }

    return cities?.map((city: any) => city.name) || ["Olongapo City", "Manila", "Cebu City"]
  } catch (error) {
    console.error("Error fetching cities:", error)
    return ["Olongapo City", "Manila", "Cebu City"]
  }
}
