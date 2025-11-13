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
    if (loading) {
      return
    }

    if (requireAuth && !isAuthenticated) {
      router.replace(loginPath)
      return
    }

    if (requireRole && (!user || !hasRole(requireRole))) {
      router.replace(fallbackPath)
      return
    }
  }, [user, loading, isAuthenticated, requireAuth, requireRole, router, hasRole, fallbackPath, loginPath])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null
  }
  if (requireRole && (!user || !hasRole(requireRole))) {
    return null
  }

  return <>{children}</>
}
