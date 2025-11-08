"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useLocationSharing } from "@/contexts/location-sharing-context"
import { RouteGuard } from "@/components/route-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  MapPin,
  Search,
  Globe,
  Clock,
  User,
  ArrowLeft,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  AlertCircle,
  AlertTriangle,
} from "lucide-react"
import type { LocationShare } from "@/lib/location-db"
import { formatAddress } from "@/lib/format-address"
import { getBarangayFromCoordinates, formatBarangay } from "@/lib/barangay-lookup"

export default function LocationManagement() {
  const { user } = useAuth()
  const router = useRouter()
  const { sharedLocations, revokeLocation, undoRevokeLocation } = useLocationSharing()
  const [filteredShares, setFilteredShares] = useState<LocationShare[]>(sharedLocations)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState<LocationShare | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [barangayData, setBarangayData] = useState<Record<string, string>>({})

  useEffect(() => {
    setFilteredShares(sharedLocations)
  }, [sharedLocations])

  useEffect(() => {
    const fetchBarangayData = async () => {
      const newBarangayData: Record<string, string> = {}

      for (const share of sharedLocations) {
        if (!barangayData[share.id]) {
          try {
            const barangay = await getBarangayFromCoordinates(share.location.lat, share.location.lng)
            newBarangayData[share.id] = barangay
          } catch (error) {
            console.error(`Failed to fetch barangay for location ${share.id}:`, error)
            newBarangayData[share.id] = "Unknown Barangay"
          }
        }
      }

      if (Object.keys(newBarangayData).length > 0) {
        setBarangayData((prev) => ({ ...prev, ...newBarangayData }))
      }
    }

    if (sharedLocations.length > 0) {
      fetchBarangayData()
    }
  }, [sharedLocations, barangayData])

  useEffect(() => {
    let filtered = sharedLocations

    if (!showDeleted) {
      filtered = filtered.filter((share) => !share.deletedAt)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (share) =>
          share.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          share.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          share.address.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((share) => share.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((share) => share.shareType === typeFilter)
    }

    setFilteredShares(filtered)
  }, [sharedLocations, searchTerm, statusFilter, typeFilter, showDeleted])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "expired":
        return "bg-gray-500"
      case "revoked":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "expired":
        return "secondary"
      case "revoked":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "emergency":
        return "destructive"
      case "voluntary":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else {
      return `${diffHours}h ago`
    }
  }

  const formatTimeUntil = (date: Date) => {
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMs < 0) {
      return "Expired"
    } else if (diffMins < 60) {
      return `${diffMins}m left`
    } else {
      return `${diffHours}h left`
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleRevokeLocation = (locationId: string) => {
    revokeLocation(locationId)
  }

  const handleUndoRevoke = (locationId: string) => {
    undoRevokeLocation(locationId)
  }

  const getTimeUntilDeletion = (deletedAt: Date) => {
    const now = new Date()
    const hoursRemaining = 24 - Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60))
    return Math.max(0, hoursRemaining)
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(filteredShares, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `location-shares-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <RouteGuard requireAuth requireRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="border-b border-slate-700/60 bg-slate-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin")}
                    className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" />
                    <h1 className="text-lg sm:text-2xl font-bold text-white">Location Management</h1>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl text-xs"
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline ml-2">Refresh</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl text-xs"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-2">Export</span>
                </Button>
                <Button
                  variant={showDeleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowDeleted(!showDeleted)}
                  className={`${showDeleted ? "bg-red-500 hover:bg-red-600" : "bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50"} rounded-xl text-xs`}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:h-4" />
                  <span className="hidden sm:inline ml-2">{showDeleted ? "Hide Deleted" : "Show Deleted"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-6">
          <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, email, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-32 bg-slate-700/50 border-slate-600/50 text-white rounded-xl text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="revoked">Revoked</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-32 bg-slate-700/50 border-slate-600/50 text-white rounded-xl text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="voluntary">Voluntary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6">
            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">Active Shares</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">
                      {sharedLocations.filter((l) => l.status === "active" && !l.deletedAt).length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">Emergency</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-500">
                      {
                        sharedLocations.filter(
                          (l) => l.shareType === "emergency" && l.status === "active" && !l.deletedAt,
                        ).length
                      }
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">Expired</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-500">
                      {sharedLocations.filter((l) => l.status === "expired" && !l.deletedAt).length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">Total Users</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-500">
                      {new Set(sharedLocations.filter((l) => !l.deletedAt).map((l) => l.userId)).size}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-white">
                <span className="text-sm sm:text-base md:text-lg">Location Shares ({filteredShares.length})</span>
                {filteredShares.length !== sharedLocations.length && (
                  <Badge variant="outline" className="border-slate-600/50 text-slate-300 w-fit text-xs">
                    Filtered from {sharedLocations.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredShares.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm sm:text-base">
                    {sharedLocations.length === 0
                      ? "No locations have been shared yet. Users can share their location from the main app."
                      : "No location shares match your current filters"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredShares.map((share) => {
                    const isMarkedForDeletion = !!share.deletedAt
                    const hoursUntilDeletion = isMarkedForDeletion ? getTimeUntilDeletion(share.deletedAt!) : 0

                    return (
                      <div
                        key={share.id}
                        className={`p-3 sm:p-4 rounded-xl border space-y-3 ${
                          isMarkedForDeletion
                            ? "bg-red-900/20 border-red-500/50"
                            : "bg-slate-700/50 border-slate-600/30"
                        }`}
                      >
                        {isMarkedForDeletion && (
                          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                              <p className="text-xs sm:text-sm text-red-300">
                                Marked for deletion - Will be permanently removed in {hoursUntilDeletion} hours
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUndoRevoke(share.id)}
                              className="bg-green-600/20 border-green-500/50 text-green-300 hover:bg-green-600/30 rounded-lg text-xs flex-shrink-0"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              <span className="hidden xs:inline">Undo</span>
                            </Button>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(share.status)}`} />
                            <div className="min-w-0">
                              <p className="font-medium text-white text-sm sm:text-base truncate">{share.userName}</p>
                              <p className="text-xs sm:text-sm text-slate-300 truncate">{share.userEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getTypeColor(share.shareType)} className="text-xs capitalize">
                              {share.shareType}
                            </Badge>
                            <Badge variant={getStatusVariant(share.status)} className="text-xs capitalize">
                              {share.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                          <div className="min-w-0">
                            <p className="text-slate-400">Location:</p>
                            <p className="font-medium text-white truncate">{formatAddress(share.address)}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-400">Coordinates:</p>
                            <p className="font-mono text-white text-xs truncate">
                              {share.location.lat.toFixed(6)}, {share.location.lng.toFixed(6)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Barangay:</p>
                            <p className="font-medium text-white">
                              {formatBarangay(barangayData[share.id] || "Loading...")}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-400">Device:</p>
                            <p className="font-medium text-white truncate">{share.deviceInfo}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Shared:</p>
                            <p className="font-medium text-white">{formatTimeAgo(share.timestamp)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Expires:</p>
                            <p className="font-medium text-white">{formatTimeUntil(share.expiresAt)}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-600/30">
                          <p className="text-xs text-slate-400 truncate">ID: {share.id}</p>
                          <div className="flex flex-wrap gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedLocation(share)}
                                  className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl text-xs px-2 sm:px-3"
                                >
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                                  <span className="hidden xs:inline">Details</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-700/60 text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Location Details</DialogTitle>
                                </DialogHeader>
                                {selectedLocation && (
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-sm text-slate-400">User</p>
                                      <p className="font-medium text-white">{selectedLocation.userName}</p>
                                      <p className="text-sm text-slate-300">{selectedLocation.userEmail}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-slate-400">Full Address</p>
                                      <p className="font-medium text-white">
                                        {formatAddress(selectedLocation.address)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-slate-400">Precise Coordinates</p>
                                      <p className="font-mono text-sm text-white">
                                        Lat: {selectedLocation.location.lat}
                                        <br />
                                        Lng: {selectedLocation.location.lng}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        window.open(
                                          `https://maps.google.com/?q=${selectedLocation.location.lat},${selectedLocation.location.lng}`,
                                          "_blank",
                                        )
                                      }
                                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl"
                                    >
                                      <Globe className="w-4 h-4 mr-2" />
                                      View on Google Maps
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  `https://maps.google.com/?q=${share.location.lat},${share.location.lng}`,
                                  "_blank",
                                )
                              }
                              className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl text-xs px-2 sm:px-3"
                            >
                              <Globe className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                              <span className="hidden xs:inline">Map</span>
                            </Button>

                            {isMarkedForDeletion ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUndoRevoke(share.id)}
                                className="bg-green-600/20 border-green-500/50 text-green-300 hover:bg-green-600/30 rounded-lg text-xs px-2 sm:px-3"
                              >
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden xs:inline">Undo</span>
                              </Button>
                            ) : (
                              share.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRevokeLocation(share.id)}
                                  className="rounded-xl text-xs px-2 sm:px-3"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden xs:inline">Revoke</span>
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteGuard>
  )
}
