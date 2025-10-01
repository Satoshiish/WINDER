"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { verifyAdminCredentials } from "@/lib/admin-users-storage"

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
      // This would check for existing auth token/session
      // For now, just simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check localStorage for demo purposes
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

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const adminUser = verifyAdminCredentials(email, password)
      if (adminUser) {
        const user: User = {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: "admin",
        }

        setUser(user)
        localStorage.setItem("weather-app-user", JSON.stringify(user))
        console.log(`[v0] Admin user logged in: ${email}`)
        return true
      }

      console.log(`[v0] Login failed for: ${email}`)
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
