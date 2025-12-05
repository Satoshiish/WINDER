import { supabase } from "./supabaseClient"

export interface VolunteerProfile {
  id: number
  volunteer_id: number
  bio?: string | null
  trainings?: string[] | null
  total_hours?: number | null
  certifications?: any | null
  updated_at?: string | null
}

export async function getVolunteerProfile(volunteerId: number): Promise<VolunteerProfile | null> {
  try {
    const { data, error } = await supabase
      .from("volunteer_profiles")
      .select("*")
      .eq("volunteer_id", volunteerId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching volunteer profile:", error)
      return null
    }

    return data || null
  } catch (err) {
    console.error("Error fetching volunteer profile:", err)
    return null
  }
}

export async function upsertVolunteerProfile(volunteerId: number, payload: Partial<VolunteerProfile>) {
  try {
    const row = {
      volunteer_id: volunteerId,
      bio: payload.bio ?? null,
      trainings: payload.trainings ?? null,
      total_hours: payload.total_hours ?? null,
      certifications: payload.certifications ?? null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("volunteer_profiles")
      .upsert(row, { onConflict: "volunteer_id" })
      .select()
      .maybeSingle()

    if (error) {
      console.error("Error upserting volunteer profile:", error)
      return { success: false, message: error.message }
    }

    return { success: true, message: "Profile updated", data }
  } catch (err) {
    console.error("Error upserting volunteer profile:", err)
    return { success: false, message: "An error occurred" }
  }
}
