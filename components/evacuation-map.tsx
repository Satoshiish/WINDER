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
  TrendingUp,
  Loader2,
  Users,
  Clock,
  Route,
  Building,
  ArrowLeft,
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
  description?: string
  lastUpdated?: string
}

interface SafeRoute {
  id: string
  name: string
  from: string
  to: string
  distance: number
  estimatedTime: number
  hazards: string[]
  status: "clear" | "congested" | "blocked"
}

interface EvacuationCenter {
  id: string
  name: string
  capacity: number
  currentOccupancy: number
  coordinates: [number, number]
  address: string
  distance?: number
  image?: string
  facilities: string[]
  contact: string
}

interface EvacuationMapProps {
  userLat?: number
  userLon?: number
}

export function EvacuationMap({ userLat, userLon }: EvacuationMapProps) {
  const [selectedZone, setSelectedZone] = useState<FloodZone | null>(null)
  const [selectedCenter, setSelectedCenter] = useState<EvacuationCenter | null>(null)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [riskAssessment, setRiskAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [locationData, setLocationData] = useState<{ lat: number; lon: number } | null>(null)
  const [nearbyZones, setNearbyZones] = useState<FloodZone[]>([])
  const [nearbyRoutes, setNearbyRoutes] = useState<SafeRoute[]>([])
  const [nearbyCenters, setNearbyCenters] = useState<EvacuationCenter[]>([])

  const zoneMapImages = {
    "olongapo-1": "/barretto-district-flood-map-evacuation-routes.jpg",
    "olongapo-2": "/kalaklan-district-flood-map-evacuation-routes.jpg",
    "olongapo-3": "/mabayuan-district-flood-map-evacuation-routes.jpg",
    "olongapo-4": "/gordon-heights-flood-map-evacuation-routes.jpg",
    "olongapo-5": "/sta-rita-district-flood-map-evacuation-routes.jpg",
    "manila-1": "/binondo-district-flood-map-evacuation-routes.jpg",
    "manila-2": "/tondo-district-flood-map-evacuation-routes.jpg",
    "manila-3": "/quiapo-district-flood-map-evacuation-routes.jpg",
    "manila-4": "/ermita-district-flood-map-evacuation-routes.jpg",
    "manila-5": "/malate-district-flood-map-evacuation-routes.jpg",
    "cebu-1": "/pardo-district-flood-map-evacuation-routes.jpg",
    "cebu-2": "/mabolo-district-flood-map-evacuation-routes.jpg",
    "cebu-3": "/lahug-district-flood-map-evacuation-routes.jpg",
  }

  const centerImages = {
    "center-1": "/api/placeholder/400/200?text=Evacuation+Center",
    "center-2": "/api/placeholder/400/200?text=Evacuation+Center",
    "center-3": "/api/placeholder/400/200?text=Evacuation+Center",
    "center-4": "/api/placeholder/400/200?text=Evacuation+Center",
  }

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
        console.error("Error getting location:", error)
        setLocationData({ lat: 14.5995, lon: 120.9842 })
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
        console.error("Error fetching weather:", error)
        setWeatherData({
          windSpeed: 45,
          humidity: 75,
          temperature: 28,
        })
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

    const allZones: FloodZone[] = evacuationData.floodZones.map((zone) => ({
      ...zone,
      distance: calculateDistance(locationData.lat, locationData.lon, zone.coordinates[0], zone.coordinates[1]),
      mapImage: zoneMapImages[zone.id as keyof typeof zoneMapImages],
      lastUpdated: "2024-01-15",
    }))

    return allZones.sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }

  const getAllSafeRoutes = (): SafeRoute[] => {
    if (!locationData) return []

    const evacuationData = getEvacuationDataForLocation(locationData.lat, locationData.lon)
    return evacuationData.safeRoutes.map((route) => ({
      ...route,
      status: "clear" as const,
    }))
  }

  const getAllEvacuationCenters = (): EvacuationCenter[] => {
    if (!locationData) return []

    const evacuationData = getEvacuationDataForLocation(locationData.lat, locationData.lon)

    const allCenters: EvacuationCenter[] = evacuationData.evacuationCenters.map((center) => ({
      ...center,
      distance: calculateDistance(locationData.lat, locationData.lon, center.coordinates[0], center.coordinates[1]),
      image: centerImages[center.id as keyof typeof centerImages],
      facilities: ["Medical", "Food", "Shelter", "Sanitation"],
      contact: "+63 912 345 6789",
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

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-500/20 text-red-600 border-red-300"
      case "medium":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-300"
      case "low":
        return "bg-green-500/20 text-green-600 border-green-300"
      default:
        return "bg-gray-500/20 text-gray-600"
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

  const getRouteStatusColor = (status: string) => {
    switch (status) {
      case "clear":
        return "bg-green-500/20 text-green-600"
      case "congested":
        return "bg-yellow-500/20 text-yellow-600"
      case "blocked":
        return "bg-red-500/20 text-red-600"
      default:
        return "bg-gray-500/20 text-gray-600"
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

  if (selectedZone) {
    return (
      <div className="space-y-6 p-4">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => setSelectedZone(null)}
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Flood Zones
        </Button>

        {/* Zone Details Card */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getRiskColor(selectedZone.riskLevel)}`}>
                  {getRiskIcon(selectedZone.riskLevel)}
                </div>
                <div>
                  <CardTitle className="text-white text-lg">{selectedZone.name}</CardTitle>
                  <p className="text-slate-300 text-sm">{selectedZone.area}</p>
                </div>
              </div>
              <Badge className={getRiskColor(selectedZone.riskLevel)}>
                {selectedZone.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hardcoded Map Image */}
            {selectedZone.mapImage && (
              <div className="rounded-lg overflow-hidden border border-slate-600">
                <img
                  src={selectedZone.mapImage || "/placeholder.svg"}
                  alt={`${selectedZone.name} evacuation map`}
                  className="w-full h-96 object-cover"
                />
              </div>
            )}

            {/* Zone Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-300 text-sm">Affected Population</p>
                <p className="text-white font-semibold text-lg">
                  {(selectedZone.affectedPopulation / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-300 text-sm">Area Size</p>
                <p className="text-white font-semibold text-lg">{selectedZone.area}</p>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-300 text-sm">Distance</p>
                <p className="text-white font-semibold text-lg">{selectedZone.distance?.toFixed(1)}km</p>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-300 text-sm">Last Updated</p>
                <p className="text-white font-semibold text-sm">{selectedZone.lastUpdated}</p>
              </div>
            </div>

            {/* Evacuation Routes for this Zone */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Route className="h-5 w-5 text-blue-400" />
                Evacuation Routes from {selectedZone.name}
              </h3>
              <div className="space-y-3">
                {nearbyRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-green-400 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white text-sm">{route.name}</h4>
                        <p className="text-slate-300 text-xs">
                          {route.from} → {route.to}
                        </p>
                      </div>
                      <Badge className={getRouteStatusColor(route.status)}>{route.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{route.estimatedTime} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        <span>{route.distance}km</span>
                      </div>
                    </div>
                    {route.hazards.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {route.hazards.map((hazard, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-orange-500/20 text-orange-400 border-orange-400 text-xs"
                          >
                            {hazard}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Evacuation Centers */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-400" />
                Nearby Evacuation Centers
              </h3>
              <div className="space-y-3">
                {nearbyCenters.slice(0, 3).map((center) => {
                  const occupancyPercent = (center.currentOccupancy / center.capacity) * 100
                  return (
                    <div key={center.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white text-sm">{center.name}</h4>
                          <p className="text-slate-300 text-xs">{center.address}</p>
                        </div>
                        <Badge
                          className={`text-xs ${
                            occupancyPercent > 80
                              ? "bg-red-500/20 text-red-400"
                              : occupancyPercent > 50
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {occupancyPercent.toFixed(0)}% full
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            occupancyPercent > 80
                              ? "bg-red-400"
                              : occupancyPercent > 50
                                ? "bg-yellow-400"
                                : "bg-green-400"
                          }`}
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-300 mt-2">
                        {center.currentOccupancy} / {center.capacity} people • {center.distance?.toFixed(1)}km away
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Risk Assessment Overview */}
      {riskAssessment && (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-white mb-2">Risk Assessment</h3>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getRiskColor(riskAssessment.overallRisk)}`}>
                    {getRiskIcon(riskAssessment.overallRisk)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">Overall Risk: {riskAssessment.overallRisk.toUpperCase()}</p>
                    <p className="text-slate-300 text-sm">{riskAssessment.highRiskZones} high risk zones detected</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-300 mb-1">Wind Speed</p>
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-cyan-400" />
                  <span className="font-semibold text-white">{riskAssessment.windSpeed}km/h</span>
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-300 mb-1">Humidity</p>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-400" />
                  <span className="font-semibold text-white">{riskAssessment.rainfall}%</span>
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-300 mb-1">At Risk</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-400" />
                  <span className="font-semibold text-white">
                    {(riskAssessment.affectedPopulation / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flood Zones Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
          Flood-Prone Areas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nearbyZones.map((zone) => (
            <div
              key={zone.id}
              onClick={() => setSelectedZone(zone)}
              className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-105 border-2 ${getRiskColor(zone.riskLevel)} backdrop-blur-sm bg-gradient-to-r from-slate-800/50 to-slate-700/50`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${getRiskColor(zone.riskLevel)}`}>{getRiskIcon(zone.riskLevel)}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-white">{zone.name}</h4>
                  <p className="text-xs opacity-75 text-slate-300">{zone.area}</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {(zone.affectedPopulation / 1000).toFixed(1)}K people
                </span>
                {zone.distance && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {zone.distance.toFixed(1)}km away
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Evacuation Centers */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
          Nearby Evacuation Centers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nearbyCenters.map((center) => {
            const occupancyPercent = (center.currentOccupancy / center.capacity) * 100
            return (
              <div
                key={center.id}
                className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 p-4 rounded-lg border border-slate-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">{center.name}</h4>
                    <p className="text-slate-300 text-xs line-clamp-2">{center.address}</p>
                  </div>
                  <Badge
                    className={`text-xs ${
                      occupancyPercent > 80
                        ? "bg-red-500/20 text-red-400"
                        : occupancyPercent > 50
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {occupancyPercent.toFixed(0)}%
                  </Badge>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      occupancyPercent > 80 ? "bg-red-400" : occupancyPercent > 50 ? "bg-yellow-400" : "bg-green-400"
                    }`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
                <p className="text-slate-400 text-xs">
                  {center.currentOccupancy}/{center.capacity} • {center.distance?.toFixed(1)}km
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
