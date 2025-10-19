"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  MessageSquare,
  MapPin,
  Clock,
  Plus,
  Map,
  List,
  Send,
  AlertTriangle,
  Droplets,
  Mountain,
  Car,
  Zap,
  Users,
} from "lucide-react"

interface Report {
  id: string
  type: "flood" | "landslide" | "blocked_road" | "power_outage" | "other"
  title: string
  description: string
  location: {
    address: string
    coordinates: [number, number]
  }
  timestamp: Date
  reporter: string
  severity: "low" | "moderate" | "high"
  verified: boolean
  imageUrl?: string
}

type ViewMode = "list" | "map"
type FilterType = "all" | "flood" | "landslide" | "blocked_road" | "power_outage" | "other"

export default function ReportsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [filter, setFilter] = useState<FilterType>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [language, setLanguage] = useState<"en" | "tl">("en")
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // New report form state
  const [newReport, setNewReport] = useState({
    type: "flood" as const,
    title: "",
    description: "",
    location: "",
    severity: "moderate" as const,
  })

  const translations = {
    en: {
      title: "Community Reports",
      subtitle: "Share and view hazard reports",
      createReport: "Create Report",
      viewList: "List View",
      viewMap: "Map View",
      filterAll: "All Reports",
      filterFlood: "Flood",
      filterLandslide: "Landslide",
      filterRoad: "Blocked Roads",
      filterPower: "Power Outage",
      filterOther: "Other",
      reportType: "Report Type",
      reportTitle: "Title",
      reportDescription: "Description",
      reportLocation: "Location",
      severity: "Severity",
      low: "Low",
      moderate: "Moderate",
      high: "High",
      submit: "Submit Report",
      cancel: "Cancel",
      verified: "Verified",
      unverified: "Unverified",
      ago: "ago",
      now: "now",
      minutes: "minutes",
      hours: "hours",
      days: "days",
    },
    tl: {
      title: "Mga Ulat ng Komunidad",
      subtitle: "Magbahagi at tingnan ang mga ulat ng panganib",
      createReport: "Gumawa ng Ulat",
      viewList: "Listahan",
      viewMap: "Mapa",
      filterAll: "Lahat ng Ulat",
      filterFlood: "Baha",
      filterLandslide: "Landslide",
      filterRoad: "Naharang na Daan",
      filterPower: "Walang Kuryente",
      filterOther: "Iba pa",
      reportType: "Uri ng Ulat",
      reportTitle: "Pamagat",
      reportDescription: "Paglalarawan",
      reportLocation: "Lokasyon",
      severity: "Kalubhaan",
      low: "Mababa",
      moderate: "Katamtaman",
      high: "Mataas",
      submit: "Ipadala ang Ulat",
      cancel: "Kanselahin",
      verified: "Napatunayan",
      unverified: "Hindi pa napatunayan",
      ago: "nakaraan",
      now: "ngayon",
      minutes: "minuto",
      hours: "oras",
      days: "araw",
    },
  }

  const t = translations[language]

  const reportTypes = [
    { value: "flood", label: "Flood / Baha", icon: Droplets, color: "bg-blue-500" },
    { value: "landslide", label: "Landslide", icon: Mountain, color: "bg-amber-600" },
    { value: "blocked_road", label: "Blocked Road / Naharang na Daan", icon: Car, color: "bg-red-500" },
    { value: "power_outage", label: "Power Outage / Walang Kuryente", icon: Zap, color: "bg-yellow-500" },
    { value: "other", label: "Other / Iba pa", icon: AlertTriangle, color: "bg-gray-500" },
  ]

  // Sample reports data
  useEffect(() => {
    const sampleReports: Report[] = [
      {
        id: "1",
        type: "flood",
        title: "Flooding on EDSA Underpass",
        description: "Knee-deep flooding reported at EDSA-Shaw underpass. Traffic heavily affected.",
        location: {
          address: "EDSA-Shaw Underpass, Mandaluyong City",
          coordinates: [14.5764, 121.0851],
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        reporter: "Maria Santos",
        severity: "high",
        verified: true,
      },
      {
        id: "2",
        type: "landslide",
        title: "Small Landslide on Marcos Highway",
        description: "Rocks and debris blocking one lane. Authorities on site clearing the area.",
        location: {
          address: "Marcos Highway, Antipolo City",
          coordinates: [14.5995, 121.1794],
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        reporter: "Juan dela Cruz",
        severity: "moderate",
        verified: true,
      },
      {
        id: "3",
        type: "blocked_road",
        title: "Fallen Tree Blocks Road",
        description: "Large tree fell across the road due to strong winds. No injuries reported.",
        location: {
          address: "Katipunan Avenue, Quezon City",
          coordinates: [14.6417, 121.07],
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        reporter: "Anna Reyes",
        severity: "moderate",
        verified: false,
      },
      {
        id: "4",
        type: "power_outage",
        title: "Power Outage in Barangay 123",
        description: "Entire barangay without electricity since this morning. Meralco notified.",
        location: {
          address: "Barangay 123, Taguig City",
          coordinates: [14.5176, 121.0509],
        },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        reporter: "Pedro Garcia",
        severity: "low",
        verified: false,
      },
    ]
    setReports(sampleReports)
  }, [])

  const filteredReports = reports.filter((report) => filter === "all" || report.type === filter)

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return t.now
    if (diffMins < 60) return `${diffMins} ${t.minutes} ${t.ago}`
    if (diffHours < 24) return `${diffHours} ${t.hours} ${t.ago}`
    return `${diffDays} ${t.days} ${t.ago}`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800"
      case "moderate":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "low":
        return t.low
      case "moderate":
        return t.moderate
      case "high":
        return t.high
      default:
        return t.moderate
    }
  }

  const detectLocation = async () => {
    setIsDetectingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported")
      setIsDetectingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        console.log(`[v0] Report location detected: ${lat}, ${lng}`)

        try {
          const { getBarangayFromCoordinates } = await import("@/lib/barangay-lookup")
          const barangay = await getBarangayFromCoordinates(lat, lng)
          setNewReport({
            ...newReport,
            location: barangay,
          })
        } catch (error) {
          console.error("[v0] Error detecting barangay:", error)
          setNewReport({
            ...newReport,
            location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          })
        }

        setIsDetectingLocation(false)
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        setLocationError("Unable to detect location. Please enter manually.")
        setIsDetectingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const handleSubmitReport = () => {
    if (!newReport.title || !newReport.description) return

    let coordinates: [number, number] = [14.5995, 121.0509] // Fallback

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          coordinates = [position.coords.latitude, position.coords.longitude]
          createReport(coordinates)
        },
        () => {
          // Use fallback if geolocation fails
          createReport(coordinates)
        },
        { enableHighAccuracy: true, timeout: 5000 },
      )
    } else {
      createReport(coordinates)
    }
  }

  const createReport = (coordinates: [number, number]) => {
    const report: Report = {
      id: Date.now().toString(),
      type: newReport.type,
      title: newReport.title,
      description: newReport.description,
      location: {
        address: newReport.location,
        coordinates,
      },
      timestamp: new Date(),
      reporter: "Current User",
      severity: newReport.severity,
      verified: false,
    }

    setReports([report, ...reports])
    setNewReport({
      type: "flood",
      title: "",
      description: "",
      location: "",
      severity: "moderate",
    })
    setShowCreateForm(false)
  }

  const renderCreateForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t.createReport}</span>
          <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">{t.reportType}</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {reportTypes.slice(0, 4).map((type) => (
              <Button
                key={type.value}
                variant={newReport.type === type.value ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2 h-auto p-3"
                onClick={() => setNewReport({ ...newReport, type: type.value as any })}
              >
                <type.icon className="h-4 w-4" />
                <span className="text-xs">{type.label.split(" / ")[0]}</span>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="title">{t.reportTitle}</Label>
          <Input
            id="title"
            value={newReport.title}
            onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
            placeholder="Brief description of the hazard"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">{t.reportDescription}</Label>
          <Textarea
            id="description"
            value={newReport.description}
            onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
            placeholder="Detailed description of the situation"
            className="mt-1 min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="location" className="flex items-center justify-between">
            <span>{t.reportLocation}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className="text-xs h-6 px-2"
            >
              {isDetectingLocation ? "Detecting..." : "Detect Location"}
            </Button>
          </Label>
          <Input
            id="location"
            value={newReport.location}
            onChange={(e) => setNewReport({ ...newReport, location: e.target.value })}
            placeholder="Street, Barangay, City"
            className="mt-1"
          />
          {locationError && <p className="text-xs text-red-500 mt-1">{locationError}</p>}
        </div>

        <div>
          <Label className="text-sm font-medium">{t.severity}</Label>
          <div className="flex gap-2 mt-2">
            {["low", "moderate", "high"].map((severity) => (
              <Button
                key={severity}
                variant={newReport.severity === severity ? "default" : "outline"}
                size="sm"
                onClick={() => setNewReport({ ...newReport, severity: severity as any })}
                className={`${newReport.severity === severity ? getSeverityColor(severity) : ""}`}
              >
                {getSeverityLabel(severity)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmitReport} className="flex-1" disabled={!newReport.title || !newReport.description}>
            <Send className="h-4 w-4 mr-2" />
            {t.submit}
          </Button>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            {t.cancel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderReportCard = (report: Report) => {
    const reportType = reportTypes.find((type) => type.value === report.type)
    const IconComponent = reportType?.icon || AlertTriangle

    return (
      <Card key={report.id} className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${reportType?.color || "bg-gray-500"}`}>
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm leading-tight">{report.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className={getSeverityColor(report.severity)}>
                    {getSeverityLabel(report.severity)}
                  </Badge>
                  {report.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{report.description}</p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{report.location.address}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{getTimeAgo(report.timestamp)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">By {report.reporter}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Confirm
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
            <MessageSquare className="h-8 w-8" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md lg:max-w-4xl">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02]"
                >
                  <List className="h-4 w-4 mr-1" />
                  {t.viewList}
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02]"
                >
                  <Map className="h-4 w-4 mr-1" />
                  {t.viewMap}
                </Button>
              </div>

              <Button
                onClick={() => setShowCreateForm(true)}
                size="sm"
                className="transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.createReport}
              </Button>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className="whitespace-nowrap transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02]"
              >
                {t.filterAll}
              </Button>
              {reportTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={filter === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(type.value as FilterType)}
                  className="whitespace-nowrap flex items-center gap-1 transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02]"
                >
                  <type.icon className="h-3 w-3" />
                  {type.label.split(" / ")[0]}
                </Button>
              ))}
            </div>

            {/* Create Report Form */}
            {showCreateForm && renderCreateForm()}

            {viewMode === "list" && (
              <div className="lg:grid lg:grid-cols-2 lg:gap-4">
                {filteredReports.length === 0 ? (
                  <Card className="lg:col-span-2 transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground font-body">No reports found for this filter.</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredReports.map((report) => (
                    <div key={report.id} className="mb-4 lg:mb-0">
                      {renderReportCard(report)}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Map View Placeholder */}
            {viewMode === "map" && (
              <Card className="transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
                <CardContent className="p-8 text-center">
                  <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4 font-body">Interactive map view coming soon</p>
                  <p className="text-sm text-muted-foreground font-body">
                    This will show all reports plotted on a map with their exact locations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <Card className="transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg font-sans">Report Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body">Total Reports</span>
                  <Badge variant="secondary">{reports.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body">Verified</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {reports.filter((r) => r.verified).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body">High Priority</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {reports.filter((r) => r.severity === "high").length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
