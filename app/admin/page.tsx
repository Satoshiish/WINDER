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
  Mail,
  User,
  Cloud,
} from "lucide-react"
import { getEmergencyStats } from "@/lib/emergency-storage"
import { loadAdminUsers, addAdminUser, removeAdminUser, type AdminUser } from "@/lib/admin-users-storage"
import { useToast } from "@/hooks/use-toast"

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

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  useEffect(() => {
    const updateStats = () => {
      const stats = getEmergencyStats()
      setEmergencyStats(stats)
    }

    updateStats()

    // Poll for updates every 3 seconds
    const interval = setInterval(updateStats, 3000)

    // Listen for storage events
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
    const savedSettings = localStorage.getItem("winder-admin-settings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const users = loadAdminUsers()
    setAdminUsers(users)
    console.log(`[v0] Loaded ${users.length} admin users`)
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

  const handleAddUser = () => {
    // Validate form
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

    const result = addAdminUser(newUserForm.email, newUserForm.name, newUserForm.password)

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      setIsAddUserDialogOpen(false)
      setNewUserForm({ email: "", name: "", password: "", confirmPassword: "" })
      loadUsers()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = (user: AdminUser) => {
    const result = removeAdminUser(user.id)

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      loadUsers()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
    setUserToDelete(null)
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

  return (
    <RouteGuard requireAuth requireRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-md">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Cloud className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-semibold text-blue-400">WINDER+ Admin</h1>
                  <p className="text-xs text-slate-400 leading-tight">Emergency Management Dashboard</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-600/30 p-1 rounded-xl gap-1">
              <TabsTrigger
                value="overview"
                className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg px-2 py-2 min-w-0"
              >
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline text-xs sm:text-sm truncate">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="locations"
                className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg px-2 py-2 min-w-0"
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline text-xs sm:text-sm truncate">Locations</span>
              </TabsTrigger>
              <TabsTrigger
                value="emergencies"
                className="flex items-center justify-center gap-1 sm:gap-2 relative data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg px-2 py-2 min-w-0"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline text-xs sm:text-sm truncate">Emergencies</span>
                {emergencyStats.pending > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center animate-pulse"
                  >
                    {emergencyStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg px-2 py-2 min-w-0"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline text-xs sm:text-sm truncate">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card
                  className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm cursor-pointer hover:from-slate-800/70 hover:to-slate-700/70 transition-all"
                  onClick={() => router.push("/admin/locations")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Location Management</h3>
                          <p className="text-sm text-slate-300">Monitor shared locations</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm cursor-pointer hover:from-slate-800/70 hover:to-slate-700/70 transition-all relative"
                  onClick={() => router.push("/admin/emergencies")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center relative">
                          <AlertTriangle className="w-6 h-6 text-red-500" />
                          {emergencyStats.pending > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                              <span className="text-xs text-white font-bold">{emergencyStats.pending}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Emergency Management</h3>
                          <p className="text-sm text-slate-300">Handle emergency requests</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-300">Pending Emergencies</p>
                        <p className="text-2xl font-bold text-white">{emergencyStats.pending}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-300">Critical Reports</p>
                        <p className="text-2xl font-bold text-white">{emergencyStats.critical}</p>
                      </div>
                      <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-300">In Progress</p>
                        <p className="text-2xl font-bold text-white">{emergencyStats.inProgress}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-300">Total Reports</p>
                        <p className="text-2xl font-bold text-white">{emergencyStats.total}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sharedLocations.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">
                        No recent activity. Location shares will appear here when users share their location.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sharedLocations.slice(0, 3).map((share) => (
                        <div
                          key={share.id}
                          className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(share.status)}`} />
                            <div>
                              <p className="font-medium text-white">{share.userName}</p>
                              <p className="text-sm text-slate-300">
                                {share.shareType} location share - {share.address}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={share.status === "active" ? "default" : "secondary"}
                              className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                            >
                              {share.status}
                            </Badge>
                            <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(share.timestamp)}</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Location Management</h2>
                  <p className="text-slate-300">Monitor and manage shared locations</p>
                </div>
                <Button
                  onClick={() => router.push("/admin/locations")}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl shadow-lg shadow-blue-500/25"
                >
                  View Full Management
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    Recent Shared Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sharedLocations.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">
                        No locations have been shared yet. Users can share their location from the main app.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sharedLocations.slice(0, 5).map((share) => (
                        <div
                          key={share.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-700/50 rounded-xl border border-slate-600/30"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getStatusColor(share.status)}`} />
                            <div className="min-w-0">
                              <p className="font-medium text-white">{share.userName}</p>
                              <p className="text-sm text-slate-300 truncate">{share.address}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:justify-end">
                            <Badge
                              variant={share.status === "active" ? "default" : "secondary"}
                              className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                            >
                              {share.status}
                            </Badge>
                            <p className="text-xs text-slate-400 whitespace-nowrap">{formatTimeAgo(share.timestamp)}</p>
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
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Emergency Management</h2>
                  <p className="text-slate-300">Handle and respond to emergency requests</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge variant="destructive" className="text-xs">
                      {emergencyStats.pending} Pending
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {emergencyStats.inProgress} In Progress
                    </Badge>
                    <Badge variant="outline" className="text-xs border-slate-600/50 text-slate-300">
                      {emergencyStats.resolved} Resolved
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => router.push("/admin/emergencies")}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl shadow-lg shadow-blue-500/25 w-full sm:w-auto"
                >
                  View Full Management
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    Emergency Reports Overview
                    {emergencyStats.pending > 0 && (
                      <Badge variant="destructive" className="ml-2 animate-pulse">
                        {emergencyStats.pending} New
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {emergencyStats.total === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">
                        No emergency reports yet. Reports will appear here when users submit emergency requests.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-300">Pending</p>
                              <p className="text-2xl font-bold text-yellow-500">{emergencyStats.pending}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                          </div>
                        </div>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-300">In Progress</p>
                              <p className="text-2xl font-bold text-blue-500">{emergencyStats.inProgress}</p>
                            </div>
                            <Activity className="w-8 h-8 text-blue-500" />
                          </div>
                        </div>
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-300">Critical</p>
                              <p className="text-2xl font-bold text-red-500">{emergencyStats.critical}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                          </div>
                        </div>
                      </div>
                      <div className="text-center pt-4">
                        <p className="text-sm text-slate-300 mb-3">
                          Click below to view and manage all emergency reports
                        </p>
                        <Button
                          onClick={() => router.push("/admin/emergencies")}
                          size="lg"
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl shadow-lg shadow-blue-500/25"
                        >
                          Open Emergency Management
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                      Emergency Response Settings
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Configure automatic response protocols and notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-notifications" className="text-base text-white">
                          Auto Notifications
                        </Label>
                        <p className="text-sm text-slate-300">
                          Receive instant notifications for new emergency reports
                        </p>
                      </div>
                      <Switch
                        id="auto-notifications"
                        checked={settings.autoNotifications}
                        onCheckedChange={(checked) => handleSettingChange("autoNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="critical-alerts" className="text-base text-white">
                          Critical Alerts
                        </Label>
                        <p className="text-sm text-slate-300">Priority alerts for critical emergency situations</p>
                      </div>
                      <Switch
                        id="critical-alerts"
                        checked={settings.criticalAlerts}
                        onCheckedChange={(checked) => handleSettingChange("criticalAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-response" className="text-base text-white">
                          Auto Response
                        </Label>
                        <p className="text-sm text-slate-300">
                          Automatically send acknowledgment to emergency reporters
                        </p>
                      </div>
                      <Switch
                        id="auto-response"
                        checked={settings.autoResponse}
                        onCheckedChange={(checked) => handleSettingChange("autoResponse", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                      Location Tracking Settings
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Manage location sharing permissions and monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="location-tracking" className="text-base text-white">
                          Location Tracking
                        </Label>
                        <p className="text-sm text-slate-300">
                          Enable real-time location tracking for shared locations
                        </p>
                      </div>
                      <Switch
                        id="location-tracking"
                        checked={settings.locationTracking}
                        onCheckedChange={(checked) => handleSettingChange("locationTracking", checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-base text-white">Active Locations</Label>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {sharedLocations.filter((l) => l.status === "active").length}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300">
                        Currently monitoring {sharedLocations.filter((l) => l.status === "active").length} active
                        location shares
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/admin/locations")}
                        className="w-full mt-2 bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Manage Locations
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                          Data Management
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                          Configure data retention and cleanup policies
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {settings.dataRetention} days
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-base text-white">Data Retention Period</Label>
                        <Badge variant="outline" className="border-slate-600/50 text-slate-300">
                          {settings.dataRetention} days
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300">
                        Emergency reports older than {settings.dataRetention} days are automatically deleted
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-base text-white">Current Storage</Label>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {emergencyStats.total} reports
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300">Total emergency reports currently stored in the system</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/admin/emergencies")}
                        className="w-full mt-2 bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Manage Reports
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                          User Management
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                          Manage admin users and access permissions (Max 10)
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {adminUsers.length}/10
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hidden">
                      {adminUsers.map((adminUser) => (
                        <div
                          key={adminUser.id}
                          className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600/30"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white truncate">{adminUser.name}</p>
                              <p className="text-sm text-slate-300 flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                {adminUser.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs border-slate-600/50 text-slate-300">
                                  Administrator
                                </Badge>
                                {adminUser.lastLogin && (
                                  <span className="text-xs text-slate-400">
                                    Last: {formatDate(adminUser.lastLogin)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {adminUser.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUserToDelete(adminUser)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex-shrink-0 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
                          disabled={adminUsers.length >= 10}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Admin User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-700/60 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add New Admin User</DialogTitle>
                          <DialogDescription className="text-slate-300">
                            Create a new administrator account. Maximum 10 admin users allowed.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-white">
                              Full Name
                            </Label>
                            <Input
                              id="name"
                              placeholder="John Doe"
                              value={newUserForm.name}
                              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                              className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="admin@example.com"
                              value={newUserForm.email}
                              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                              className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">
                              Password
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Min. 6 characters"
                              value={newUserForm.password}
                              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                              className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-white">
                              Confirm Password
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Re-enter password"
                              value={newUserForm.confirmPassword}
                              onChange={(e) => setNewUserForm({ ...newUserForm, confirmPassword: e.target.value })}
                              className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 rounded-xl"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddUserDialogOpen(false)}
                            className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddUser}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl"
                          >
                            Add User
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {adminUsers.length >= 10 && (
                      <p className="text-xs text-slate-400 text-center">
                        Maximum admin user limit reached. Remove a user to add a new one.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/")}
                      className="h-auto py-4 bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Globe className="w-6 h-6" />
                        <span>Weather App</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin/locations")}
                      className="h-auto py-4 bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="w-6 h-6" />
                        <span>Locations</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin/emergencies")}
                      className="h-auto py-4 bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
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
        <AlertDialogContent className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-700/60 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Admin User</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to remove <strong>{userToDelete?.name}</strong> ({userToDelete?.email}) from admin
              users? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteGuard>
  )
}
