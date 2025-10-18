"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase-client"

interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin" | "volunteer" | "responder"
  team_id?: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, userType?: "admin" | "volunteer" | "responder") => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const storedUser = localStorage.getItem("weather-app-user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (
    email: string,
    password: string,
    userType: "admin" | "volunteer" | "responder" = "admin",
  ): Promise<boolean> => {
    try {
      setLoading(true)
      console.log("[v0] Attempting login for:", email, "as", userType)

      let users, error

      if (userType === "admin") {
        const result = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .eq("role", "admin")
          .eq("is_active", true)
        users = result.data
        error = result.error
      } else if (userType === "volunteer") {
        const result = await supabase.from("volunteers").select("*").eq("email", email).eq("is_active", true)
        users = result.data
        error = result.error
      } else if (userType === "responder") {
        const result = await supabase.from("responders").select("*").eq("email", email).eq("is_active", true)
        users = result.data
        error = result.error
      }

      console.log("[v0] Query result:", { users, error })

      if (error) {
        console.error("Login error:", error.message)
        return false
      }

      if (!users || users.length === 0) {
        console.error("Login error: User not found")
        return false
      }

      if (users.length > 1) {
        console.error("Login error: Multiple users found with same email")
        return false
      }

      const userData = users[0]

      if (userData.password === password) {
        const user: User = {
          id: userData.id.toString(),
          email: userData.email,
          name: userData.full_name,
          role: userType,
          team_id: userData.team_id,
        }

        setUser(user)
        localStorage.setItem("weather-app-user", JSON.stringify(user))
        console.log(`[v0] User logged in successfully: ${email} as ${userType}`)
        return true
      }

      console.log(`[v0] Login failed: Invalid password for ${email}`)
      return false
    } catch (error) {
      console.error("Login failed:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("weather-app-user")
  }

  const isAuthenticated = !!user
  const hasRole = (role: string) => user?.role === role

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
