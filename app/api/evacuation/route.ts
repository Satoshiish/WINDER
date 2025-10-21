import { type NextRequest, NextResponse } from "next/server"
import { getEvacuationDataForLocation, getAvailableCities } from "@/lib/evacuation-db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const action = searchParams.get("action")

    // Get available cities
    if (action === "cities") {
      const cities = await getAvailableCities()
      return NextResponse.json({ success: true, cities })
    }

    // Get evacuation data for a specific location
    if (lat && lng) {
      const latitude = Number.parseFloat(lat)
      const longitude = Number.parseFloat(lng)

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json({ success: false, error: "Invalid coordinates" }, { status: 400 })
      }

      const evacuationData = await getEvacuationDataForLocation(latitude, longitude)
      return NextResponse.json({ success: true, data: evacuationData })
    }

    return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
  } catch (error) {
    console.error("Error in evacuation API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
