import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function POST(request: Request) {
  try {
    const report = await request.json()

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
          location_lat: report.location.lat.toString(), // Convert to string to preserve precision
          location_lng: report.location.lng.toString(), // Convert to string to preserve precision
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

    return NextResponse.json({ success: true, id: data[0].id.toString() })
  } catch (error) {
    console.error("Error saving emergency report:", error)
    return NextResponse.json({ success: false, error: "Failed to save emergency report" }, { status: 500 })
  }
}
