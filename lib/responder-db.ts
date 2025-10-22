import { supabase } from "./supabase-client"

export interface Emergency {
  id: number
  user_name: string
  contact_number: string
  emergency_type: string
  priority: string
  people_count: number
  address: string
  location_lat: number
  location_lng: number
  additional_info: string
  status: string
  deployment_status: string
  assigned_team_id: number
  dispatched_at: string | null
  arrived_at: string | null
  resolved_at: string | null
  notes: string | null
  created_at: string
}

export interface ResponseTeam {
  id: number
  team_name: string
  team_type: string
  contact_number: string
  is_active: boolean
}

export async function getAllResponseTeams(): Promise<ResponseTeam[]> {
  const { data, error } = await supabase
    .from("response_teams")
    .select("*")
    .eq("is_active", true)
    .order("team_name", { ascending: true })

  if (error) {
    console.error("Error fetching response teams:", error)
    return []
  }

  return data || []
}

export async function getTeamEmergencies(teamId: number): Promise<Emergency[]> {
  const { data, error } = await supabase
    .from("emergency_reports")
    .select("*")
    .eq("assigned_team_id", teamId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching team emergencies:", error)
    return []
  }

  return data || []
}

export async function getTeamInfo(teamId: number): Promise<ResponseTeam | null> {
  const { data, error } = await supabase.from("response_teams").select("*").eq("id", teamId).single()

  if (error) {
    console.error("Error fetching team info:", error)
    return null
  }

  return data
}

export async function assignTeamToEmergency(emergencyId: string, teamId: string | number): Promise<boolean> {
  try {
    console.log("🔄 [DEBUG] assignTeamToEmergency called:", { emergencyId, teamId })

    // Convert teamId to number if it's a string
    const teamIdNum = typeof teamId === "string" ? Number.parseInt(teamId) : teamId

    const team = await getTeamInfo(teamIdNum)
    const teamName = team?.team_name || `Team ${teamIdNum}`

    const updates: any = {
      assigned_team_id: teamIdNum,
      assigned_to: teamName,
      deployment_status: "dispatched",
      dispatched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("emergency_reports").update(updates).eq("id", emergencyId)

    if (error) {
      console.error("❌ [DEBUG] Error assigning team to emergency:", error)
      return false
    }

    console.log("✅ [DEBUG] Successfully assigned team to emergency")
    return true
  } catch (error) {
    console.error("❌ [DEBUG] Exception assigning team to emergency:", error)
    return false
  }
}

export async function updateDeploymentStatus(emergencyId: number, status: string, notes?: string): Promise<boolean> {
  const updates: any = {
    deployment_status: status,
    updated_at: new Date().toISOString(),
  }

  if (status === "dispatched" && !updates.dispatched_at) {
    updates.dispatched_at = new Date().toISOString()
  } else if (status === "on_scene" && !updates.arrived_at) {
    updates.arrived_at = new Date().toISOString()
  } else if (status === "resolved") {
    updates.resolved_at = new Date().toISOString()
    updates.status = "resolved"
  }

  if (notes) {
    updates.notes = notes
  }

  const { error } = await supabase.from("emergency_reports").update(updates).eq("id", emergencyId)

  if (error) {
    console.error("Error updating deployment status:", error)
    return false
  }

  return true
}
