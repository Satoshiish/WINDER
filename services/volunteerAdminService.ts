import { supabase } from "./supabaseClient"

export interface Volunteer {
  id: number
  email: string
  full_name: string
  phone_number: string | null
  barangay: string | null
  municipality: string
  province: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VolunteerArea {
  id: number
  volunteer_id: number
  barangay: string
  municipality: string
  province: string
  assigned_at: string
  is_active: boolean
  is_primary: boolean
}

export interface VolunteerWithAreas extends Volunteer {
  areas?: VolunteerArea[]
  update_count?: number
}

// Get all volunteers
export async function getAllVolunteers(): Promise<VolunteerWithAreas[]> {
  try {
    const { data, error } = await supabase
      .from("volunteers")
      .select(`
        *,
        volunteer_areas(*),
        volunteer_updates(count)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching volunteers:", error)
      return []
    }

    return (data || []).map((volunteer: any) => ({
      ...volunteer,
      areas: volunteer.volunteer_areas || [],
      update_count: volunteer.volunteer_updates?.[0]?.count || 0,
    }))
  } catch (error) {
    console.error("Error fetching volunteers:", error)
    return []
  }
}

// Add new volunteer
export async function addVolunteer(volunteer: {
  email: string
  password: string
  full_name: string
  phone_number?: string
  barangay?: string
  municipality?: string
  province?: string
}): Promise<{ success: boolean; message: string; data?: Volunteer }> {
  try {
    // Check if email already exists
    const { data: existing } = await supabase.from("volunteers").select("id").eq("email", volunteer.email).single()

    if (existing) {
      return { success: false, message: "Email already exists" }
    }

    const { data, error } = await supabase
      .from("volunteers")
      .insert({
        ...volunteer,
        municipality: volunteer.municipality || "Olongapo City",
        province: volunteer.province || "Zambales",
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding volunteer:", error)
      return { success: false, message: error.message || "Failed to add volunteer" }
    }

    return { success: true, message: "Volunteer added successfully", data }
  } catch (error) {
    console.error("Error adding volunteer:", error)
    return { success: false, message: "An error occurred" }
  }
}

// Assign volunteer to barangay
export async function assignVolunteerToBarangay(
  volunteerId: number,
  barangay: string,
  municipality: string,
  province: string,
  isPrimary = false,
): Promise<{ success: boolean; message: string }> {
  try {
    // If setting as primary, unset other primaries
    if (isPrimary) {
      await supabase.from("volunteer_areas").update({ is_primary: false }).eq("volunteer_id", volunteerId)
    }

    const { error } = await supabase.from("volunteer_areas").insert({
      volunteer_id: volunteerId,
      barangay,
      municipality,
      province,
      is_active: true,
      is_primary: isPrimary,
    })

    if (error) {
      console.error("Error assigning volunteer:", error)
      return { success: false, message: error.message || "Failed to assign volunteer" }
    }

    // Update volunteer's primary barangay if this is primary
    if (isPrimary) {
      await supabase.from("volunteers").update({ barangay }).eq("id", volunteerId)
    }

    return { success: true, message: "Volunteer assigned successfully" }
  } catch (error) {
    console.error("Error assigning volunteer:", error)
    return { success: false, message: "An error occurred" }
  }
}

// Remove volunteer assignment
export async function removeVolunteerAssignment(areaId: number): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from("volunteer_areas").delete().eq("id", areaId)

    if (error) {
      console.error("Error removing assignment:", error)
      return { success: false, message: error.message || "Failed to remove assignment" }
    }

    return { success: true, message: "Assignment removed successfully" }
  } catch (error) {
    console.error("Error removing assignment:", error)
    return { success: false, message: "An error occurred" }
  }
}

// Deactivate volunteer
export async function deactivateVolunteer(volunteerId: number): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from("volunteers").update({ is_active: false }).eq("id", volunteerId)

    if (error) {
      console.error("Error deactivating volunteer:", error)
      return { success: false, message: error.message || "Failed to deactivate volunteer" }
    }

    return { success: true, message: "Volunteer deactivated successfully" }
  } catch (error) {
    console.error("Error deactivating volunteer:", error)
    return { success: false, message: "An error occurred" }
  }
}

// Reactivate volunteer
export async function reactivateVolunteer(volunteerId: number): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from("volunteers").update({ is_active: true }).eq("id", volunteerId)

    if (error) {
      console.error("Error reactivating volunteer:", error)
      return { success: false, message: error.message || "Failed to reactivate volunteer" }
    }

    return { success: true, message: "Volunteer reactivated successfully" }
  } catch (error) {
    console.error("Error reactivating volunteer:", error)
    return { success: false, message: "An error occurred" }
  }
}

// Update volunteer details
export async function updateVolunteer(
  id: number,
  updates: {
    full_name?: string
    phone_number?: string
    barangay?: string
    is_active?: boolean
  },
): Promise<{ success: boolean; message: string; data?: Volunteer }> {
  try {
    const { data, error } = await supabase.from("volunteers").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating volunteer:", error)
      return { success: false, message: error.message || "Failed to update volunteer" }
    }

    return { success: true, message: "Volunteer updated successfully", data }
  } catch (error) {
    console.error("Error updating volunteer:", error)
    return { success: false, message: "An error occurred" }
  }
}

// Delete volunteer
export async function deleteVolunteer(id: number): Promise<{ success: boolean; message: string }> {
  try {
    // First delete all associated volunteer areas
    await supabase.from("volunteer_areas").delete().eq("volunteer_id", id)

    // Then delete the volunteer
    const { error } = await supabase.from("volunteers").delete().eq("id", id)

    if (error) {
      console.error("Error deleting volunteer:", error)
      return { success: false, message: error.message || "Failed to delete volunteer" }
    }

    return { success: true, message: "Volunteer deleted successfully" }
  } catch (error) {
    console.error("Error deleting volunteer:", error)
    return { success: false, message: "An error occurred" }
  }
}

// Get all Olongapo barangays for dropdown
export function getOlongapoBarangays(): string[] {
  return [
    "Sta Rita",
    "Gordon Heights",
    "East Bajac-Bajac",
    "West Bajac-Bajac",
    "East Tapinac",
    "West Tapinac",
    "Barretto",
    "New Cabalan",
    "Old Cabalan",
    "Pag-asa",
    "Kalaklan",
    "Mabayuan",
    "New Kalalake",
    "Old Kalalake",
    "New Ilalim",
    "Old Ilalim",
    "Asinan Poblacion",
  ].sort()
}

// Assign multiple locations to a volunteer
export async function assignMultipleLocations(
  volunteerId: number,
  locations: { barangay: string; is_primary: boolean }[],
): Promise<{ success: boolean; message: string }> {
  try {
    // Remove all existing assignments
    await supabase.from("volunteer_areas").delete().eq("volunteer_id", volunteerId)

    // Add new assignments
    const assignments = locations.map((loc) => ({
      volunteer_id: volunteerId,
      barangay: loc.barangay,
      municipality: "Olongapo City",
      province: "Zambales",
      is_active: true,
      is_primary: loc.is_primary,
    }))

    const { error } = await supabase.from("volunteer_areas").insert(assignments)

    if (error) {
      console.error("Error assigning locations:", error)
      return { success: false, message: error.message || "Failed to assign locations" }
    }

    // Update volunteer's primary barangay field
    const primaryLocation = locations.find((loc) => loc.is_primary)
    if (primaryLocation) {
      await supabase.from("volunteers").update({ barangay: primaryLocation.barangay }).eq("id", volunteerId)
    }

    return { success: true, message: "Locations assigned successfully" }
  } catch (error) {
    console.error("Error assigning locations:", error)
    return { success: false, message: "An error occurred" }
  }
}

// Set primary location for a volunteer
export async function setPrimaryLocation(
  volunteerId: number,
  areaId: number,
): Promise<{ success: boolean; message: string }> {
  try {
    // First, unset all primaries for this volunteer
    await supabase.from("volunteer_areas").update({ is_primary: false }).eq("volunteer_id", volunteerId)

    // Set the selected area as primary
    const { data, error } = await supabase
      .from("volunteer_areas")
      .update({ is_primary: true })
      .eq("id", areaId)
      .select()
      .single()

    if (error) {
      console.error("Error setting primary location:", error)
      return { success: false, message: error.message || "Failed to set primary location" }
    }

    // Update volunteer's barangay field
    await supabase.from("volunteers").update({ barangay: data.barangay }).eq("id", volunteerId)

    return { success: true, message: "Primary location updated successfully" }
  } catch (error) {
    console.error("Error setting primary location:", error)
    return { success: false, message: "An error occurred" }
  }
}
