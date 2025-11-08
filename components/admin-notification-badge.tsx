"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { loadEmergencyReports } from "@/services/emergencyService"

export function AdminNotificationBadge() {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const updateCount = async () => {
      const reports = await loadEmergencyReports()
      const pending = reports.filter((r) => r.status === "pending" && !r.deletedAt).length
      setPendingCount(pending)
    }

    // Initial load
    updateCount()

    // Listen for storage changes (keeping for backward compatibility)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "winder-emergency-reports" || e.key === null) {
        updateCount()
      }
    }

    const handleCustomEvent = () => {
      updateCount()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("emergency-reports-updated", handleCustomEvent)

    // Poll every 3 seconds for updates
    const interval = setInterval(updateCount, 3000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("emergency-reports-updated", handleCustomEvent)
      clearInterval(interval)
    }
  }, [])

  if (pendingCount === 0) return null

  return (
    <Badge variant="destructive" className="ml-2 animate-pulse">
      {pendingCount}
    </Badge>
  )
}
