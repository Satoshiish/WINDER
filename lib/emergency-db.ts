import { supabase } from "./supabase-client"

export interface EmergencyReport {
  id: string
  userId: string
  userName: string
  contactNumber: string
  emergencyType: string
  priority: "critical" | "high" | "medium" | "low"
  peopleCount: number
  address: string
  location: {
    lat: number
    lng: number
  }
  additionalInfo?: string
  status: "pending" | "in-progress" | "resolved" | "cancelled"
  assignedTo?: string
  assigned_team_id?: number
  responseTime?: string
  notes: Array<{
    id: number
    author: string
    content: string
    timestamp: string
  }>
  deletedAt?: string
  timestamp: string
  updatedAt: string
  deployment_status?: "dispatched" | "on_scene" | "resolved"
  dispatched_at?: string
  arrived_at?: string
  resolved_at?: string
}

export interface EmergencyStats {
  total: number
  pending: number
  inProgress: number
  resolved: number
  critical: number
  high: number
  medium: number
  low: number
}

export async function loadEmergencyReports(): Promise<EmergencyReport[]> {
  try {
    const { data, error } = await supabase
      .from("emergency_reports")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading emergency reports:", error)
      return []
    }

    return (data || []).map((report) => ({
      id: report.id.toString(),
      userId: report.user_id?.toString() || "",
      userName: report.user_name,
      contactNumber: report.contact_number,
      emergencyType: report.emergency_type,
      priority: report.priority,
      peopleCount: report.people_count,
      address: report.address,
      location: {
        lat: Number.parseFloat(report.location_lat),
        lng: Number.parseFloat(report.location_lng),
      },
      additionalInfo: report.additional_info,
      status: report.status,
      assignedTo: report.assigned_to,
      assigned_team_id: report.assigned_team_id,
      responseTime: report.response_time,
      notes: report.notes || [],
      deletedAt: report.deleted_at,
      timestamp: report.created_at,
      updatedAt: report.updated_at,
      // NEW: Add the missing fields
      deployment_status: report.deployment_status,
      dispatched_at: report.dispatched_at,
      arrived_at: report.arrived_at,
      resolved_at: report.resolved_at,
    }))
  } catch (error) {
    console.error("Error loading emergency reports:", error)
    return []
  }
}

export async function saveEmergencyReport(
  report: Omit<EmergencyReport, "id" | "timestamp" | "updatedAt">,
): Promise<{ success: boolean; id?: string }> {
  try {
    const response = await fetch("/api/emergency", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(report),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      console.error("Error saving emergency report:", result.error)
      return { success: false }
    }

    return { success: true, id: result.id }
  } catch (error) {
    console.error("Error saving emergency report:", error)
    return { success: false }
  }
}

export async function updateEmergencyReport(id: string, updates: Partial<EmergencyReport>): Promise<boolean> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Map the field names properly
    if (updates.userName !== undefined) updateData.user_name = updates.userName
    if (updates.contactNumber !== undefined) updateData.contact_number = updates.contactNumber
    if (updates.emergencyType !== undefined) updateData.emergency_type = updates.emergencyType
    if (updates.priority !== undefined) updateData.priority = updates.priority
    if (updates.peopleCount !== undefined) updateData.people_count = updates.peopleCount
    if (updates.address !== undefined) updateData.address = updates.address
    if (updates.location?.lat !== undefined) updateData.location_lat = updates.location.lat.toString()
    if (updates.location?.lng !== undefined) updateData.location_lng = updates.location.lng.toString()
    if (updates.additionalInfo !== undefined) updateData.additional_info = updates.additionalInfo
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo
    if (updates.assigned_team_id !== undefined) updateData.assigned_team_id = updates.assigned_team_id // FIXED: This was missing!
    if (updates.responseTime !== undefined) updateData.response_time = updates.responseTime
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.deletedAt !== undefined) updateData.deleted_at = updates.deletedAt
    // NEW: Add the missing deployment fields
    if (updates.deployment_status !== undefined) updateData.deployment_status = updates.deployment_status
    if (updates.dispatched_at !== undefined) updateData.dispatched_at = updates.dispatched_at
    if (updates.arrived_at !== undefined) updateData.arrived_at = updates.arrived_at
    if (updates.resolved_at !== undefined) updateData.resolved_at = updates.resolved_at

    console.log('🔄 Updating emergency report:', { id, updateData }) // Added debug log

    const { error } = await supabase
      .from("emergency_reports")
      .update(updateData)
      .eq("id", id)

    if (error) {
      console.error("Error updating emergency report:", error)
      return false
    }

    console.log("Successfully updated emergency report:", id)
    return true
  } catch (error) {
    console.error("Error updating emergency report:", error)
    return false
  }
}

// NEW: Dedicated function for team assignment
export async function assignTeamToEmergency(
  reportId: string, 
  teamId: number, 
  assignedTo?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      assigned_team_id: teamId,
      updated_at: new Date().toISOString(),
      deployment_status: 'dispatched',
      dispatched_at: new Date().toISOString(),
      status: 'in-progress', // Auto-update status when team is assigned
    }

    if (assignedTo) {
      updateData.assigned_to = assignedTo
    }

    console.log('🚑 Assigning team to emergency:', { reportId, teamId, assignedTo })

    const { error } = await supabase
      .from("emergency_reports")
      .update(updateData)
      .eq("id", reportId)

    if (error) {
      console.error("Error assigning team to emergency:", error)
      return false
    }

    console.log("✅ Successfully assigned team to emergency:", reportId)
    return true
  } catch (error) {
    console.error("Error assigning team to emergency:", error)
    return false
  }
}

// NEW: Debug function to check current report state
export async function debugCurrentReport(reportId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("emergency_reports")
      .select("id, assigned_team_id, assigned_to, deployment_status, status")
      .eq("id", reportId)
      .single()

    if (error) {
      console.error("Error fetching report for debug:", error)
      return
    }

    console.log('🔍 Current report data from DB:')
    console.log('ID:', data.id)
    console.log('Assigned Team ID:', data.assigned_team_id)
    console.log('Assigned To:', data.assigned_to)
    console.log('Deployment Status:', data.deployment_status)
    console.log('Status:', data.status)
  } catch (error) {
    console.error("Error debugging report:", error)
  }
}

export async function deleteEmergencyReport(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("emergency_reports")
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      console.error("Error deleting emergency report:", error)
      return false
    }

    console.log("Successfully marked report for deletion:", id)
    return true
  } catch (error) {
    console.error("Error deleting emergency report:", error)
    return false
  }
}

export async function undoDeleteEmergencyReport(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("emergency_reports")
      .update({ 
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      console.error("Error undoing delete emergency report:", error)
      return false
    }

    console.log("Successfully undone deletion:", id)
    return true
  } catch (error) {
    console.error("Error undoing delete emergency report:", error)
    return false
  }
}

export async function getEmergencyStats(): Promise<EmergencyStats> {
  const reports = await loadEmergencyReports()
  const activeReports = reports.filter((r) => !r.deletedAt)

  return {
    total: activeReports.length,
    pending: activeReports.filter((r) => r.status === "pending").length,
    inProgress: activeReports.filter((r) => r.status === "in-progress").length,
    resolved: activeReports.filter((r) => r.status === "resolved").length,
    critical: activeReports.filter((r) => r.priority === "critical").length,
    high: activeReports.filter((r) => r.priority === "high").length,
    medium: activeReports.filter((r) => r.priority === "medium").length,
    low: activeReports.filter((r) => r.priority === "low").length,
  }
}

export async function cleanupOldReports(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from("emergency_reports")
      .delete()
      .lt("created_at", thirtyDaysAgo.toISOString())
      .select()

    if (error) {
      console.error("Error cleaning up old reports:", error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error("Error cleaning up old reports:", error)
    return 0
  }
}