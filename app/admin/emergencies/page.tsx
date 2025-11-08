"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  AlertTriangle,
  Search,
  Globe,
  Clock,
  ArrowLeft,
  Phone,
  Eye,
  RefreshCw,
  Download,
  CheckCircle,
  PlayCircle,
  Users,
  MessageSquare,
  Bell,
  Trash2,
} from "lucide-react"
import {
  loadEmergencyReports,
  updateEmergencyReport,
  deleteEmergencyReport,
  undoDeleteEmergencyReport,
  cleanupOldReports,
  type EmergencyReport,
} from "@/services/emergencyService"
import { formatAddress } from "@/lib/format-address"
import { getBarangayFromCoordinates, formatBarangay } from "@/lib/barangay-lookup"
import { getAllResponseTeams, assignTeamToEmergency, type ResponseTeam } from "@/services/responderService"

const emergencyTypes = [
  { value: "medical", label: "Medical", icon: "🏥", color: "bg-red-500" },
  { value: "fire", label: "Fire", icon: "🔥", color: "bg-orange-500" },
  { value: "crime", label: "Crime", icon: "🚔", color: "bg-purple-500" },
  { value: "natural-disaster", label: "Natural Disaster", icon: "🌊", color: "bg-blue-500" },
  { value: "accident", label: "Accident", icon: "🚗", color: "bg-yellow-500" },
]

export default function EmergencyManagement() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyReport[]>([])
  const [filteredRequests, setFilteredRequests] = useState<EmergencyReport[]>([])
  const [barangayData, setBarangayData] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<EmergencyReport | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [assignTeam, setAssignTeam] = useState("")
  const [lastReportCount, setLastReportCount] = useState(0)
  const [hasNewReports, setHasNewReports] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [isAssigningTeam, setIsAssigningTeam] = useState<string | null>(null)

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    setIsLoadingTeams(true)
    const teams = await getAllResponseTeams()
    setResponseTeams(teams)
    setIsLoadingTeams(false)
  }

  const loadStoredReports = async () => {
    const reports = await loadEmergencyReports()
    console.log("[v0] Loading stored emergency reports:", reports.length, "reports found")

    if (reports.length > lastReportCount && lastReportCount > 0) {
      const newCount = reports.length - lastReportCount
      setHasNewReports(true)

      toast({
        title: "🚨 New Emergency Report!",
        description: `${newCount} new emergency ${newCount === 1 ? "report" : "reports"} received. Click to view.`,
        variant: "destructive",
        duration: 10000,
      })

      if (typeof Audio !== "undefined") {
        try {
          const audio = new Audio("/notification.mp3")
          audio.play().catch(() => {})
        } catch (error) {}
      }
    }

    setLastReportCount(reports.length)
    setEmergencyRequests(reports)
    setFilteredRequests(reports)

    const barangayPromises = reports.map(async (report) => {
      try {
        const barangay = await getBarangayFromCoordinates(report.location.lat, report.location.lng)
        return { id: report.id, barangay: formatBarangay(barangay) }
      } catch (error) {
        console.error("[v0] Error fetching barangay for report", report.id, error)
        return { id: report.id, barangay: "Unknown Barangay" }
      }
    })

    const barangayResults = await Promise.all(barangayPromises)
    const barangayMap = barangayResults.reduce(
      (acc, { id, barangay }) => {
        acc[id] = barangay
        return acc
      },
      {} as Record<string, string>,
    )
    setBarangayData(barangayMap)
  }

  useEffect(() => {
    loadStoredReports()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[v0] Tab became visible, reloading reports...")
        loadStoredReports()
      }
    }

    const handleCustomStorageEvent = () => {
      console.log("[v0] Custom storage event received, reloading reports...")
      loadStoredReports()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("emergency-reports-updated", handleCustomStorageEvent)

    const interval = setInterval(() => {
      loadStoredReports()
    }, 2000)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("emergency-reports-updated", handleCustomStorageEvent)
      clearInterval(interval)
    }
  }, [lastReportCount])

  // Filter requests based on search and filters
  useEffect(() => {
    let filtered = emergencyRequests

    if (!showDeleted) {
      filtered = filtered.filter((request) => !request.deletedAt)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((request) => request.emergencyType === typeFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((request) => request.priority === priorityFilter)
    }

    setFilteredRequests(filtered)
  }, [emergencyRequests, searchTerm, statusFilter, typeFilter, priorityFilter, showDeleted])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "in-progress":
        return "bg-blue-500"
      case "resolved":
        return "bg-green-500"
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "in-progress":
        return "default"
      case "resolved":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "high":
        return "secondary"
      case "medium":
        return "outline"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date()
    const dateObj = typeof date === "string" ? new Date(date) : date

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid date"
    }

    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) {
      return "Just now"
    } else if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return `${diffDays}d ago`
    }
  }

  const capitalizeText = (text: string) => {
    return text.replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setHasNewReports(false)
    await new Promise((resolve) => setTimeout(resolve, 500))
    loadStoredReports()
    setIsRefreshing(false)

    toast({
      title: "Refreshed",
      description: "Emergency reports updated successfully",
      duration: 2000,
    })
  }

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    console.log("[Component] handleStatusChange called:", { requestId, newStatus })

    const success = await updateEmergencyReport(requestId, {
      status: newStatus as EmergencyReport["status"],
      responseTime: newStatus === "in-progress" ? new Date().toISOString() : undefined,
    })

    console.log("[Component] updateEmergencyReport result:", success)

    if (success) {
      // Reload reports to reflect the change
      await loadStoredReports()
      toast({
        title: "Status Updated",
        description: `Emergency status changed to ${capitalizeText(newStatus.replace("-", " "))}`,
        duration: 3000,
      })
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update emergency status",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleAssignTeam = async (requestId: string, teamId: string) => {
    console.log("[Component] handleAssignTeam called:", { requestId, teamId })

    if (!teamId) return

    setIsAssigningTeam(requestId)

    try {
      const success = await assignTeamToEmergency(requestId, teamId)
      console.log("[Component] assignTeamToEmergency result:", success)

      if (success) {
        // Get the team name for display
        const team = responseTeams.find((t) => t.id.toString() === teamId)
        const teamName = team?.team_name || "Unknown Team"

        // Update the local state immediately for better UX
        setEmergencyRequests((prev) =>
          prev.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  assignedTo: teamName,
                  assigned_team_id: team?.id,
                }
              : request,
          ),
        )

        setFilteredRequests((prev) =>
          prev.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  assignedTo: teamName,
                  assigned_team_id: team?.id,
                }
              : request,
          ),
        )

        // Also update selected request if it's the one being assigned
        if (selectedRequest && selectedRequest.id === requestId) {
          setSelectedRequest((prev) =>
            prev
              ? {
                  ...prev,
                  assignedTo: teamName,
                  assigned_team_id: team?.id,
                }
              : null,
          )
        }

        toast({
          title: "Team Assigned",
          description: `${teamName} has been assigned and dispatched to this emergency`,
          duration: 3000,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to assign team to emergency",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error assigning team:", error)
      toast({
        title: "Error",
        description: "Failed to assign team to emergency",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsAssigningTeam(null)
    }
  }

  const handleAddNote = async (requestId: string, note: string) => {
    if (!note.trim()) return

    const report = emergencyRequests.find((r) => r.id === requestId)
    if (!report) return

    const success = await updateEmergencyReport(requestId, {
      notes: [
        ...report.notes,
        {
          id: Date.now(),
          author: user?.name || "Admin",
          content: note,
          timestamp: new Date().toISOString(),
        },
      ],
    })

    if (success) {
      await loadStoredReports()
      setNewNote("")
      toast({
        title: "Note Added",
        description: "Response note has been added to the report",
        duration: 2000,
      })
    }
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(filteredRequests, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `emergency-requests-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Data Exported",
      description: `Exported ${filteredRequests.length} emergency reports`,
      duration: 3000,
    })
  }

  const handleCleanupOldReports = async () => {
    const beforeCount = emergencyRequests.length
    const cleaned = await cleanupOldReports()
    await loadStoredReports()

    if (cleaned > 0) {
      toast({
        title: "Cleanup Complete",
        description: `Removed ${cleaned} reports older than 30 days`,
        duration: 5000,
      })
    } else {
      toast({
        title: "No Cleanup Needed",
        description: "All reports are within the 30-day retention period",
        duration: 3000,
      })
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    const success = await deleteEmergencyReport(reportId)
    if (success) {
      await loadStoredReports()
      toast({
        title: "Report Marked for Deletion",
        description: "Report will be permanently deleted in 24 hours. You can undo this action.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleUndoDelete = async (reportId: string) => {
    const success = await undoDeleteEmergencyReport(reportId)
    if (success) {
      await loadStoredReports()
      toast({
        title: "Deletion Cancelled",
        description: "Emergency report has been restored",
        duration: 3000,
      })
    }
  }

  const getTimeUntilDeletion = (deletedAt: Date | string) => {
    const now = new Date()
    const deletedDate = new Date(deletedAt)
    const hoursRemaining = 24 - Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60))
    return Math.max(0, hoursRemaining)
  }

  const getEmergencyTypeInfo = (type: string) => {
    return emergencyTypes.find((t) => t.value === type) || emergencyTypes[emergencyTypes.length - 1]
  }

  return (
    <RouteGuard requireAuth requireRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <div className="border-b border-slate-700/60 bg-slate-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
                    <h1 className="text-lg sm:text-2xl font-bold text-white">Emergency Management</h1>
                    {hasNewReports && (
                      <Badge variant="destructive" className="animate-pulse text-xs">
                        <Bell className="h-3 w-3 mr-1" />
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl text-xs"
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline ml-2">Refresh</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanupOldReports}
                  className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl text-xs"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-2">Cleanup Old</span>
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

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 py-6">
          {/* Filters */}
          <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, location, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full bg-slate-700/50 border-slate-600/50 text-white rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full bg-slate-700/50 border-slate-600/50 text-white rounded-xl">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {emergencyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full bg-slate-700/50 border-slate-600/50 text-white rounded-xl">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-300">Pending</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-500">
                      {emergencyRequests.filter((r) => r.status === "pending").length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-300">In Progress</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-500">
                      {emergencyRequests.filter((r) => r.status === "in-progress").length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-300">Critical</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-500">
                      {emergencyRequests.filter((r) => r.priority === "critical").length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-300">Resolved</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-500">
                      {emergencyRequests.filter((r) => r.status === "resolved").length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Requests List */}
          <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-white">
                <span className="text-base sm:text-lg">Emergency Requests ({filteredRequests.length})</span>
                {filteredRequests.length !== emergencyRequests.length && (
                  <Badge variant="outline" className="border-slate-600/50 text-slate-300 w-fit">
                    Filtered from {emergencyRequests.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm sm:text-base">No Emergency Requests Found</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2">
                    Reports Are Automatically Cleaned Up After 30 Days
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => {
                    const typeInfo = getEmergencyTypeInfo(request.emergencyType)
                    const isMarkedForDeletion = !!request.deletedAt
                    const hoursUntilDeletion = isMarkedForDeletion ? getTimeUntilDeletion(request.deletedAt!) : 0

                    return (
                      <div
                        key={request.id}
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
                                Marked For Deletion - Will Be Permanently Removed In {hoursUntilDeletion} Hours
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUndoDelete(request.id)}
                              className="bg-green-600/20 border-green-500/50 text-green-300 hover:bg-green-600/30 rounded-lg text-xs flex-shrink-0"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Undo
                            </Button>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(request.status)}`} />
                            <div className="flex items-center gap-2">
                              <span className="text-base sm:text-lg">{typeInfo.icon}</span>
                              <div>
                                <p className="font-medium text-white text-sm sm:text-base">{request.userName}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getPriorityColor(request.priority)} className="text-xs capitalize">
                              {capitalizeText(request.priority)}
                            </Badge>
                            <Badge variant={getStatusVariant(request.status) as any} className="text-xs capitalize">
                              {capitalizeText(request.status.replace(/-/g, " "))}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                          <div>
                            <p className="text-slate-400">Emergency Type:</p>
                            <p className="font-medium text-white capitalize">{typeInfo.label}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">People Count:</p>
                            <p className="font-medium text-white flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {request.peopleCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Location:</p>
                            <p className="font-medium text-white truncate">{formatAddress(request.address)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Barangay:</p>
                            <p className="font-medium text-white">{barangayData[request.id] || "Loading..."}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Contact:</p>
                            <p className="font-medium text-white">{request.contactNumber}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Reported:</p>
                            <p className="font-medium text-white">{formatTimeAgo(request.timestamp)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Assigned To:</p>
                            <p className="font-medium text-white truncate">{request.assignedTo || "Unassigned"}</p>
                          </div>
                        </div>

                        {request.additionalInfo && (
                          <div>
                            <p className="text-slate-400 text-xs sm:text-sm">Additional Information:</p>
                            <p className="text-white bg-slate-800/50 p-2 rounded text-xs sm:text-sm">
                              {request.additionalInfo}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-600/30">
                          <p className="text-xs text-slate-400 truncate">ID: {request.id}</p>
                          <div className="flex flex-wrap gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedRequest(request)}
                                  className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl text-xs"
                                >
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950 border-slate-700/60 text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Emergency Request Details</DialogTitle>
                                </DialogHeader>
                                {selectedRequest && (
                                  <div className="space-y-6">
                                    {/* Request Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-white">Status</Label>
                                        <Select
                                          value={selectedRequest.status}
                                          onValueChange={(value) => handleStatusChange(selectedRequest.id, value)}
                                        >
                                          <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white rounded-xl">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-white">Assign Team</Label>
                                        <Select
                                          value={selectedRequest.assignedTo || ""}
                                          onValueChange={(value) => handleAssignTeam(selectedRequest.id, value)}
                                          disabled={isLoadingTeams || isAssigningTeam === selectedRequest.id}
                                        >
                                          <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white rounded-xl">
                                            <SelectValue
                                              placeholder={
                                                isLoadingTeams || isAssigningTeam === selectedRequest.id
                                                  ? "Loading Teams..."
                                                  : "Select Team"
                                              }
                                            />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {responseTeams.map((team) => (
                                              <SelectItem key={team.id} value={team.id.toString()}>
                                                {team.team_name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    {/* User Details */}
                                    <div>
                                      <h3 className="font-medium mb-2 text-white">User Information</h3>
                                      <div className="bg-slate-800/50 p-3 rounded space-y-1">
                                        <p className="text-white">
                                          <strong>Name:</strong> {selectedRequest.userName}
                                        </p>
                                        <p className="text-white">
                                          <strong>Contact:</strong> {selectedRequest.contactNumber}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Emergency Details */}
                                    <div>
                                      <h3 className="font-medium mb-2 text-white">Emergency Details</h3>
                                      <div className="bg-slate-800/50 p-3 rounded space-y-1">
                                        <p className="text-white">
                                          <strong>Type:</strong>{" "}
                                          {getEmergencyTypeInfo(selectedRequest.emergencyType).label}
                                        </p>
                                        <p className="text-white">
                                          <strong>Priority:</strong> {capitalizeText(selectedRequest.priority)}
                                        </p>
                                        <p className="text-white">
                                          <strong>People Count:</strong> {selectedRequest.peopleCount}
                                        </p>
                                        <p className="text-white">
                                          <strong>Location:</strong> {formatAddress(selectedRequest.address)}
                                        </p>
                                        {selectedRequest.additionalInfo && (
                                          <div>
                                            <strong className="text-white">Additional Info:</strong>
                                            <p className="mt-1 text-sm text-slate-300">
                                              {selectedRequest.additionalInfo}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Notes Section */}
                                    <div>
                                      <h3 className="font-medium mb-2 text-white">Response Notes</h3>
                                      <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedRequest.notes.map((note) => (
                                          <div key={note.id} className="bg-slate-800/50 p-2 rounded text-sm">
                                            <div className="flex justify-between items-start">
                                              <strong className="text-white">{note.author}</strong>
                                              <span className="text-xs text-slate-400">
                                                {formatTimeAgo(note.timestamp)}
                                              </span>
                                            </div>
                                            <p className="mt-1 text-slate-300">{note.content}</p>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex gap-2 mt-2">
                                        <Textarea
                                          placeholder="Add a note..."
                                          value={newNote}
                                          onChange={(e) => setNewNote(e.target.value)}
                                          className="flex-1 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 rounded-xl"
                                          rows={2}
                                        />
                                        <Button
                                          onClick={() => handleAddNote(selectedRequest.id, newNote)}
                                          disabled={!newNote.trim()}
                                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl"
                                        >
                                          <MessageSquare className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <Button
                                        onClick={() => window.open(`tel:${selectedRequest.contactNumber}`, "_self")}
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl"
                                      >
                                        <Phone className="w-4 h-4 mr-1" />
                                        Call User
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() =>
                                          window.open(
                                            `https://maps.google.com/?q=${selectedRequest.location.lat},${selectedRequest.location.lng}`,
                                            "_blank",
                                          )
                                        }
                                        className="flex-1 bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
                                      >
                                        <Globe className="w-4 h-4 mr-1" />
                                        View Location
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`tel:${request.contactNumber}`, "_self")}
                              className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl text-xs"
                            >
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Call
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  `https://maps.google.com/?q=${request.location.lat},${request.location.lng}`,
                                  "_blank",
                                )
                              }
                              className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl text-xs"
                            >
                              <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Map
                            </Button>

                            {isMarkedForDeletion ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUndoDelete(request.id)}
                                className="bg-green-600/20 border-green-500/50 text-green-300 hover:bg-green-600/30 rounded-xl text-xs"
                              >
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Undo
                              </Button>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="rounded-xl text-xs">
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950 border-slate-700/60 text-white">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Delete Emergency Report?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-300">
                                      This Report Will Be Marked For Deletion And Permanently Removed After 24 Hours.
                                      You Can Undo This Action During The Grace Period. Report For{" "}
                                      <strong>{request.userName}</strong> (ID: {request.id}).
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteReport(request.id)}
                                      className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl"
                                    >
                                      Delete Report
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
