"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase-client"

interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin" | "emergency_responder"
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      // Check if user data exists in localStorage (simple session persistence)
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)

      // Query the users table directly
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (error || !users) {
        console.error("Login error:", error?.message || "User not found")
        return false
      }

      // Check password (in production, you should use proper hashing)
      if (users.password === password) {
        const userData: User = {
          id: users.id.toString(),
          email: users.email,
          name: users.full_name,
          role: users.role as "user" | "admin" | "emergency_responder"
        }

        setUser(userData)
        localStorage.setItem("weather-app-user", JSON.stringify(userData))
        console.log(`User logged in: ${email}`)
        return true
      }

      console.log(`Login failed for: ${email}`)
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