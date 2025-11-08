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
    province: "",
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
          province: "",
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
        <div className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">WINDER+ Volunteer</h1>
                  <p className="text-sm text-slate-400">Field Updates & Monitoring</p>
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
        </div>

        <div className="container mx-auto px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 bg-slate-900 border border-slate-800 p-1 rounded-lg">
              <TabsTrigger
                value="overview"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden xs:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="areas"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden xs:inline">My Areas</span>
              </TabsTrigger>
              <TabsTrigger
                value="updates"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md"
              >
                <Send className="w-4 h-4" />
                <span className="hidden xs:inline">Updates</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <TrendingUp className="w-5 h-5 text-slate-400" />
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        Total
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.total}</p>
                    <p className="text-sm text-slate-400">Total Updates</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <Badge variant="outline" className="border-blue-500/50 text-blue-500">
                        Active
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.active}</p>
                    <p className="text-sm text-slate-400">Active Updates</p>
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
                    <p className="text-3xl font-bold text-white mb-1">{stats.critical}</p>
                    <p className="text-sm text-slate-400">Critical Issues</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
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
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Assigned Areas</CardTitle>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {areas.length} Areas
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {areas.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400">No areas assigned yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {areas.map((area) => (
                          <div
                            key={area.id}
                            className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-800"
                          >
                            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                              <Home className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{area.barangay}</p>
                              <p className="text-sm text-slate-400">
                                {area.municipality}, {area.province}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-green-600 hover:bg-green-700 h-auto py-4">
                          <Plus className="w-5 h-5 mr-2" />
                          <div className="text-left">
                            <div className="font-semibold">Post New Update</div>
                            <div className="text-xs opacity-90">Share field observations</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-white">Create New Update</DialogTitle>
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

                          <div className="grid grid-cols-3 gap-4">
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
                            <div className="space-y-2">
                              <Label className="text-white">Province</Label>
                              <Input
                                placeholder="Province"
                                value={newUpdate.province}
                                onChange={(e) => setNewUpdate({ ...newUpdate, province: e.target.value })}
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
                      className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-auto py-4"
                    >
                      <Cloud className="w-5 h-5 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">Weather App</div>
                        <div className="text-xs opacity-90">View current conditions</div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  {updates.length === 0 ? (
                    <div className="text-center py-12">
                      <Send className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400">No updates posted yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {updates.slice(0, 5).map((update) => (
                        <div
                          key={update.id}
                          className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-800"
                        >
                          <div
                            className={`w-10 h-10 ${getSeverityColor(update.severity)}/10 rounded-lg flex items-center justify-center flex-shrink-0`}
                          >
                            <div
                              className={`text-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "green"}-500`}
                            >
                              {getUpdateTypeIcon(update.update_type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-white">{update.title}</p>
                              <Badge
                                variant="outline"
                                className={`border-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "green"}-500/50 text-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "green"}-500 capitalize flex-shrink-0`}
                              >
                                {update.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{update.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">My Assigned Areas</h2>
                  <p className="text-slate-400">Areas you are responsible for monitoring</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {areas.map((area) => (
                  <Card key={area.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{area.barangay}</h3>
                          <p className="text-sm text-slate-400 mb-3">
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
            </TabsContent>

            {/* Updates Tab */}
            <TabsContent value="updates" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">My Updates</h2>
                  <p className="text-slate-400">All updates you have posted</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Update
                </Button>
              </div>

              <div className="space-y-4">
                {updates.map((update) => (
                  <Card key={update.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 ${getSeverityColor(update.severity)}/10 rounded-lg flex items-center justify-center flex-shrink-0`}
                        >
                          <div
                            className={`text-${update.severity === "critical" ? "red" : update.severity === "high" ? "orange" : update.severity === "moderate" ? "yellow" : "green"}-500`}
                          >
                            {getUpdateTypeIcon(update.update_type)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-white mb-1">{update.title}</h3>
                              <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
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
                          </div>
                          <p className="text-slate-300 mb-3">{update.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RouteGuard>
  )
}
