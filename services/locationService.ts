import { supabase } from "./supabaseClient"

export interface LocationShare {
  id: string
  userId: string
  userName: string
  userEmail: string
  shareType: "emergency" | "voluntary"
  location: {
    lat: number
    lng: number
  }
  address: string
  accuracy: number
  deviceInfo: string
  status: "active" | "expired" | "revoked"
  expiresAt: string
  deletedAt?: string
  timestamp: string
  updatedAt: string
}

export async function loadLocationShares(): Promise<LocationShare[]> {
  try {
    const { data, error } = await supabase.from("location_shares").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading location shares:", error)
      return []
    }

    return (data || []).map((share) => ({
      id: share.id.toString(),
      userId: share.user_id?.toString() || "",
      userName: share.user_name,
      userEmail: share.user_email,
      shareType: share.share_type,
      location: {
        lat: Number.parseFloat(share.location_lat),
        lng: Number.parseFloat(share.location_lng),
      },
      address: share.address,
      accuracy: share.accuracy,
      deviceInfo: share.device_info,
      status: share.status,
      expiresAt: share.expires_at,
      deletedAt: share.deleted_at,
      timestamp: share.created_at,
      updatedAt: share.updated_at,
    }))
  } catch (error) {
    console.error("Error loading location shares:", error)
    return []
  }
}

export async function saveLocationShare(
  share: Omit<LocationShare, "id" | "timestamp" | "updatedAt">,
): Promise<{ success: boolean; id?: string }> {
  try {
    const { data, error } = await supabase
      .from("location_shares")
      .insert([
        {
          user_id: share.userId ? Number.parseInt(share.userId) : null,
          user_name: share.userName,
          user_email: share.userEmail,
          share_type: share.shareType,
          location_lat: share.location.lat,
          location_lng: share.location.lng,
          address: share.address,
          accuracy: share.accuracy,
          device_info: share.deviceInfo,
          status: share.status,
          expires_at: share.expiresAt,
          deleted_at: share.deletedAt,
        },
      ])
      .select()

    if (error) {
      console.error("Error saving location share:", error)
      return { success: false }
    }

    return { success: true, id: data[0].id.toString() }
  } catch (error) {
    console.error("Error saving location share:", error)
    return { success: false }
  }
}

export async function updateLocationShare(id: string, updates: Partial<LocationShare>): Promise<boolean> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.userName !== undefined) updateData.user_name = updates.userName
    if (updates.userEmail !== undefined) updateData.user_email = updates.userEmail
    if (updates.shareType !== undefined) updateData.share_type = updates.shareType
    if (updates.location?.lat !== undefined) updateData.location_lat = updates.location.lat
    if (updates.location?.lng !== undefined) updateData.location_lng = updates.location.lng
    if (updates.address !== undefined) updateData.address = updates.address
    if (updates.accuracy !== undefined) updateData.accuracy = updates.accuracy
    if (updates.deviceInfo !== undefined) updateData.device_info = updates.deviceInfo
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt
    if (updates.deletedAt !== undefined) updateData.deleted_at = updates.deletedAt

    const { error } = await supabase.from("location_shares").update(updateData).eq("id", Number.parseInt(id))

    if (error) {
      console.error("Error updating location share:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating location share:", error)
    return false
  }
}

export async function deleteLocationShare(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("location_shares")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", Number.parseInt(id))

    if (error) {
      console.error("Error deleting location share:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting location share:", error)
    return false
  }
}

export async function undoDeleteLocationShare(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("location_shares").update({ deleted_at: null }).eq("id", Number.parseInt(id))

    if (error) {
      console.error("Error undoing delete location share:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error undoing delete location share:", error)
    return false
  }
}

export async function expireOldLocationShares(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("location_shares")
      .update({ status: "expired" })
      .lt("expires_at", new Date().toISOString())
      .eq("status", "active")
      .select()

    if (error) {
      console.error("Error expiring location shares:", error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error("Error expiring location shares:", error)
    return 0
  }
}
