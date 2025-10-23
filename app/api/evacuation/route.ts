// app/api/evacuation/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getEvacuationDataForLocation, getAvailableCities } from "@/lib/evacuation-db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const latParam = searchParams.get("lat")
    const lngParam = searchParams.get("lng")
    const action = searchParams.get("action")?.toLowerCase()

    // action=cities -> only list of city names
    if (action === "cities") {
      const cities = await getAvailableCities()
      return NextResponse.json({ success: true, cities })
    }

    // action=all -> return all cities' data
    if (action === "all") {
      // If you want all data from DB, implement a new function in evacuation-db to fetch all rows.
      // For now, we'll return available cities list (safe fallback) and instruct client to request per city.
      // If you prefer server-side gather all data, add getAllEvacuationData() in lib/evacuation-db and call it here.
      return NextResponse.json({
        success: true,
        message:
          "Use ?action=cities to get list of cities. For full datasets per city call /api/evacuation?city=CityName or provide lat/lng.",
      })
    }

    // allow requesting by city name explicitly (useful for admin/console)
    const cityParam = searchParams.get("city")
    if (cityParam) {
      // Reuse existing getEvacuationDataForLocation by finding city's coords first would be extra.
      // If you want direct city lookup, add getEvacuationDataForCity(cityName) in evacuation-db.
      return NextResponse.json({
        success: false,
        error:
          "Direct city lookup not implemented on this endpoint. Use lat/lng or add getEvacuationDataForCity in lib/evacuation-db.",
      }, { status: 400 })
    }

    // lat & lng -> nearest city data
    if (latParam != null && lngParam != null) {
      const lat = Number.parseFloat(latParam)
      const lng = Number.parseFloat(lngParam)

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return NextResponse.json({ success: false, error: "Invalid coordinates" }, { status: 400 })
      }

      const evacuationData = await getEvacuationDataForLocation(lat, lng)
      // Defensive: ensure structure always present
      const safeData = {
        city: evacuationData?.city || "Unknown",
        floodZones: evacuationData?.floodZones || [],
        evacuationCenters: evacuationData?.evacuationCenters || [],
        safeRoutes: evacuationData?.safeRoutes || [],
      }
      // helpful log for debugging
      console.log(`[evacuation] returning data for coords ${lat},${lng} -> city ${safeData.city}`)
      return NextResponse.json({ success: true, data: safeData })
    }

    return NextResponse.json({ success: false, error: "Missing required parameters (lat & lng or action)" }, { status: 400 })
  } catch (error) {
    console.error("Error in evacuation API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
