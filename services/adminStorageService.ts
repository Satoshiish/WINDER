/**
 * Admin Users Storage Module
 * Manages admin user accounts in Supabase database (max 10)
 */

import { supabase } from "./supabaseClient"

export interface AdminUser {
  id: string
  email: string
  name: string
  role: "admin"
  createdAt: string
  lastLogin?: string
}

const MAX_ADMINS = 10

export async function loadAdminUsers(): Promise<AdminUser[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "admin")
      .eq("is_active", true)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error loading admin users from database:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.log("[v0] No admin users found in database")
      return []
    }

    const users: AdminUser[] = data.map((user) => ({
      id: user.id.toString(),
      email: user.email,
      name: user.full_name,
      role: "admin",
      createdAt: user.created_at,
      lastLogin: user.last_login,
    }))

    console.log(`[v0] Loaded ${users.length} admin users from database`)
    return users
  } catch (error) {
    console.error("[v0] Error loading admin users:", error)
    return []
  }
}

export async function addAdminUser(
  email: string,
  name: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: AdminUser }> {
  try {
    const users = await loadAdminUsers()

    if (users.length >= MAX_ADMINS) {
      return { success: false, message: `Maximum of ${MAX_ADMINS} admin users reached` }
    }

    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: "Email already exists" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, message: "Invalid email format" }
    }

    if (password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters" }
    }

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          password,
          full_name: name,
          role: "admin",
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error adding admin user to database:", error)
      return { success: false, message: "Failed to add admin user. Please try again." }
    }

    const newUser: AdminUser = {
      id: data.id.toString(),
      email: data.email,
      name: data.full_name,
      role: "admin",
      createdAt: data.created_at,
    }

    console.log(`[v0] Added new admin user to database: ${email}`)
    return { success: true, message: "Admin user added successfully", user: newUser }
  } catch (error) {
    console.error("[v0] Error adding admin user:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function removeAdminUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const users = await loadAdminUsers()

    if (users.length <= 1) {
      return { success: false, message: "Cannot remove the last admin user" }
    }

    const userToRemove = users.find((u) => u.id === userId)
    if (!userToRemove) {
      return { success: false, message: "User not found" }
    }

    const { error } = await supabase.from("users").update({ is_active: false }).eq("id", Number.parseInt(userId))

    if (error) {
      console.error("[v0] Error removing admin user from database:", error)
      return { success: false, message: "Failed to remove admin user. Please try again." }
    }

    console.log(`[v0] Removed admin user from database: ${userToRemove.email}`)
    return { success: true, message: "Admin user removed successfully" }
  } catch (error) {
    console.error("[v0] Error removing admin user:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function updateLastLogin(email: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("email", email)
      .eq("role", "admin")

    if (error) {
      console.error("[v0] Error updating last login:", error)
      return
    }

    console.log(`[v0] Updated last login for: ${email}`)
  } catch (error) {
    console.error("[v0] Error updating last login:", error)
  }
}

export async function verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("role", "admin")
      .eq("is_active", true)
      .single()

    if (error || !data) {
      console.log("[v0] Admin user not found or inactive:", email)
      return null
    }

    if (data.password === password) {
      await updateLastLogin(email)

      return {
        id: data.id.toString(),
        email: data.email,
        name: data.full_name,
        role: "admin",
        createdAt: data.created_at,
        lastLogin: new Date().toISOString(),
      }
    }

    console.log("[v0] Invalid password for admin user:", email)
    return null
  } catch (error) {
    console.error("[v0] Error verifying admin credentials:", error)
    return null
  }
}
