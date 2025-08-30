"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Map,
  MapPin,
  Search,
  Navigation,
  Phone,
  Clock,
  Star,
  Hospital,
  Shield,
  Building2,
  Users,
  Zap,
} from "lucide-react"

interface Resource {
  id: string
  name: string
  type: "hospital" | "evacuation" | "relief" | "fire_station" | "police"
  address: string
  coordinates: [number, number]
  phone: string
  hours: string
  capacity?: number
  services: string[]
  distance: number
  rating: number
  status: "open" | "closed" | "full" | "limited"
}

type FilterType = "all" | "hospital" | "evacuation" | "relief" | "fire_station" | "police"

export default function MapPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [language, setLanguage] = useState<"en" | "tl">("en")

  const translations = {
    en: {
      title: "Emergency Resources",
      subtitle: "Find nearby help and facilities",
      searchPlaceholder: "Search for resources...",
      filterAll: "All",
      filterHospital: "Hospitals",
      filterEvacuation: "Evacuation",
      filterRelief: "Relief Centers",
      filterFire: "Fire Stations",
      filterPolice: "Police",
      open: "Open",
      closed: "Closed",
      full: "Full",
      limited: "Limited",
      capacity: "Capacity",
      services: "Services",
      hours: "Hours",
      distance: "Distance",
      rating: "Rating",
      getDirections: "Get Directions",
      callNow: "Call Now",
      viewDetails: "View Details",
      nearbyResources: "Nearby Resources",
      kmAway: "km away",
      available: "Available",
      unavailable: "Unavailable",
    },
    tl: {
      title: "Mga Emergency Resources",
      subtitle: "Maghanap ng malapit na tulong at pasilidad",
      searchPlaceholder: "Maghanap ng resources...",
      filterAll: "Lahat",
      filterHospital: "Mga Ospital",
      filterEvacuation: "Evacuation",
      filterRelief: "Relief Centers",
      filterFire: "Fire Stations",
      filterPolice: "Pulis",
      open: "Bukas",
      closed: "Sarado",
      full: "Puno",
      limited: "Limitado",
      capacity: "Kapasidad",
      services: "Mga Serbisyo",
      hours: "Oras",
      distance: "Layo",
      rating: "Rating",
      getDirections: "Kumuha ng Directions",
      callNow: "Tumawag Ngayon",
      viewDetails: "Tingnan ang Detalye",
      nearbyResources: "Malapit na Resources",
      kmAway: "km ang layo",
      available: "Available",
      unavailable: "Hindi Available",
    },
  }

  const t = translations[language]

  const resourceTypes = [
    { value: "all", label: t.filterAll, icon: MapPin, color: "bg-gray-500" },
    { value: "hospital", label: t.filterHospital, icon: Hospital, color: "bg-red-500" },
    { value: "evacuation", label: t.filterEvacuation, icon: Shield, color: "bg-blue-500" },
    { value: "relief", label: t.filterRelief, icon: Building2, color: "bg-green-500" },
    { value: "fire_station", label: t.filterFire, icon: Zap, color: "bg-orange-500" },
    { value: "police", label: t.filterPolice, icon: Users, color: "bg-purple-500" },
  ]

  // Sample resources data
  useEffect(() => {
    const sampleResources: Resource[] = [
      {
        id: "1",
        name: "Philippine General Hospital",
        type: "hospital",
        address: "Taft Avenue, Ermita, Manila",
        coordinates: [14.5764, 121.0851],
        phone: "+63-2-554-8400",
        hours: "24/7",
        capacity: 1500,
        services: ["Emergency Care", "Surgery", "ICU", "Trauma Center"],
        distance: 2.3,
        rating: 4.2,
        status: "open",
      },
      {
        id: "2",
        name: "Rizal Memorial Sports Complex",
        type: "evacuation",
        address: "Pablo Ocampo Sr. Street, Malate, Manila",
        coordinates: [14.5647, 121.0223],
        phone: "+63-2-536-1951",
        hours: "24/7 during emergencies",
        capacity: 5000,
        services: ["Temporary Shelter", "Food Distribution", "Medical Aid"],
        distance: 1.8,
        rating: 4.0,
        status: "open",
      },
      {
        id: "3",
        name: "Manila Fire Station",
        type: "fire_station",
        address: "Quezon Boulevard, Quiapo, Manila",
        coordinates: [14.5995, 120.9842],
        phone: "116",
        hours: "24/7",
        services: ["Fire Response", "Rescue Operations", "Emergency Medical"],
        distance: 3.1,
        rating: 4.5,
        status: "open",
      },
      {
        id: "4",
        name: "Red Cross Manila Chapter",
        type: "relief",
        address: "Bonifacio Drive, Port Area, Manila",
        coordinates: [14.5833, 120.9667],
        phone: "143",
        hours: "8:00 AM - 5:00 PM",
        capacity: 200,
        services: ["Relief Goods", "Blood Bank", "First Aid Training"],
        distance: 4.2,
        rating: 4.3,
        status: "open",
      },
      {
        id: "5",
        name: "Manila Police District",
        type: "police",
        address: "United Nations Avenue, Ermita, Manila",
        coordinates: [14.5833, 121.0167],
        phone: "117",
        hours: "24/7",
        services: ["Emergency Response", "Traffic Control", "Security"],
        distance: 2.7,
        rating: 3.8,
        status: "open",
      },
      {
        id: "6",
        name: "St. Luke's Medical Center",
        type: "hospital",
        address: "279 E. Rodriguez Sr. Avenue, Quezon City",
        coordinates: [14.6042, 121.0122],
        phone: "+63-2-723-0101",
        hours: "24/7",
        capacity: 650,
        services: ["Emergency Care", "Cardiology", "Oncology", "Pediatrics"],
        distance: 5.8,
        rating: 4.6,
        status: "limited",
      },
    ]
    setResources(sampleResources)
  }, [])

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.error("Location error:", error)
          // Default to Manila coordinates
          setUserLocation([14.5995, 120.9842])
        },
      )
    }
  }, [])

  const filteredResources = resources
    .filter((resource) => filter === "all" || resource.type === filter)
    .filter(
      (resource) =>
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.address.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => a.distance - b.distance)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-red-100 text-red-800"
      case "full":
        return "bg-yellow-100 text-yellow-800"
      case "limited":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return t.open
      case "closed":
        return t.closed
      case "full":
        return t.full
      case "limited":
        return t.limited
      default:
        return t.open
    }
  }

  const renderResourceCard = (resource: Resource) => {
    const resourceType = resourceTypes.find((type) => type.value === resource.type)
    const IconComponent = resourceType?.icon || MapPin

    return (
      <Card
        key={resource.id}
        className="mb-4 hover:shadow-md transition-all duration-200 ease-out cursor-pointer hover:scale-[1.02] hover:border-primary/20"
        onClick={() => setSelectedResource(resource)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${resourceType?.color || "bg-gray-500"}`}>
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm leading-tight">{resource.name}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className={getStatusColor(resource.status)}>
                    {getStatusLabel(resource.status)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{resource.address}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    <span>
                      {resource.distance} {t.kmAway}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{resource.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{resource.hours}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {resource.services.slice(0, 3).map((service, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
                {resource.services.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{resource.services.length - 3} more
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(`tel:${resource.phone}`)
                  }}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  {t.callNow}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    const url = `https://maps.google.com/maps?daddr=${resource.coordinates[0]},${resource.coordinates[1]}`
                    window.open(url, "_blank")
                  }}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  {t.getDirections}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderResourceDetails = () => {
    if (!selectedResource) return null

    const resourceType = resourceTypes.find((type) => type.value === selectedResource.type)
    const IconComponent = resourceType?.icon || MapPin

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
        <Card className="w-full max-h-[80vh] overflow-y-auto rounded-t-xl rounded-b-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${resourceType?.color || "bg-gray-500"}`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                {selectedResource.name}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedResource(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className={getStatusColor(selectedResource.status)}>
                {getStatusLabel(selectedResource.status)}
              </Badge>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{selectedResource.rating} rating</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{selectedResource.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{selectedResource.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Hours</p>
                  <p className="text-sm text-muted-foreground">{selectedResource.hours}</p>
                </div>
              </div>

              {selectedResource.capacity && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Capacity</p>
                    <p className="text-sm text-muted-foreground">{selectedResource.capacity} people</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {selectedResource.services.map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={() => window.open(`tel:${selectedResource.phone}`)}>
                <Phone className="h-4 w-4 mr-2" />
                {t.callNow}
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  const url = `https://maps.google.com/maps?daddr=${selectedResource.coordinates[0]},${selectedResource.coordinates[1]}`
                  window.open(url, "_blank")
                }}
              >
                <Navigation className="h-4 w-4 mr-2" />
                {t.getDirections}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground p-4 lg:p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-200 ease-out"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold font-sans">{t.title}</h1>
              <p className="text-sm opacity-90 font-body">{t.subtitle}</p>
            </div>
            <Map className="h-8 w-8" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md lg:max-w-4xl">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-all duration-200 ease-out focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {resourceTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={filter === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(type.value as FilterType)}
                  className="whitespace-nowrap flex items-center gap-1 transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02]"
                >
                  <type.icon className="h-3 w-3" />
                  {type.label}
                </Button>
              ))}
            </div>

            <Card className="mb-6 transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
              <CardContent className="p-4">
                <div className="bg-muted rounded-lg h-48 lg:h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Map className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground font-body">Interactive map coming soon</p>
                    <p className="text-xs text-muted-foreground mt-1 font-body">
                      Touch-friendly map with resource pins
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="mb-6 transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg font-sans">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body">Total Resources</span>
                  <Badge variant="secondary">{filteredResources.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body">Open 24/7</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {filteredResources.filter((r) => r.hours.includes("24")).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body">Within 5km</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {filteredResources.filter((r) => r.distance <= 5).length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 font-sans">
            <MapPin className="h-5 w-5" />
            {t.nearbyResources} ({filteredResources.length})
          </h2>

          {filteredResources.length === 0 ? (
            <Card className="transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground font-body">No resources found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="lg:grid lg:grid-cols-2 lg:gap-4">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="lg:mb-0">
                  {renderResourceCard(resource)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resource Details Modal */}
      {renderResourceDetails()}
    </div>
  )
}
