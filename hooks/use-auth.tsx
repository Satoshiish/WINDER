"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/services/supabaseClient"

interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin" | "volunteer" | "responder"
  team_id?: number
  teamId?: number
  teamRole?: string
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
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
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

      if (error) {
        console.error("Login error:", error.message)
        setLoading(false)
        return false
      }

      if (!users || users.length === 0) {
        console.error("Login error: User not found")
        setLoading(false)
        return false
      }

      if (users.length > 1) {
        console.error("Login error: Multiple users found with same email")
        setLoading(false)
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
          teamId: userData.team_id,
          teamRole: userData.role,
        }

        setUser(user)
        localStorage.setItem("weather-app-user", JSON.stringify(user))

        // Set a simple client cookie so server-side middleware can detect authenticated users.
        try {
          // Cookie lasts 1 day by default; this is a lightweight session marker (not secure).
          document.cookie = `auth-token=${encodeURIComponent(user.id)}; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax`
          // If the userData contains a setup indicator, propagate it to a cookie used by middleware
          if ((userData as any).setup_complete) {
            document.cookie = `setup-complete=1; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax`
          }
        } catch (e) {
          // If document is unavailable or cookie set fails, continue gracefully
          console.debug("Unable to set auth-token cookie:", e)
        }

        setLoading(false)
        return true
      }

      setLoading(false)
      return false
    } catch (error) {
      console.error("Login failed:", error)
      setLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("weather-app-user")
    try {
      document.cookie = `auth-token=; Path=/; Max-Age=0; SameSite=Lax`
      document.cookie = `setup-complete=; Path=/; Max-Age=0; SameSite=Lax`
    } catch (e) {
      console.debug("Unable to clear auth cookies:", e)
    }
  }

  const isAuthenticated = !!user
  const hasRole = (role: string) => {
    return user?.role === role
  }

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
