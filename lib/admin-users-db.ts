import { supabase } from "./supabase-client"

export interface AdminUser {
  id: string
  email: string
  name: string
  role: "admin"
  createdAt: string
  lastLogin?: string
}

const MAX_ADMINS = 10

/**
 * Load admin users from database
 */
export async function loadAdminUsers(): Promise<AdminUser[]> {
  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading admin users from database:", error)
      return []
    }

    return (data || []).map((user) => ({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: "admin",
      createdAt: user.created_at,
      lastLogin: user.last_login,
    }))
  } catch (error) {
    console.error("[v0] Error loading admin users:", error)
    return []
  }
}

/**
 * Add a new admin user to database
 */
export async function addAdminUser(
  email: string,
  name: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: AdminUser }> {
  try {
    // Check max limit
    const existingUsers = await loadAdminUsers()
    if (existingUsers.length >= MAX_ADMINS) {
      return { success: false, message: `Maximum of ${MAX_ADMINS} admin users reached` }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, message: "Invalid email format" }
    }

    // Validate password length
    if (password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters" }
    }

    // Insert new admin user
    const { data, error } = await supabase
      .from("admin_users")
      .insert({
        email,
        name,
        password_hash: password, // In production, hash this properly
        role: "admin",
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return { success: false, message: "Email already exists" }
      }
      console.error("[v0] Error adding admin user:", error)
      return { success: false, message: "Failed to add admin user" }
    }

    const newUser: AdminUser = {
      id: data.id.toString(),
      email: data.email,
      name: data.name,
      role: "admin",
      createdAt: data.created_at,
    }

    console.log(`[v0] Added new admin user: ${email}`)
    return { success: true, message: "Admin user added successfully", user: newUser }
  } catch (error) {
    console.error("[v0] Error adding admin user:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

/**
 * Remove an admin user (soft delete)
 */
export async function removeAdminUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const users = await loadAdminUsers()

    // Prevent removing the last admin
    if (users.length <= 1) {
      return { success: false, message: "Cannot remove the last admin user" }
    }

    // Soft delete the user
    const { error } = await supabase
      .from("admin_users")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", Number.parseInt(userId))

    if (error) {
      console.error("[v0] Error removing admin user:", error)
      return { success: false, message: "Failed to remove admin user" }
    }

    console.log(`[v0] Removed admin user: ${userId}`)
    return { success: true, message: "Admin user removed successfully" }
  } catch (error) {
    console.error("[v0] Error removing admin user:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

/**
 * Update admin user's last login time
 */
export async function updateLastLogin(email: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("email", email)

    if (error) {
      console.error("[v0] Error updating last login:", error)
    } else {
      console.log(`[v0] Updated last login for: ${email}`)
    }
  } catch (error) {
    console.error("[v0] Error updating last login:", error)
  }
}

/**
 * Verify admin credentials
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .is("deleted_at", null)
      .single()

    if (error || !data) {
      return null
    }

    // In production, use proper password hashing comparison
    if (data.password_hash === password) {
      await updateLastLogin(email)
      return {
        id: data.id.toString(),
        email: data.email,
        name: data.name,
        role: "admin",
        createdAt: data.created_at,
        lastLogin: new Date().toISOString(),
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Error verifying credentials:", error)
    return null
  }
}
