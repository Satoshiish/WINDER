import { NextResponse } from "next/server"
import { supabase } from "@/services/supabaseClient"

export async function POST(request: Request) {
  try {
    const report = await request.json()

    console.log("[v0] Emergency report data received:", JSON.stringify(report, null, 2))

    const latitude = report.location?.lat
    const longitude = report.location?.lng

    // This allows coordinates like 0 to be valid
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      console.log("[v0] Location validation failed - lat:", latitude, "lng:", longitude)
      return NextResponse.json({ success: false, error: "Location coordinates are required" }, { status: 400 })
    }

    console.log("[v0] Location validation passed - lat:", latitude, "lng:", longitude)

    const { data, error } = await supabase
      .from("emergency_reports")
      .insert([
        {
          user_id: report.userId ? Number.parseInt(report.userId) : null,
          user_name: report.userName,
          contact_number: report.contactNumber,
          emergency_type: report.emergencyType,
          priority: report.priority,
          people_count: report.peopleCount,
          address: report.address,
          location_lat: latitude.toString(),
          location_lng: longitude.toString(),
          additional_info: report.additionalInfo,
          status: report.status,
          assigned_to: report.assignedTo,
          response_time: report.responseTime,
          notes: report.notes || [],
          deleted_at: report.deletedAt,
        },
      ])
      .select()

    if (error) {
      console.error("Error saving emergency report:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[v0] Emergency report saved successfully with ID:", data[0].id)
    return NextResponse.json({ success: true, id: data[0].id.toString() })
  } catch (error) {
    console.error("Error saving emergency report:", error)
    return NextResponse.json({ success: false, error: "Failed to save emergency report" }, { status: 500 })
  }
}
