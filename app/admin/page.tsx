"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useLocationSharing } from "@/contexts/location-sharing-context"
import { RouteGuard } from "@/components/route-guard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MapPin,
  AlertTriangle,
  Activity,
  Clock,
  LogOut,
  Settings,
  BarChart3,
  Globe,
  ArrowRight,
  UserPlus,
  Trash2,
  User,
  Cloud,
  TrendingUp,
  CheckCircle2,
  Users,
  FileText,
  MessageSquare,
} from "lucide-react"
import { getEmergencyStats, loadEmergencyReports, type EmergencyReport } from "@/lib/emergency-db"
import { loadAdminUsers, addAdminUser, removeAdminUser, type AdminUser } from "@/lib/admin-users-storage"
import { useToast } from "@/hooks/use-toast"
import { formatAddress } from "@/lib/format-address"
import { getBarangayFromCoordinates, formatBarangay } from "@/lib/barangay-lookup"
import {
  getVolunteerUpdates,
  getVolunteerUpdateStats,
  updateVolunteerUpdateStatus,
  type VolunteerUpdate,
} from "@/lib/volunteer-db"

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { sharedLocations } = useLocationSharing()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [emergencyStats, setEmergencyStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
  })

  const [volunteerUpdates, setVolunteerUpdates] = useState<VolunteerUpdate[]>([])
  const [volunteerStats, setVolunteerStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    critical: 0,
    high: 0,
  })
  const [isLoadingVolunteerUpdates, setIsLoadingVolunteerUpdates] = useState(false)

  const [settings, setSettings] = useState({
    autoNotifications: true,
    criticalAlerts: true,
    locationTracking: true,
    dataRetention: 30,
    autoResponse: false,
  })

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)

  const [emergencyReports, setEmergencyReports] = useState<EmergencyReport[]>([])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  useEffect(() => {
    const updateStats = async () => {
      const stats = await getEmergencyStats()
      setEmergencyStats(stats)
    }

    updateStats()

    const interval = setInterval(updateStats, 3000)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "winder-emergency-reports" || e.key === null) {
        updateStats()
      }
    }

    const handleCustomEvent = () => {
      updateStats()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("emergency-reports-updated", handleCustomEvent)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("emergency-reports-updated", handleCustomEvent)
    }
  }, [])

  useEffect(() => {
    loadVolunteerUpdates()
  }, [])

  const loadVolunteerUpdates = async () => {
    setIsLoadingVolunteerUpdates(true)
    try {
      const [updates, stats] = await Promise.all([getVolunteerUpdates(), getVolunteerUpdateStats()])
      setVolunteerUpdates(updates)
      setVolunteerStats(stats)
    } catch (error) {
      console.error("[v0] Error loading volunteer updates:", error)
      toast({
        title: "Error",
        description: "Failed to load volunteer reports",
        variant: "destructive",
      })
    } finally {
      setIsLoadingVolunteerUpdates(false)
    }
  }

  const handleVolunteerUpdateStatus = async (updateId: number, status: "active" | "resolved" | "archived") => {
    const result = await updateVolunteerUpdateStatus(updateId, status)
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      await loadVolunteerUpdates()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const savedSettings = localStorage.getItem("winder-admin-settings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const users = await loadAdminUsers()
      setAdminUsers(users)
    } catch (error) {
      console.error("[v0] Error loading users:", error)
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleSettingChange = (key: string, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem("winder-admin-settings", JSON.stringify(newSettings))

    toast({
      title: "Settings Updated",
      description: `${key.replace(/([A-Z])/g, " $1").trim()} has been ${typeof value === "boolean" ? (value ? "enabled" : "disabled") : "updated"}.`,
    })
  }

  const handleAddUser = async () => {
    if (!newUserForm.email || !newUserForm.name || !newUserForm.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (newUserForm.password !== newUserForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsAddingUser(true)
    try {
      const result = await addAdminUser(newUserForm.email, newUserForm.name, newUserForm.password)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsAddUserDialogOpen(false)
        setNewUserForm({ email: "", name: "", password: "", confirmPassword: "" })
        await loadUsers()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error adding user:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsAddingUser(false)
    }
  }

  const handleDeleteUser = async (user: AdminUser) => {
    try {
      const result = await removeAdminUser(user.id)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        await loadUsers()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setUserToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "in-progress":
        return "bg-blue-500"
      case "resolved":
        return "bg-gray-500"
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "moderate":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getUpdateTypeInfo = (type: string) => {
    switch (type) {
      case "weather":
        return { icon: Cloud, color: "text-blue-500" }
      case "flood":
        return { icon: AlertTriangle, color: "text-red-500" }
      case "evacuation":
        return { icon: Users, color: "text-orange-500" }
      case "damage":
        return { icon: AlertTriangle, color: "text-red-600" }
      case "safety":
        return { icon: CheckCircle2, color: "text-green-500" }
      default:
        return { icon: FileText, color: "text-slate-500" }
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

  useEffect(() => {
    const loadReports = async () => {
      try {
        const reports = await loadEmergencyReports()
        setEmergencyReports(reports)
      } catch (error) {
        console.error("[v0] Error loading emergency reports:", error)
      }
    }

    loadReports()

    const interval = setInterval(loadReports, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <RouteGuard requireAuth requireRole="admin">
      <div className="min-h-screen bg-slate-950">
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                  <div className="relative w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Cloud className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">WINDER+ Admin</h1>
                  <p className="text-sm text-slate-400">Emergency Management</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
              <TabsTrigger
                value="overview"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden xs:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="locations"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden xs:inline">Locations</span>
              </TabsTrigger>
              <TabsTrigger
                value="emergencies"
                className="flex items-center justify-center gap-2 relative data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden xs:inline">Emergencies</span>
                {emergencyStats.pending > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px]">
                    {emergencyStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="volunteer-reports"
                className="flex items-center justify-center gap-2 relative data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md"
              >
                <Users className="w-4 h-4" />
                <span className="hidden xs:inline">Volunteers</span>
                {volunteerStats.active > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px] bg-green-500"
                  >
                    {volunteerStats.active}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden xs:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800/50 border-slate-800 hover:border-yellow-500/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-500" />
                      </div>
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 capitalize">
                        Pending
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{emergencyStats.pending}</p>
                    <p className="text-sm text-slate-400">Pending</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-800/50 border-slate-800 hover:border-red-500/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <Badge variant="outline" className="border-red-500/50 text-red-500 capitalize">
                        Critical
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{emergencyStats.critical}</p>
                    <p className="text-sm text-slate-400">Critical</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-800/50 border-slate-800 hover:border-blue-500/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-500" />
                      </div>
                      <Badge variant="outline" className="border-blue-500/50 text-blue-500 capitalize">
                        In Progress
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{emergencyStats.inProgress}</p>
                    <p className="text-sm text-slate-400">In Progress</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-800/50 border-slate-800 hover:border-green-500/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <Badge variant="outline" className="border-green-500/50 text-green-500 capitalize">
                        Resolved
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{emergencyStats.resolved}</p>
                    <p className="text-sm text-slate-400">Resolved</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-800/50 border-slate-800 hover:border-slate-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-slate-500/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-slate-400" />
                      </div>
                      <Badge variant="outline" className="border-slate-600 text-slate-400 capitalize">
                        Total
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{emergencyStats.total}</p>
                    <p className="text-sm text-slate-400">Total Reports</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className="bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900 border-slate-800 hover:border-green-500/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push("/admin/locations")}
                >
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                          <MapPin className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Location Management</h3>
                          <p className="text-sm text-slate-400">Monitor shared locations</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-green-500 transition-colors" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900 border-slate-800 hover:border-red-500/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push("/admin/emergencies")}
                >
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors relative">
                          <AlertTriangle className="w-6 h-6 text-red-500" />
                          {emergencyStats.pending > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">{emergencyStats.pending}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Emergency Management</h3>
                          <p className="text-sm text-slate-400">Handle emergency requests</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-red-500 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                      {sharedLocations.length + emergencyReports.length} Total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {sharedLocations.length === 0 && emergencyReports.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {emergencyReports.slice(0, 3).map((report) => (
                        <div
                          key={`report-${report.id}`}
                          className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <div>
                              <p className="font-medium text-white">{report.userName}</p>
                              <p className="text-sm text-slate-400">{report.address}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="border-red-500/50 text-red-500 capitalize mb-1">
                              {report.emergencyType}
                            </Badge>
                            <p className="text-xs text-slate-500">{formatTimeAgo(new Date(report.timestamp))}</p>
                          </div>
                        </div>
                      ))}

                      {sharedLocations.slice(0, 2).map((share) => (
                        <div
                          key={`location-${share.id}`}
                          className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(share.status)}`} />
                            <div>
                              <p className="font-medium text-white">{share.userName}</p>
                              <p className="text-sm text-slate-400">{formatAddress(share.address)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="border-slate-700 text-slate-300 capitalize mb-1">
                              {share.status}
                            </Badge>
                            <p className="text-xs text-slate-500">{formatTimeAgo(share.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="locations" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Location Management</h2>
                  <p className="text-slate-400">Monitor and manage shared locations</p>
                </div>
                <Button onClick={() => router.push("/admin/locations")} className="bg-blue-600 hover:bg-blue-700">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Shared Locations</CardTitle>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                      {sharedLocations.length} Total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {sharedLocations.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400">No locations shared yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sharedLocations.slice(0, 5).map((share) => (
                        <div
                          key={share.id}
                          className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(share.status)}`} />
                            <div>
                              <p className="font-medium text-white">{share.userName}</p>
                              <p className="text-sm text-slate-400">
                                {formatBarangay(getBarangayFromCoordinates(share.location.lat, share.location.lng))}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-slate-700 text-slate-300 capitalize">
                              {share.status}
                            </Badge>
                            <p className="text-xs text-slate-500">{formatTimeAgo(share.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Emergencies Tab */}
            <TabsContent value="emergencies" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Emergency Management</h2>
                  <p className="text-slate-400">Handle and respond to emergency requests</p>
                </div>
                <Button onClick={() => router.push("/admin/emergencies")} className="bg-blue-600 hover:bg-blue-700">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Clock className="w-8 h-8 text-yellow-500" />
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 capitalize">
                        Pending
                      </Badge>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">{emergencyStats.pending}</p>
                    <p className="text-sm text-slate-400">Awaiting Response</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Activity className="w-8 h-8 text-blue-500" />
                      <Badge variant="outline" className="border-blue-500/50 text-blue-500 capitalize">
                        In Progress
                      </Badge>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">{emergencyStats.inProgress}</p>
                    <p className="text-sm text-slate-400">Being Handled</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                      <Badge variant="outline" className="border-red-500/50 text-red-500 capitalize">
                        Critical
                      </Badge>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">{emergencyStats.critical}</p>
                    <p className="text-sm text-slate-400">High Priority</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    Emergency Reports
                    {emergencyStats.pending > 0 && <Badge variant="destructive">{emergencyStats.pending} New</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {emergencyStats.total === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400">No emergency reports yet</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-400 mb-4">
                        {emergencyStats.total} total reports • {emergencyStats.pending} pending
                      </p>
                      <Button
                        onClick={() => router.push("/admin/emergencies")}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Manage Emergencies
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Content Moderation</h2>
                  <p className="text-slate-400">Review and manage reported content</p>
                </div>
                <Button onClick={() => router.push("/admin/moderation")} className="bg-blue-600 hover:bg-blue-700">
                  View Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Moderation Dashboard</h3>
                        <p className="text-sm text-slate-400">Review flagged posts and comments</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="volunteer-reports" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Volunteer Reports</h2>
                  <p className="text-slate-400">Field updates and reports from volunteers</p>
                </div>
                <Button
                  onClick={loadVolunteerUpdates}
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                >
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        Total
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{volunteerStats.total}</p>
                    <p className="text-sm text-slate-400">Total Reports</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Activity className="w-5 h-5 text-green-500" />
                      <Badge variant="outline" className="border-green-500/50 text-green-500">
                        Active
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{volunteerStats.active}</p>
                    <p className="text-sm text-slate-400">Active Reports</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <Badge variant="outline" className="border-red-500/50 text-red-500">
                        Critical
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{volunteerStats.critical}</p>
                    <p className="text-sm text-slate-400">Critical</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      <Badge variant="outline" className="border-blue-500/50 text-blue-500">
                        Resolved
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{volunteerStats.resolved}</p>
                    <p className="text-sm text-slate-400">Resolved</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">All Volunteer Reports</CardTitle>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                      {volunteerUpdates.length} Reports
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingVolunteerUpdates ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">Loading volunteer reports...</p>
                    </div>
                  ) : volunteerUpdates.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400">No volunteer reports yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {volunteerUpdates.map((update) => {
                        const TypeIcon = getUpdateTypeInfo(update.update_type).icon
                        const typeColor = getUpdateTypeInfo(update.update_type).color

                        return (
                          <div
                            key={update.id}
                            className="p-4 bg-slate-800/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSeverityColor(update.severity)}/10`}
                                >
                                  <TypeIcon className={`w-5 h-5 ${typeColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-white truncate">{update.title}</h3>
                                    <Badge
                                      variant="outline"
                                      className={`border-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "blue"}-500/50 text-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "blue"}-500 capitalize`}
                                    >
                                      {update.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-400 mb-2 line-clamp-2">{update.description}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {update.volunteer_name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {update.barangay}, {update.municipality}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDate(update.created_at)}
                                    </span>
                                    <Badge variant="secondary" className="bg-slate-700 text-slate-300 capitalize">
                                      {update.update_type}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Badge
                                  variant="outline"
                                  className={`${
                                    update.status === "active"
                                      ? "border-green-500/50 text-green-500"
                                      : update.status === "resolved"
                                        ? "border-blue-500/50 text-blue-500"
                                        : "border-slate-600 text-slate-400"
                                  } capitalize whitespace-nowrap`}
                                >
                                  {update.status}
                                </Badge>
                                {update.status === "active" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleVolunteerUpdateStatus(update.id, "resolved")}
                                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs"
                                  >
                                    Mark Resolved
                                  </Button>
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
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Emergency Response</CardTitle>
                    <CardDescription className="text-slate-400">
                      Configure notification and response settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white font-medium">Auto Notifications</Label>
                        <p className="text-sm text-slate-400">Instant alerts for new reports</p>
                      </div>
                      <Switch
                        checked={settings.autoNotifications}
                        onCheckedChange={(checked) => handleSettingChange("autoNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white font-medium">Critical Alerts</Label>
                        <p className="text-sm text-slate-400">Priority alerts for critical situations</p>
                      </div>
                      <Switch
                        checked={settings.criticalAlerts}
                        onCheckedChange={(checked) => handleSettingChange("criticalAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white font-medium">Auto Response</Label>
                        <p className="text-sm text-slate-400">Send automatic acknowledgments</p>
                      </div>
                      <Switch
                        checked={settings.autoResponse}
                        onCheckedChange={(checked) => handleSettingChange("autoResponse", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Location Tracking</CardTitle>
                    <CardDescription className="text-slate-400">Manage location monitoring settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white font-medium">Location Tracking</Label>
                        <p className="text-sm text-slate-400">Real-time location monitoring</p>
                      </div>
                      <Switch
                        checked={settings.locationTracking}
                        onCheckedChange={(checked) => handleSettingChange("locationTracking", checked)}
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-white font-medium">Active Locations</Label>
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                          {sharedLocations.filter((l) => l.status === "active").length}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">
                        Currently monitoring {sharedLocations.filter((l) => l.status === "active").length} locations
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/admin/locations")}
                        className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Manage Locations
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Data Management</CardTitle>
                    <CardDescription className="text-slate-400">Configure data retention policies</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-white font-medium">Data Retention</Label>
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                          {settings.dataRetention} days
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">
                        Reports older than {settings.dataRetention} days are deleted
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-white font-medium">Current Storage</Label>
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                          {emergencyStats.total} reports
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">Total reports in system</p>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/admin/emergencies")}
                        className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Manage Reports
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">User Management</CardTitle>
                        <CardDescription className="text-slate-400">Manage admin users (Max 10)</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {adminUsers.length}/10
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingUsers ? (
                      <div className="text-center py-8">
                        <p className="text-slate-400">Loading admin users...</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {adminUsers.map((adminUser) => (
                          <div
                            key={adminUser.id}
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-800"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-white truncate">{adminUser.name}</p>
                                <p className="text-xs text-slate-400 truncate">{adminUser.email}</p>
                              </div>
                            </div>
                            {adminUser.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUserToDelete(adminUser)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                          disabled={adminUsers.length >= 10 || isLoadingUsers}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Admin User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-800 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add New Admin User</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Create a new administrator account
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label className="text-white">Full Name</Label>
                            <Input
                              placeholder="John Doe"
                              value={newUserForm.name}
                              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              disabled={isAddingUser}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Email</Label>
                            <Input
                              type="email"
                              placeholder="admin@example.com"
                              value={newUserForm.email}
                              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              disabled={isAddingUser}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Password</Label>
                            <Input
                              type="password"
                              placeholder="Min. 6 characters"
                              value={newUserForm.password}
                              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              disabled={isAddingUser}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Confirm Password</Label>
                            <Input
                              type="password"
                              placeholder="Re-enter password"
                              value={newUserForm.confirmPassword}
                              onChange={(e) => setNewUserForm({ ...newUserForm, confirmPassword: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              disabled={isAddingUser}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddUserDialogOpen(false)}
                            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                            disabled={isAddingUser}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddUser}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isAddingUser}
                          >
                            {isAddingUser ? "Adding..." : "Add User"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/")}
                      className="h-auto py-6 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Globe className="w-6 h-6" />
                        <span>Weather App</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin/locations")}
                      className="h-auto py-6 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="w-6 h-6" />
                        <span>Locations</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin/emergencies")}
                      className="h-auto py-6 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        <span>Emergencies</span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Admin User</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to remove <strong>{userToDelete?.name}</strong> ({userToDelete?.email})? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteGuard>
  )
}
