"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

interface RouteGuardProps {
  children: ReactNode
  requireAuth?: boolean
  requireRole?: string
  fallbackPath?: string
  loginPath?: string
}

export function RouteGuard({
  children,
  requireAuth = false,
  requireRole,
  fallbackPath = "/",
  loginPath = "/login",
}: RouteGuardProps) {
  const { user, loading, isAuthenticated, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      router.push(loginPath)
      return
    }

    // Check role requirement
    if (requireRole && (!user || !hasRole(requireRole))) {
      router.push(fallbackPath)
      return
    }
  }, [user, loading, isAuthenticated, requireAuth, requireRole, router, hasRole, fallbackPath, loginPath])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render if auth requirements not met
  if (requireAuth && !isAuthenticated) return null
  if (requireRole && (!user || !hasRole(requireRole))) return null

  return <>{children}</>
}
