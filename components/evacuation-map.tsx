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
  Users,
  Clock,
  Route,
  Building,
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
  const [activeLayer, setActiveLayer] = useState<"flood" | "routes" | "centers">("flood")
  const [weatherData, setWeatherData] = useState<any>(null)
  const [riskAssessment, setRiskAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [locationData, setLocationData] = useState<{ lat: number; lon: number } | null>(null)
  const [nearbyZones, setNearbyZones] = useState<FloodZone[]>([])
  const [nearbyRoutes, setNearbyRoutes] = useState<SafeRoute[]>([])
  const [nearbyCenters, setNearbyCenters] = useState<EvacuationCenter[]>([])

  // Sample images for demonstration
  const zoneImages = {
    "zone-1": "/api/placeholder/400/200?text=Marikina+River+Basin",
    "zone-2": "/api/placeholder/400/200?text=Pasig+River+Area",
    "zone-3": "/api/placeholder/400/200?text=Tullahan+River",
    "zone-4": "/api/placeholder/400/200?text=Malabon+Area",
    "zone-5": "/api/placeholder/400/200?text=Navotas+Coastal",
  }

  const centerImages = {
    "center-1": "/api/placeholder/400/200?text=Marikina+Sports+Center",
    "center-2": "/api/placeholder/400/200?text=Pasig+City+Hall",
    "center-3": "/api/placeholder/400/200?text=Quezon+Memorial",
    "center-4": "/api/placeholder/400/200?text=Malabon+Elementary",
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
        setLocationData({ lat: 14.5995, lon: 120.9842 }) // Default to Manila
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
        // Fallback weather data
        setWeatherData({
          windSpeed: 45,
          humidity: 75,
          temperature: 28
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
      mapImage: zoneImages[zone.id as keyof typeof zoneImages],
      lastUpdated: "2024-01-15",
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
                  <span className="font-semibold text-white">{(riskAssessment.affectedPopulation / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Map and Details */}
        <div className="xl:col-span-2 space-y-6">
          {/* Interactive Map */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full" />
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-400" />
                    Interactive Evacuation Map
                  </CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activeLayer === "flood" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLayer("flood")}
                    className="text-xs border-slate-600"
                  >
                    <Droplets className="h-3 w-3 mr-1" />
                    Flood Zones
                  </Button>
                  <Button
                    variant={activeLayer === "routes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLayer("routes")}
                    className="text-xs border-slate-600"
                  >
                    <Route className="h-3 w-3 mr-1" />
                    Routes
                  </Button>
                  <Button
                    variant={activeLayer === "centers" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLayer("centers")}
                    className="text-xs border-slate-600"
                  >
                    <Building className="h-3 w-3 mr-1" />
                    Centers
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Map Visualization */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl h-96 border border-slate-600 relative overflow-hidden">
                {/* Map Grid Background */}
                <div className="absolute inset-0 opacity-10">
                  <div className="grid grid-cols-8 grid-rows-4 h-full w-full">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div key={i} className="border border-blue-300/20" />
                    ))}
                  </div>
                </div>

                {/* Flood Zones Layer */}
                {activeLayer === "flood" && (
                  <div className="absolute inset-0 p-6">
                    <div className="h-full flex flex-col">
                      <h3 className="text-white font-semibold mb-4 text-center">Flood-Prone Areas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
                        {nearbyZones.slice(0, 4).map((zone) => (
                          <div
                            key={zone.id}
                            onClick={() => setSelectedZone(zone)}
                            className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-105 border-2 ${getRiskColor(zone.riskLevel)} backdrop-blur-sm`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${getRiskColor(zone.riskLevel)}`}>
                                {getRiskIcon(zone.riskLevel)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">{zone.name}</h4>
                                <p className="text-xs opacity-75">{zone.area}</p>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>{(zone.affectedPopulation / 1000).toFixed(1)}K people</span>
                              {zone.distance && <span>{zone.distance.toFixed(1)}km away</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Safe Routes Layer */}
                {activeLayer === "routes" && (
                  <div className="absolute inset-0 p-6">
                    <div className="h-full flex flex-col">
                      <h3 className="text-white font-semibold mb-4 text-center">Safe Evacuation Routes</h3>
                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {nearbyRoutes.map((route) => (
                          <div key={route.id} className="bg-slate-700/50 p-4 rounded-lg border-l-4 border-green-400 backdrop-blur-sm">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-white text-sm">{route.name}</h4>
                                <p className="text-slate-300 text-xs">
                                  {route.from} → {route.to}
                                </p>
                              </div>
                              <Badge className={getRouteStatusColor(route.status)}>
                                {route.status}
                              </Badge>
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
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Evacuation Centers Layer */}
                {activeLayer === "centers" && (
                  <div className="absolute inset-0 p-6">
                    <div className="h-full flex flex-col">
                      <h3 className="text-white font-semibold mb-4 text-center">Evacuation Centers</h3>
                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {nearbyCenters.map((center) => {
                          const occupancyPercent = (center.currentOccupancy / center.capacity) * 100
                          return (
                            <div 
                              key={center.id}
                              onClick={() => setSelectedCenter(center)}
                              className="bg-slate-700/50 p-4 rounded-lg border-l-4 border-purple-400 backdrop-blur-sm cursor-pointer hover:scale-105 transition-all"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-white text-sm">{center.name}</h4>
                                  <p className="text-slate-300 text-xs">{center.address}</p>
                                </div>
                                <Badge className={`text-xs ${
                                  occupancyPercent > 80 ? "bg-red-500/20 text-red-400" : 
                                  occupancyPercent > 50 ? "bg-yellow-500/20 text-yellow-400" : 
                                  "bg-green-500/20 text-green-400"
                                }`}>
                                  {occupancyPercent.toFixed(0)}% full
                                </Badge>
                              </div>
                              <div className="w-full bg-slate-600 rounded-full h-2 mb-1">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    occupancyPercent > 80 ? "bg-red-400" : 
                                    occupancyPercent > 50 ? "bg-yellow-400" : 
                                    "bg-green-400"
                                  }`}
                                  style={{ width: `${occupancyPercent}%` }}
                                />
                              </div>
                              <p className="text-xs text-slate-300">
                                {center.currentOccupancy} / {center.capacity} people • {center.distance?.toFixed(1)}km away
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Item Details */}
          {(selectedZone || selectedCenter) && (
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                {selectedZone && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getRiskColor(selectedZone.riskLevel)}`}>
                          {getRiskIcon(selectedZone.riskLevel)}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{selectedZone.name}</h3>
                          <p className="text-slate-300 text-sm">{selectedZone.area}</p>
                        </div>
                      </div>
                      <Badge className={getRiskColor(selectedZone.riskLevel)}>
                        {selectedZone.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>

                    {selectedZone.mapImage && (
                      <div className="rounded-lg overflow-hidden border border-slate-600">
                        <img
                          src={selectedZone.mapImage}
                          alt={`${selectedZone.name} area map`}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-300 text-sm">Affected</p>
                        <p className="text-white font-semibold">{(selectedZone.affectedPopulation / 1000).toFixed(1)}K</p>
                      </div>
                      <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-300 text-sm">Distance</p>
                        <p className="text-white font-semibold">{selectedZone.distance?.toFixed(1)}km</p>
                      </div>
                      <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-300 text-sm">Last Updated</p>
                        <p className="text-white font-semibold text-sm">{selectedZone.lastUpdated}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-300 text-sm">Status</p>
                        <p className="text-white font-semibold">Active</p>
                      </div>
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Navigation className="h-4 w-4 mr-2" />
                      View Evacuation Routes from this Area
                    </Button>
                  </div>
                )}

                {selectedCenter && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Building className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{selectedCenter.name}</h3>
                          <p className="text-slate-300 text-sm">{selectedCenter.address}</p>
                        </div>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400">
                        {((selectedCenter.currentOccupancy / selectedCenter.capacity) * 100).toFixed(0)}% Full
                      </Badge>
                    </div>

                    {selectedCenter.image && (
                      <div className="rounded-lg overflow-hidden border border-slate-600">
                        <img
                          src={selectedCenter.image}
                          alt={`${selectedCenter.name} evacuation center`}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-300 text-sm">Capacity</p>
                        <p className="text-white font-semibold">{selectedCenter.capacity}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-300 text-sm">Current</p>
                        <p className="text-white font-semibold">{selectedCenter.currentOccupancy}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-300 text-sm">Distance</p>
                        <p className="text-white font-semibold">{selectedCenter.distance?.toFixed(1)}km</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-slate-300 text-sm font-medium mb-2">Facilities Available:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCenter.facilities.map((facility, index) => (
                            <Badge key={index} variant="outline" className="bg-green-500/20 text-green-400 border-green-400">
                              {facility}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-300 text-sm font-medium">Contact:</p>
                        <p className="text-white">{selectedCenter.contact}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Navigation className="h-4 w-4 mr-2" />
                        Get Directions
                      </Button>
                      <Button variant="outline" className="border-slate-600">
                        Call Now
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Lists */}
        <div className="space-y-6">
          {/* Flood Zones List */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Droplets className="h-4 w-4 text-blue-400" />
                Nearby Flood Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {nearbyZones.map((zone) => (
                  <div 
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${getRiskColor(zone.riskLevel)}`}>
                      {getRiskIcon(zone.riskLevel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{zone.name}</p>
                      <p className="text-slate-300 text-xs">
                        {zone.area} • {(zone.affectedPopulation / 1000).toFixed(1)}K people
                      </p>
                      {zone.distance && (
                        <p className="text-slate-400 text-xs">{zone.distance.toFixed(1)}km away</p>
                      )}
                    </div>
                    <Badge className={getRiskColor(zone.riskLevel)}>
                      {zone.riskLevel}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evacuation Centers List */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-purple-400" />
                Nearby Centers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {nearbyCenters.map((center) => {
                  const occupancyPercent = (center.currentOccupancy / center.capacity) * 100
                  return (
                    <div 
                      key={center.id}
                      onClick={() => setSelectedCenter(center)}
                      className="p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">{center.name}</p>
                          <p className="text-slate-300 text-xs line-clamp-2">{center.address}</p>
                        </div>
                        <Badge
                          className={`text-xs ${
                            occupancyPercent > 80 ? "bg-red-500/20 text-red-400" : 
                            occupancyPercent > 50 ? "bg-yellow-500/20 text-yellow-400" : 
                            "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {occupancyPercent.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-1.5 mb-1">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            occupancyPercent > 80 ? "bg-red-400" : 
                            occupancyPercent > 50 ? "bg-yellow-400" : 
                            "bg-green-400"
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
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-400" />
                Map Legend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500/20 border-2 border-red-400 rounded" />
                  <span className="text-slate-300">High Risk Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500/20 border-2 border-yellow-400 rounded" />
                  <span className="text-slate-300">Medium Risk Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500/20 border-2 border-green-400 rounded" />
                  <span className="text-slate-300">Low Risk Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-l-4 border-green-400 bg-green-500/20" />
                  <span className="text-slate-300">Safe Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-l-4 border-purple-400 bg-purple-500/20" />
                  <span className="text-slate-300">Evacuation Center</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}