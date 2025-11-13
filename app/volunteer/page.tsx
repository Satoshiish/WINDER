"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  MapPin,
  AlertTriangle,
  Activity,
  LogOut,
  Cloud,
  Plus,
  Send,
  CheckCircle2,
  TrendingUp,
  Droplets,
  Users,
  Home,
  AlertCircle,
} from "lucide-react"
import {
  getVolunteerAreas,
  getVolunteerUpdates,
  createVolunteerUpdate,
  getVolunteerUpdateStats,
  type VolunteerArea,
  type VolunteerUpdate,
} from "@/services/volunteerService"
import { useToast } from "@/hooks/use-toast"

export default function VolunteerDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [areas, setAreas] = useState<VolunteerArea[]>([])
  const [updates, setUpdates] = useState<VolunteerUpdate[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    critical: 0,
    high: 0,
    byType: {} as Record<string, number>,
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newUpdate, setNewUpdate] = useState({
    barangay: "",
    municipality: "",
    update_type: "weather" as VolunteerUpdate["update_type"],
    severity: "moderate" as VolunteerUpdate["severity"],
    title: "",
    description: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  })

  const handleLogout = () => {
    logout()
    router.push("/volunteer-login")
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadVolunteerData()
    }
  }, [user])

  const loadVolunteerData = async () => {
    if (!user?.id) return

    const volunteerId = Number.parseInt(user.id)
    const [areasData, updatesData, statsData] = await Promise.all([
      getVolunteerAreas(volunteerId),
      getVolunteerUpdates(volunteerId),
      getVolunteerUpdateStats(volunteerId),
    ])

    setAreas(areasData)
    setUpdates(updatesData)
    setStats(statsData)
  }

  const handleCreateUpdate = async () => {
    if (!user?.id) return

    if (!newUpdate.title || !newUpdate.description || !newUpdate.barangay) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createVolunteerUpdate(Number.parseInt(user.id), newUpdate)

      if (result.success) {
        toast({
          title: "Success",
          description: "Update posted successfully",
        })
        setIsCreateDialogOpen(false)
        setNewUpdate({
          barangay: "",
          municipality: "",
          update_type: "weather",
          severity: "moderate",
          title: "",
          description: "",
          latitude: undefined,
          longitude: undefined,
        })
        await loadVolunteerData()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating update:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case "weather":
        return <Cloud className="w-4 h-4" />
      case "flood":
        return <Droplets className="w-4 h-4" />
      case "evacuation":
        return <Users className="w-4 h-4" />
      case "damage":
        return <AlertTriangle className="w-4 h-4" />
      case "safety":
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return `${diffDays}d ago`
    }
  }

  return (
    <RouteGuard requireAuth requireRole="volunteer" loginPath="/volunteer-login">
      <div className="min-h-screen bg-slate-950">
        <div className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">WINDER+ Volunteer</h1>
                  <p className="text-sm text-slate-400">Field Updates & Monitoring</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-slate-900/50 border border-slate-800 p-1.5 rounded-xl backdrop-blur-sm">
              <TabsTrigger
                value="overview"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden xs:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="areas"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden xs:inline">My Areas</span>
              </TabsTrigger>
              <TabsTrigger
                value="updates"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                <Send className="w-4 h-4" />
                <span className="hidden xs:inline">Updates</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-slate-400" />
                      </div>
                      <Badge variant="outline" className="border-slate-700 text-slate-400">
                        Total
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.total}</p>
                    <p className="text-sm text-slate-400">Total Updates</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-500" />
                      </div>
                      <Badge variant="outline" className="border-blue-500/50 text-blue-500">
                        Active
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.active}</p>
                    <p className="text-sm text-slate-400">Active Updates</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800 hover:border-red-500/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <Badge variant="outline" className="border-red-500/50 text-red-500">
                        Critical
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.critical}</p>
                    <p className="text-sm text-slate-400">Critical Issues</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800 hover:border-green-500/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <Badge variant="outline" className="border-green-500/50 text-green-500">
                        Resolved
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.resolved}</p>
                    <p className="text-sm text-slate-400">Resolved</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">Assigned Areas</CardTitle>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {areas.length} {areas.length === 1 ? "Area" : "Areas"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {areas.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MapPin className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium">No areas assigned yet</p>
                        <p className="text-sm text-slate-500 mt-1">Contact admin for area assignment</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {areas.map((area) => (
                          <div
                            key={area.id}
                            className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                              <Home className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{area.barangay}</p>
                              <p className="text-sm text-slate-400 truncate">
                                {area.municipality}, {area.province}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 h-auto py-5 shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/30">
                          <Plus className="w-5 h-5 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold text-base">Post New Update</div>
                            <div className="text-xs opacity-90">Share field observations</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-white text-xl">Create New Update</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Share weather conditions and situation updates from your area
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white">Update Type</Label>
                              <Select
                                value={newUpdate.update_type}
                                onValueChange={(value: any) => setNewUpdate({ ...newUpdate, update_type: value })}
                              >
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                  <SelectItem value="weather">Weather</SelectItem>
                                  <SelectItem value="flood">Flood</SelectItem>
                                  <SelectItem value="evacuation">Evacuation</SelectItem>
                                  <SelectItem value="damage">Damage</SelectItem>
                                  <SelectItem value="safety">Safety</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white">Severity</Label>
                              <Select
                                value={newUpdate.severity}
                                onValueChange={(value: any) => setNewUpdate({ ...newUpdate, severity: value })}
                              >
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="moderate">Moderate</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white">Title</Label>
                            <Input
                              placeholder="Brief summary of the situation"
                              value={newUpdate.title}
                              onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white">Description</Label>
                            <Textarea
                              placeholder="Detailed description of the situation..."
                              value={newUpdate.description}
                              onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white">Barangay</Label>
                              <Input
                                placeholder="Barangay name"
                                value={newUpdate.barangay}
                                onChange={(e) => setNewUpdate({ ...newUpdate, barangay: e.target.value })}
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white">Municipality</Label>
                              <Input
                                placeholder="Municipality"
                                value={newUpdate.municipality}
                                onChange={(e) => setNewUpdate({ ...newUpdate, municipality: e.target.value })}
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateUpdate}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Posting..." : "Post Update"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      onClick={() => router.push("/")}
                      className="w-full bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800 h-auto py-5 transition-all"
                    >
                      <Cloud className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold text-base">Weather App</div>
                        <div className="text-xs opacity-90">View current conditions</div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg">Recent Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  {updates.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-slate-400 font-medium mb-2">No updates posted yet</p>
                      <p className="text-sm text-slate-500">Start by posting your first field update</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {updates.slice(0, 5).map((update) => (
                        <div
                          key={update.id}
                          className="flex items-start gap-4 p-5 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          <div
                            className={`w-12 h-12 ${getSeverityColor(update.severity)}/10 rounded-xl flex items-center justify-center flex-shrink-0`}
                          >
                            <div
                              className={`text-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "green"}-500`}
                            >
                              {getUpdateTypeIcon(update.update_type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <p className="font-semibold text-white leading-snug">{update.title}</p>
                              <Badge
                                variant="outline"
                                className={`border-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "green"}-500/50 text-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "green"}-500 capitalize flex-shrink-0`}
                              >
                                {update.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-3 leading-relaxed">{update.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {update.barangay}, {update.municipality}
                              </span>
                              <span>{formatTimeAgo(update.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Areas Tab */}
            <TabsContent value="areas" className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">My Assigned Areas</h2>
                  <p className="text-slate-400">Areas you are responsible for monitoring</p>
                </div>
              </div>

              {areas.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardContent className="py-20">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-10 h-10 text-slate-600" />
                      </div>
                      <p className="text-slate-400 font-medium mb-2">No areas assigned yet</p>
                      <p className="text-sm text-slate-500">
                        Contact your administrator to get assigned to monitoring areas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areas.map((area) => (
                    <Card
                      key={area.id}
                      className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                            <Home className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white mb-1.5 truncate text-lg">{area.barangay}</h3>
                            <p className="text-sm text-slate-400 mb-3 truncate">
                              {area.municipality}, {area.province}
                            </p>
                            <Badge variant="outline" className="border-green-500/50 text-green-500">
                              Active Assignment
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Updates Tab */}
            <TabsContent value="updates" className="space-y-6">
              <div className="mb-2">
                <h2 className="text-2xl font-bold text-white mb-1">My Updates</h2>
                <p className="text-slate-400">All updates you have posted</p>
              </div>

              {updates.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardContent className="py-20">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-10 h-10 text-slate-600" />
                      </div>
                      <p className="text-slate-400 font-medium mb-2">No updates posted yet</p>
                      <p className="text-sm text-slate-500 mb-6">
                        Start by posting your first field update from the Overview tab
                      </p>
                      <Button onClick={() => setActiveTab("overview")} className="bg-green-600 hover:bg-green-700">
                        Go to Overview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {updates.map((update) => (
                    <Card
                      key={update.id}
                      className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-14 h-14 ${getSeverityColor(update.severity)}/10 rounded-xl flex items-center justify-center flex-shrink-0`}
                          >
                            <div
                              className={`text-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "green"}-500`}
                            >
                              {getUpdateTypeIcon(update.update_type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-3">
                              <h3 className="font-semibold text-white mb-2 text-lg leading-snug">{update.title}</h3>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`border-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "green"}-500/50 text-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "green"}-500 capitalize`}
                                >
                                  {update.severity}
                                </Badge>
                                <Badge variant="outline" className="border-slate-700 text-slate-300 capitalize">
                                  {update.update_type}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`border-slate-700 capitalize ${update.status === "active" ? "text-blue-400" : update.status === "resolved" ? "text-green-400" : "text-slate-400"}`}
                                >
                                  {update.status}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-slate-300 mb-4 leading-relaxed">{update.description}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {update.barangay}, {update.municipality}, {update.province}
                              </span>
                              <span>{formatTimeAgo(update.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RouteGuard>
  )
}
