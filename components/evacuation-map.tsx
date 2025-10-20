"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Droplets,
  MapPin,
  Navigation,
  Shield,
  Wind,
  Eye,
  Layers,
  TrendingUp,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import { getEvacuationDataForLocation } from "@/lib/evacuation-data"

interface FloodZone {
  id: string
  name: string
  riskLevel: "high" | "medium" | "low"
  area: string
  affectedPopulation: number
  coordinates: [number, number]
  distance?: number
  mapImage?: string
}

interface SafeRoute {
  id: string
  name: string
  from: string
  to: string
  distance: number
  estimatedTime: number
  hazards: string[]
}

interface EvacuationCenter {
  id: string
  name: string
  capacity: number
  currentOccupancy: number
  coordinates: [number, number]
  address: string
  distance?: number
}

interface EvacuationMapProps {
  userLat?: number
  userLon?: number
}

export function EvacuationMap({ userLat, userLon }: EvacuationMapProps) {
  const [selectedZone, setSelectedZone] = useState<FloodZone | null>(null)
  const [activeLayer, setActiveLayer] = useState<"flood" | "routes" | "centers">("flood")
  const [weatherData, setWeatherData] = useState<any>(null)
  const [riskAssessment, setRiskAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [locationData, setLocationData] = useState<{ lat: number; lon: number } | null>(null)
  const [nearbyZones, setNearbyZones] = useState<FloodZone[]>([])
  const [nearbyRoutes, setNearbyRoutes] = useState<SafeRoute[]>([])
  const [nearbyCenters, setNearbyCenters] = useState<EvacuationCenter[]>([])
  const [currentCity, setCurrentCity] = useState<string>("")
  const [zoneMapImages, setZoneMapImages] = useState<Record<string, string>>({})
  const [uploadingZoneId, setUploadingZoneId] = useState<string | null>(null)

  useEffect(() => {
    const getLocation = async () => {
      try {
        let lat = userLat
        let lon = userLon

        if (!lat || !lon) {
          if (navigator.geolocation) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject)
            })
            lat = position.coords.latitude
            lon = position.coords.longitude
          }
        }

        if (lat && lon) {
          setLocationData({ lat, lon })
        }
      } catch (error) {
        console.error("[v0] Error getting location:", error)
        setLocationData({ lat: 14.8436, lon: 120.3089 })
      }
    }

    getLocation()
  }, [userLat, userLon])

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!locationData) return

      try {
        const response = await fetch(`/api/weather/current?lat=${locationData.lat}&lon=${locationData.lon}`)
        const data = await response.json()
        setWeatherData(data)
      } catch (error) {
        console.error("[v0] Error fetching weather:", error)
      }
    }

    fetchWeatherData()
  }, [locationData])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const getAllFloodZones = (): FloodZone[] => {
    if (!locationData) return []

    const evacuationData = getEvacuationDataForLocation(locationData.lat, locationData.lon)
    setCurrentCity(evacuationData.city)

    const allZones: FloodZone[] = evacuationData.floodZones.map((zone) => ({
      ...zone,
      distance: calculateDistance(locationData.lat, locationData.lon, zone.coordinates[0], zone.coordinates[1]),
      mapImage: zoneMapImages[zone.id],
    }))

    return allZones.sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }

  const getAllSafeRoutes = (): SafeRoute[] => {
    if (!locationData) return []

    const evacuationData = getEvacuationDataForLocation(locationData.lat, locationData.lon)
    return evacuationData.safeRoutes
  }

  const getAllEvacuationCenters = (): EvacuationCenter[] => {
    if (!locationData) return []

    const evacuationData = getEvacuationDataForLocation(locationData.lat, locationData.lon)

    const allCenters: EvacuationCenter[] = evacuationData.evacuationCenters.map((center) => ({
      ...center,
      distance: calculateDistance(locationData.lat, locationData.lon, center.coordinates[0], center.coordinates[1]),
    }))

    return allCenters.sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }

  useEffect(() => {
    if (locationData) {
      const floodZones = getAllFloodZones()
      const safeRoutes = getAllSafeRoutes()
      const evacuationCenters = getAllEvacuationCenters()

      setNearbyZones(floodZones)
      setNearbyRoutes(safeRoutes)
      setNearbyCenters(evacuationCenters)
      setLoading(false)
    }
  }, [locationData])

  useEffect(() => {
    if (weatherData && nearbyZones.length > 0) {
      const highRiskZones = nearbyZones.filter((z) => z.riskLevel === "high").length
      const totalAffected = nearbyZones.reduce((sum, z) => sum + z.affectedPopulation, 0)

      setRiskAssessment({
        overallRisk:
          weatherData.windSpeed > 60 || weatherData.humidity > 80
            ? "high"
            : weatherData.windSpeed > 40
              ? "medium"
              : "low",
        affectedPopulation: totalAffected,
        highRiskZones: highRiskZones,
        rainfall: weatherData.humidity || 0,
        windSpeed: weatherData.windSpeed || 0,
      })
    }
  }, [weatherData, nearbyZones])

  const handleMapImageUpload = (zoneId: string, file: File) => {
    setUploadingZoneId(zoneId)
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      setZoneMapImages((prev) => ({
        ...prev,
        [zoneId]: imageData,
      }))
      setUploadingZoneId(null)
    }
    reader.readAsDataURL(file)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "medium":
        return <TrendingUp className="h-4 w-4" />
      case "low":
        return <Shield className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading evacuation map for your location...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Risk Assessment Overview */}
      {riskAssessment && (
        <Card className="border-l-4 border-l-primary bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-muted-foreground mb-1">Overall Risk</p>
                <Badge className={`${getRiskColor(riskAssessment.overallRisk)}`}>
                  {riskAssessment.overallRisk.toUpperCase()}
                </Badge>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-muted-foreground mb-1">Wind Speed</p>
                <div className="flex items-center gap-1">
                  <Wind className="h-4 w-4 text-cyan-500" />
                  <span className="font-semibold">{riskAssessment.windSpeed}km/h</span>
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-muted-foreground mb-1">Humidity</p>
                <div className="flex items-center gap-1">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">{riskAssessment.rainfall}%</span>
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-muted-foreground mb-1">At Risk</p>
                <span className="font-semibold text-lg">{(riskAssessment.affectedPopulation / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization - Takes 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Interactive Evacuation Map
                  </CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activeLayer === "flood" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLayer("flood")}
                    className="text-xs"
                  >
                    <Droplets className="h-3 w-3 mr-1" />
                    Flood Zones
                  </Button>
                  <Button
                    variant={activeLayer === "routes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLayer("routes")}
                    className="text-xs"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Routes
                  </Button>
                  <Button
                    variant={activeLayer === "centers" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLayer("centers")}
                    className="text-xs"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Centers
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Map Container */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg h-96 mb-6 flex items-center justify-center border border-slate-700/50 relative overflow-hidden">
                {/* Map Background with Grid */}
                <div className="absolute inset-0 opacity-5">
                  <div className="grid grid-cols-6 grid-rows-4 h-full w-full">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border border-primary/20" />
                    ))}
                  </div>
                </div>

                {/* Flood Zones Layer */}
                {activeLayer === "flood" && (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="space-y-4 w-full max-w-4xl">
                      <p className="text-center text-sm font-semibold text-foreground mb-4">Flood-Prone Areas Near You</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {nearbyZones.slice(0, 6).map((zone) => (
                          <div
                            key={zone.id}
                            onClick={() => setSelectedZone(zone)}
                            className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ${getRiskColor(zone.riskLevel)} border-2`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {getRiskIcon(zone.riskLevel)}
                              <span className="font-semibold text-sm">{zone.name}</span>
                            </div>
                            <p className="text-xs opacity-75">{zone.area}</p>
                            {zone.distance && <p className="text-xs opacity-75">{zone.distance.toFixed(1)}km away</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Safe Routes Layer */}
                {activeLayer === "routes" && (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="space-y-3 w-full max-w-2xl">
                      <p className="text-center text-sm font-semibold text-foreground mb-4">Safe Evacuation Routes</p>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {nearbyRoutes.map((route) => (
                          <div key={route.id} className="bg-slate-800/80 p-3 rounded-lg border-l-4 border-green-500">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{route.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {route.from} → {route.to}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs w-fit">
                                {route.estimatedTime}min
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                <span>{route.distance}km</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Evacuation Centers Layer */}
                {activeLayer === "centers" && (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="space-y-3 w-full max-w-2xl">
                      <p className="text-center text-sm font-semibold text-foreground mb-4">Nearest Evacuation Centers</p>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {nearbyCenters.map((center) => {
                          const occupancyPercent = (center.currentOccupancy / center.capacity) * 100
                          return (
                            <div key={center.id} className="bg-slate-800/80 p-3 rounded-lg border-l-4 border-purple-500">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{center.name}</p>
                                  <p className="text-xs text-muted-foreground">{center.address}</p>
                                  {center.distance && (
                                    <p className="text-xs text-muted-foreground">{center.distance.toFixed(1)}km away</p>
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-xs w-fit ${occupancyPercent > 80 ? "bg-red-100 text-red-800" : occupancyPercent > 50 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                                >
                                  {occupancyPercent.toFixed(0)}%
                                </Badge>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${occupancyPercent > 80 ? "bg-red-500" : occupancyPercent > 50 ? "bg-yellow-500" : "bg-green-500"}`}
                                  style={{ width: `${occupancyPercent}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {center.currentOccupancy} / {center.capacity} people
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Zone Details */}
              {selectedZone && (
                <Card className="bg-slate-800/50 border-l-4 border-l-primary border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getRiskIcon(selectedZone.riskLevel)}
                        {selectedZone.name}
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedZone(null)} className="h-6 w-6 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Zone Map</label>
                      {zoneMapImages[selectedZone.id] ? (
                        <div className="relative rounded-lg overflow-hidden border border-slate-700/50">
                          <img
                            src={zoneMapImages[selectedZone.id] || "/placeholder.svg"}
                            alt={`${selectedZone.name} map`}
                            className="w-full h-48 object-cover"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0 bg-slate-900/80 hover:bg-slate-800"
                            onClick={() => {
                              setZoneMapImages((prev) => {
                                const newImages = { ...prev }
                                delete newImages[selectedZone.id]
                                return newImages
                              })
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Click to upload map image</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleMapImageUpload(selectedZone.id, file)
                            }}
                            disabled={uploadingZoneId === selectedZone.id}
                          />
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                        <Badge className={getRiskColor(selectedZone.riskLevel)}>
                          {selectedZone.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Area</p>
                        <p className="font-semibold text-sm">{selectedZone.area}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Affected Population</p>
                        <p className="font-semibold text-sm">{(selectedZone.affectedPopulation / 1000).toFixed(1)}K</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Distance</p>
                        <p className="font-semibold text-sm">{selectedZone.distance?.toFixed(1)}km</p>
                      </div>
                    </div>
                    <Button className="w-full" size="sm">
                      <Navigation className="h-4 w-4 mr-2" />
                      View Evacuation Routes
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Takes 1/3 width on large screens */}
        <div className="space-y-6">
          {/* Flood-Prone Areas List */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Droplets className="h-4 w-4 text-blue-500" />
                Nearby Flood Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {nearbyZones.map((zone) => (
                  <div key={zone.id} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className={`p-2 rounded-lg ${getRiskColor(zone.riskLevel)}`}>{getRiskIcon(zone.riskLevel)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{zone.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {zone.area} • {(zone.affectedPopulation / 1000).toFixed(1)}K people
                      </p>
                      {zone.distance && <p className="text-xs text-muted-foreground">{zone.distance.toFixed(1)}km away</p>}
                    </div>
                    <Badge className={getRiskColor(zone.riskLevel)}>{zone.riskLevel}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evacuation Centers Status */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-purple-500" />
                Nearby Centers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {nearbyCenters.map((center) => {
                  const occupancyPercent = (center.currentOccupancy / center.capacity) * 100
                  return (
                    <div key={center.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{center.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{center.address}</p>
                          {center.distance && (
                            <p className="text-xs text-muted-foreground font-semibold text-blue-600">
                              {center.distance.toFixed(1)}km away
                            </p>
                          )}
                        </div>
                        <Badge
                          className={`text-xs ${occupancyPercent > 80 ? "bg-red-100 text-red-800" : occupancyPercent > 50 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                        >
                          {occupancyPercent.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${occupancyPercent > 80 ? "bg-red-500" : occupancyPercent > 50 ? "bg-yellow-500" : "bg-green-500"}`}
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {center.currentOccupancy} / {center.capacity} people
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Width Sections */}
      <div className="space-y-6">
        {/* Safe Routes List */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-green-500" />
              Safe Evacuation Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nearbyRoutes.map((route) => (
                <div key={route.id} className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1">{route.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {route.from} → {route.to}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {route.estimatedTime}min
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      <span>{route.distance}km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{route.hazards.length} hazards</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {route.hazards.map((hazard, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-yellow-50">
                        {hazard}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Map Legend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded" />
                <span>High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded" />
                <span>Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded" />
                <span>Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-l-4 border-green-500 bg-white" />
                <span>Safe Route</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-l-4 border-purple-500 bg-white" />
                <span>Evac Center</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-l-4 border-blue-500 bg-white" />
                <span>Hospital</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}