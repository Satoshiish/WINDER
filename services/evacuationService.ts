import { supabase } from "./supabaseClient"

export interface LocationEvacuationData {
  city: string
  floodZones: Array<{
    id: string
    name: string
    riskLevel: "high" | "medium" | "low"
    area: string
    affectedPopulation: number
    coordinates: [number, number]
    mapImage?: string
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
    routeMapImage?: string
  }>
}

export async function getEvacuationDataForLocation(lat: number, lng: number): Promise<LocationEvacuationData> {
  try {
    const city = "Olongapo City"

    console.log("[v0] Fetching evacuation data for city:", city, "at coordinates:", lat, lng)

    const { data: floodZonesData, error: floodError } = await supabase
      .from("flood_zones")
      .select("*")
      .eq("city", city)
      .order("name", { ascending: true })

    console.log("[v0] Flood zones query result:", { count: floodZonesData?.length || 0, error: floodError })
    if (floodZonesData && floodZonesData.length > 0) {
      console.log("[v0] Sample flood zone data:", {
        id: floodZonesData[0].id,
        name: floodZonesData[0].name,
        hasImageColumn: "evacuation_route_image" in floodZonesData[0],
        imageValue: floodZonesData[0].evacuation_route_image,
        hasFloodMapColumn: "flood_zone_map" in floodZonesData[0],
        floodMapValue: floodZonesData[0].flood_zone_map,
      })
    }

    if (floodError) {
      console.error("[v0] Error fetching flood zones:", floodError)
      return getDefaultEvacuationData(city)
    }

    const { data: centersData, error: centersError } = await supabase
      .from("evacuation_centers")
      .select("*")
      .eq("city", city)

    console.log("[v0] Evacuation centers query result:", { count: centersData?.length || 0, error: centersError })

    if (centersError) {
      console.error("[v0] Error fetching evacuation centers:", centersError)
      return getDefaultEvacuationData(city)
    }

    const { data: routesData, error: routesError } = await supabase.from("safe_routes").select("*").eq("city", city)

    console.log("[v0] Safe routes query result:", { count: routesData?.length || 0, error: routesError })
    if (routesData && routesData.length > 0) {
      console.log("[v0] Sample route data:", {
        id: routesData[0].id,
        name: routesData[0].name,
        from: routesData[0].from_location,
        to: routesData[0].to_location,
        hasImageColumn: "route_map_image" in routesData[0],
        imageValue: routesData[0].route_map_image,
      })
    }

    if (routesError) {
      console.error("[v0] Error fetching safe routes:", routesError)
      return getDefaultEvacuationData(city)
    }

    const floodZones = (floodZonesData || []).map((zone: any) => ({
      id: zone.id,
      name: zone.name,
      riskLevel: zone.risk_level,
      area: zone.area,
      affectedPopulation: zone.affected_population,
      coordinates: [zone.latitude, zone.longitude] as [number, number],
      mapImage: zone.flood_zone_map || zone.evacuation_route_image || "/placeholder.svg",
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
      routeMapImage: route.route_map_image || "/placeholder.svg",
    }))

    console.log("[v0] Mapped evacuation data:", {
      city,
      floodZonesCount: floodZones.length,
      centersCount: evacuationCenters.length,
      routesCount: safeRoutes.length,
    })

    return {
      city,
      floodZones,
      evacuationCenters,
      safeRoutes,
    }
  } catch (error) {
    console.error("[v0] Error fetching evacuation data:", error)
    return getDefaultEvacuationData("Olongapo City")
  }
}

function getDefaultEvacuationData(city: string): LocationEvacuationData {
  console.log("[v0] Returning default (empty) evacuation data for city:", city)
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
