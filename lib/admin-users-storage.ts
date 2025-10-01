/**
 * Admin Users Storage Module
 * Manages local storage of admin user accounts (max 10)
 */

export interface AdminUser {
  id: string
  email: string
  name: string
  role: "admin"
  createdAt: string
  lastLogin?: string
}

const STORAGE_KEY = "weatherhub-admin-users"
const MAX_ADMINS = 10

/**
 * Load admin users from localStorage
 */
export function loadAdminUsers(): AdminUser[] {
  if (typeof window === "undefined" || !window.localStorage) {
    console.error("[v0] localStorage is not available")
    return []
  }

  try {
    const rawData = localStorage.getItem(STORAGE_KEY)
    if (!rawData) {
      console.log("[v0] No admin users found in storage, initializing with default admin")
      // Initialize with default admin
      const defaultAdmin: AdminUser = {
        id: "1",
        email: "admin@weather.ph",
        name: "Weather Admin",
        role: "admin",
        createdAt: new Date().toISOString(),
      }
      saveAdminUsers([defaultAdmin])
      return [defaultAdmin]
    }

    const users: AdminUser[] = JSON.parse(rawData)
    console.log(`[v0] Loaded ${users.length} admin users from storage`)
    return users
  } catch (error) {
    console.error("[v0] Error loading admin users:", error)
    return []
  }
}

/**
 * Save admin users to localStorage
 */
export function saveAdminUsers(users: AdminUser[]): void {
  if (typeof window === "undefined" || !window.localStorage) {
    console.error("[v0] localStorage is not available for saving")
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
    console.log(`[v0] Saved ${users.length} admin users to storage`)
  } catch (error) {
    console.error("[v0] Error saving admin users:", error)
  }
}

/**
 * Add a new admin user
 */
export function addAdminUser(
  email: string,
  name: string,
  password: string,
): { success: boolean; message: string; user?: AdminUser } {
  const users = loadAdminUsers()

  // Check max limit
  if (users.length >= MAX_ADMINS) {
    return { success: false, message: `Maximum of ${MAX_ADMINS} admin users reached` }
  }

  // Check if email already exists
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: "Email already exists" }
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

  const newUser: AdminUser = {
    id: Date.now().toString(),
    email,
    name,
    role: "admin",
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  saveAdminUsers(users)

  // Store password separately (in real app, this would be hashed on backend)
  saveAdminPassword(email, password)

  console.log(`[v0] Added new admin user: ${email}`)
  return { success: true, message: "Admin user added successfully", user: newUser }
}

/**
 * Remove an admin user
 */
export function removeAdminUser(userId: string): { success: boolean; message: string } {
  const users = loadAdminUsers()

  // Prevent removing the last admin
  if (users.length <= 1) {
    return { success: false, message: "Cannot remove the last admin user" }
  }

  const userToRemove = users.find((u) => u.id === userId)
  if (!userToRemove) {
    return { success: false, message: "User not found" }
  }

  const updatedUsers = users.filter((u) => u.id !== userId)
  saveAdminUsers(updatedUsers)

  // Remove password
  removeAdminPassword(userToRemove.email)

  console.log(`[v0] Removed admin user: ${userToRemove.email}`)
  return { success: true, message: "Admin user removed successfully" }
}

/**
 * Update admin user's last login time
 */
export function updateLastLogin(email: string): void {
  const users = loadAdminUsers()
  const user = users.find((u) => u.email === email)

  if (user) {
    user.lastLogin = new Date().toISOString()
    saveAdminUsers(users)
    console.log(`[v0] Updated last login for: ${email}`)
  }
}

/**
 * Verify admin credentials
 */
export function verifyAdminCredentials(email: string, password: string): AdminUser | null {
  const users = loadAdminUsers()
  const user = users.find((u) => u.email === email)

  if (!user) {
    return null
  }

  const storedPassword = getAdminPassword(email)
  if (storedPassword === password) {
    updateLastLogin(email)
    return user
  }

  return null
}

// Password storage helpers (simplified for demo - in production, use proper backend auth)
const PASSWORD_STORAGE_KEY = "weatherhub-admin-passwords"

function saveAdminPassword(email: string, password: string): void {
  if (typeof window === "undefined" || !window.localStorage) return

  try {
    const passwords = JSON.parse(localStorage.getItem(PASSWORD_STORAGE_KEY) || "{}")
    passwords[email] = password // In production, this would be hashed
    localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(passwords))
  } catch (error) {
    console.error("[v0] Error saving password:", error)
  }
}

function getAdminPassword(email: string): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null

  try {
    const passwords = JSON.parse(localStorage.getItem(PASSWORD_STORAGE_KEY) || "{}")
    return passwords[email] || null
  } catch (error) {
    console.error("[v0] Error getting password:", error)
    return null
  }
}

function removeAdminPassword(email: string): void {
  if (typeof window === "undefined" || !window.localStorage) return

  try {
    const passwords = JSON.parse(localStorage.getItem(PASSWORD_STORAGE_KEY) || "{}")
    delete passwords[email]
    localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(passwords))
  } catch (error) {
    console.error("[v0] Error removing password:", error)
  }
}

// Initialize default admin password
if (typeof window !== "undefined" && window.localStorage) {
  const passwords = JSON.parse(localStorage.getItem(PASSWORD_STORAGE_KEY) || "{}")
  if (!passwords["admin@weather.ph"]) {
    passwords["admin@weather.ph"] = "admin123"
    localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(passwords))
  }
}
