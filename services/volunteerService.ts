import { supabase } from "./supabaseClient"

export interface VolunteerArea {
  id: number
  volunteer_id: number
  barangay: string
  municipality: string
  province: string
  assigned_at: string
  is_active: boolean
}

export interface VolunteerUpdate {
  id: number
  volunteer_id: number
  volunteer_name?: string
  barangay: string
  municipality: string
  province?: string
  update_type: "weather" | "flood" | "evacuation" | "damage" | "safety" | "other"
  severity: "low" | "moderate" | "high" | "critical"
  title: string
  description: string
  latitude?: number
  longitude?: number
  image_url?: string
  status: "active" | "resolved" | "archived"
  created_at: string
  updated_at: string
}

export async function getVolunteerAreas(volunteerId: number): Promise<VolunteerArea[]> {
  try {
    const { data, error } = await supabase
      .from("volunteer_areas")
      .select("*")
      .eq("volunteer_id", volunteerId)
      .eq("is_active", true)
      .order("barangay", { ascending: true })

    if (error) {
      console.error("Error fetching volunteer areas:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching volunteer areas:", error)
    return []
  }
}

export async function getVolunteerUpdates(volunteerId?: number): Promise<VolunteerUpdate[]> {
  try {
    let query = supabase
      .from("volunteer_updates")
      .select(`*
        volunteers!volunteer_id (
          full_name
        )
      `)
      .order("created_at", { ascending: false })

    if (volunteerId) {
      query = query.eq("volunteer_id", volunteerId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching volunteer updates:", error)
      return []
    }

    return (data || []).map((update: any) => ({
      ...update,
      volunteer_name: update.volunteers?.full_name || "Unknown Volunteer",
    }))
  } catch (error) {
    console.error("Error fetching volunteer updates:", error)
    return []
  }
}

export async function createVolunteerUpdate(
  volunteerId: number,
  update: Omit<VolunteerUpdate, "id" | "volunteer_id" | "created_at" | "updated_at" | "status">,
): Promise<{ success: boolean; message: string; data?: VolunteerUpdate }> {
  try {
    // Validate that the volunteer exists and is active before creating an update
    const { data: volunteerData, error: volunteerError } = await supabase
      .from("volunteers")
      .select("id, is_active")
      .eq("id", volunteerId)
      .maybeSingle()

    if (volunteerError) {
      console.error("Error validating volunteer:", volunteerError)
      return { success: false, message: "Failed to validate volunteer" }
    }

    if (!volunteerData || volunteerData.is_active !== true) {
      console.warn("Attempt to create update by non-active or unknown volunteer:", volunteerId)
      return { success: false, message: "Volunteer not found or not active" }
    }

    console.log("[v0] Creating volunteer update:", update)

    const { data, error } = await supabase
      .from("volunteer_updates")
      .insert({
        volunteer_id: volunteerId,
        ...update,
        province: update.province || null,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating volunteer update:", error)
      return { success: false, message: error.message || "Failed to create update" }
    }

    console.log("[v0] Update created successfully:", data)
    return { success: true, message: "Update created successfully", data }
  } catch (error) {
    console.error("[v0] Error creating volunteer update:", error)
    return { success: false, message: "An error occurred" }
  }
}

export async function updateVolunteerUpdateStatus(
  updateId: number,
  status: "active" | "resolved" | "archived",
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("volunteer_updates")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", updateId)

    if (error) {
      console.error("Error updating volunteer update status:", error)
      return { success: false, message: "Failed to update status" }
    }

    return { success: true, message: "Status updated successfully" }
  } catch (error) {
    console.error("Error updating volunteer update status:", error)
    return { success: false, message: "An error occurred" }
  }
}

export async function getVolunteerUpdateStats(volunteerId?: number) {
  try {
    let query = supabase.from("volunteer_updates").select("update_type, severity, status")

    if (volunteerId) {
      query = query.eq("volunteer_id", volunteerId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching volunteer update stats:", error)
      return {
        total: 0,
        active: 0,
        resolved: 0,
        critical: 0,
        high: 0,
        byType: {},
      }
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter((u) => u.status === "active").length || 0,
      resolved: data?.filter((u) => u.status === "resolved").length || 0,
      critical: data?.filter((u) => u.severity === "critical").length || 0,
      high: data?.filter((u) => u.severity === "high").length || 0,
      byType: data?.reduce(
        (acc, u) => {
          acc[u.update_type] = (acc[u.update_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    return stats
  } catch (error) {
    console.error("Error fetching volunteer update stats:", error)
    return {
      total: 0,
      active: 0,
      resolved: 0,
      critical: 0,
      high: 0,
      byType: {},
    }
  }
}
