"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface SharedLocation {
  id: string
  userId: string
  userName: string
  userEmail: string
  location: { lat: number; lng: number }
  address: string
  timestamp: Date
  status: "active" | "expired" | "revoked"
  shareType: "emergency" | "voluntary"
  expiresAt: Date
  accuracy: number
  deviceInfo: string
  deletedAt: Date | null
}

interface LocationSharingContextType {
  sharedLocations: SharedLocation[]
  addSharedLocation: (location: Omit<SharedLocation, "id" | "timestamp" | "status" | "deletedAt">) => void
  revokeLocation: (locationId: string) => void
  updateLocationStatus: (locationId: string, status: SharedLocation["status"]) => void
  getActiveLocations: () => SharedLocation[]
  getEmergencyLocations: () => SharedLocation[]
  undoRevokeLocation: (locationId: string) => void
}

const LocationSharingContext = createContext<LocationSharingContextType | undefined>(undefined)

const DELETION_GRACE_PERIOD_HOURS = 24 // 24-hour grace period before permanent deletion

export function LocationSharingProvider({ children }: { children: ReactNode }) {
  const [sharedLocations, setSharedLocations] = useState<SharedLocation[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("weatherhub-shared-locations")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        const locations = parsed.map((loc: any) => ({
          ...loc,
          timestamp: new Date(loc.timestamp),
          expiresAt: new Date(loc.expiresAt),
          deletedAt: loc.deletedAt ? new Date(loc.deletedAt) : null,
        }))
        setSharedLocations(locations)
      } catch (error) {
        console.error("Failed to parse stored locations:", error)
      }
    }
  }, [])

  // Save to localStorage whenever locations change
  useEffect(() => {
    localStorage.setItem("weatherhub-shared-locations", JSON.stringify(sharedLocations))
  }, [sharedLocations])

  // Check for expired locations and cleanup deleted ones every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const gracePeriodMs = DELETION_GRACE_PERIOD_HOURS * 60 * 60 * 1000

      setSharedLocations((prev) => {
        // First, permanently remove locations past grace period
        const afterPermanentDeletion = prev.filter((location) => {
          if (!location.deletedAt) {
            return true // Keep locations not marked for deletion
          }

          const timeSinceDeletion = now.getTime() - location.deletedAt.getTime()
          const shouldKeep = timeSinceDeletion < gracePeriodMs

          if (!shouldKeep) {
            console.log(
              `[v0] Permanently removing location ${location.id} - Deleted ${Math.floor(timeSinceDeletion / (60 * 60 * 1000))} hours ago`,
            )
          }

          return shouldKeep
        })

        // Then, update expired locations
        return afterPermanentDeletion.map((location) => {
          if (location.status === "active" && location.expiresAt < now) {
            return { ...location, status: "expired" as const }
          }
          return location
        })
      })
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const addSharedLocation = (locationData: Omit<SharedLocation, "id" | "timestamp" | "status" | "deletedAt">) => {
    const newLocation: SharedLocation = {
      ...locationData,
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: "active",
      deletedAt: null,
    }

    setSharedLocations((prev) => [newLocation, ...prev])
  }

  const revokeLocation = (locationId: string) => {
    setSharedLocations((prev) =>
      prev.map((location) =>
        location.id === locationId ? { ...location, status: "revoked" as const, deletedAt: new Date() } : location,
      ),
    )
    console.log(`[v0] Marked location for deletion: ${locationId} (24-hour grace period)`)
  }

  const undoRevokeLocation = (locationId: string) => {
    setSharedLocations((prev) =>
      prev.map((location) =>
        location.id === locationId ? { ...location, status: "active" as const, deletedAt: null } : location,
      ),
    )
    console.log(`[v0] Restored location from deletion: ${locationId}`)
  }

  const updateLocationStatus = (locationId: string, status: SharedLocation["status"]) => {
    setSharedLocations((prev) =>
      prev.map((location) => (location.id === locationId ? { ...location, status } : location)),
    )
  }

  const getActiveLocations = () => {
    return sharedLocations.filter((location) => location.status === "active" && !location.deletedAt)
  }

  const getEmergencyLocations = () => {
    return sharedLocations.filter(
      (location) => location.shareType === "emergency" && location.status === "active" && !location.deletedAt,
    )
  }

  return (
    <LocationSharingContext.Provider
      value={{
        sharedLocations,
        addSharedLocation,
        revokeLocation,
        updateLocationStatus,
        getActiveLocations,
        getEmergencyLocations,
        undoRevokeLocation,
      }}
    >
      {children}
    </LocationSharingContext.Provider>
  )
}

export function useLocationSharing() {
  const context = useContext(LocationSharingContext)
  if (context === undefined) {
    throw new Error("useLocationSharing must be used within a LocationSharingProvider")
  }
  return context
}
