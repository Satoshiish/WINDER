import { supabase } from "./supabaseClient"

export interface ModerationReport {
  id: number
  content_type: "post" | "comment"
  content_id: number
  reported_by_id: number
  reason: string
  description?: string
  status: "pending" | "reviewed" | "approved" | "rejected" | "removed"
  moderator_id?: number
  moderator_notes?: string
  created_at: string
  updated_at: string
}

export async function getPendingReports(limit = 20): Promise<ModerationReport[]> {
  try {
    const { data, error } = await supabase
      .from("social_moderation")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching pending reports:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching pending reports:", error)
    return []
  }
}

export async function getModerationReports(
  status?: string,
  contentType?: string,
  limit = 50,
): Promise<ModerationReport[]> {
  try {
    let query = supabase.from("social_moderation").select("*")

    if (status) {
      query = query.eq("status", status)
    }

    if (contentType) {
      query = query.eq("content_type", contentType)
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(limit)

    if (error) {
      console.error("Error fetching moderation reports:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching moderation reports:", error)
    return []
  }
}

export async function createModerationReport(
  contentType: "post" | "comment",
  contentId: number,
  reportedById: number,
  reason: string,
  description?: string,
): Promise<{ success: boolean; report?: ModerationReport }> {
  try {
    const { data, error } = await supabase
      .from("social_moderation")
      .insert([
        {
          content_type: contentType,
          content_id: contentId,
          reported_by_id: reportedById,
          reason,
          description,
          status: "pending",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating moderation report:", error)
      return { success: false }
    }

    return { success: true, report: data }
  } catch (error) {
    console.error("Error creating moderation report:", error)
    return { success: false }
  }
}

export async function updateModerationStatus(
  reportId: number,
  status: "reviewed" | "approved" | "rejected" | "removed",
  moderatorId: number,
  notes?: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("social_moderation")
      .update({
        status,
        moderator_id: moderatorId,
        moderator_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)

    if (error) {
      console.error("Error updating moderation status:", error)
      return false
    }

    if (status === "removed") {
      const report = await supabase.from("social_moderation").select("*").eq("id", reportId).single()

      if (report.data) {
        const { content_type, content_id } = report.data

        if (content_type === "post") {
          await supabase.from("social_posts").update({ status: "deleted" }).eq("id", content_id)
        } else if (content_type === "comment") {
          await supabase.from("social_comments").update({ status: "deleted" }).eq("id", content_id)
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error updating moderation status:", error)
    return false
  }
}

export async function getModerationStats(): Promise<{
  total: number
  pending: number
  reviewed: number
  approved: number
  rejected: number
  removed: number
}> {
  try {
    const { data, error } = await supabase.from("social_moderation").select("status")

    if (error) {
      console.error("Error fetching moderation stats:", error)
      return { total: 0, pending: 0, reviewed: 0, approved: 0, rejected: 0, removed: 0 }
    }

    const stats = {
      total: data?.length || 0,
      pending: data?.filter((r) => r.status === "pending").length || 0,
      reviewed: data?.filter((r) => r.status === "reviewed").length || 0,
      approved: data?.filter((r) => r.status === "approved").length || 0,
      rejected: data?.filter((r) => r.status === "rejected").length || 0,
      removed: data?.filter((r) => r.status === "removed").length || 0,
    }

    return stats
  } catch (error) {
    console.error("Error fetching moderation stats:", error)
    return { total: 0, pending: 0, reviewed: 0, approved: 0, rejected: 0, removed: 0 }
  }
}
