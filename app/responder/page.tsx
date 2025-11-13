"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertTriangle,
  Activity,
  LogOut,
  Shield,
  Phone,
  Navigation,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  MapPin,
} from "lucide-react"
import {
  getResponderEmergencies,
  getTeamInfo,
  updateDeploymentStatus,
  type Emergency,
  type ResponseTeam,
} from "@/services/responderService"
import { useToast } from "@/hooks/use-toast"

export default function ResponderDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [team, setTeam] = useState<ResponseTeam | null>(null)
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleLogout = () => {
    logout()
    router.push("/responder-login")
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  useEffect(() => {
    if (user?.teamId) {
      loadResponderData()
    }
  }, [user])

  const loadResponderData = async () => {
    if (!user?.teamId) return

    setIsLoading(true)
    try {
      const [emergenciesData, teamData] = await Promise.all([
        getResponderEmergencies(user.teamId),
        getTeamInfo(user.teamId),
      ])

      setEmergencies(emergenciesData)
      setTeam(teamData)
    } catch (error) {
      console.error("Error loading responder data:", error)
      toast({
        title: "Error",
        description: "Failed to load emergency data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (emergencyId: number, newStatus: string) => {
    const success = await updateDeploymentStatus(emergencyId, newStatus)

    if (success) {
      toast({
        title: "Status Updated",
        description: `Deployment status changed to ${newStatus}`,
      })
      await loadResponderData()
    } else {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "dispatched":
        return "bg-blue-500"
      case "on_scene":
        return "bg-purple-500"
      case "resolved":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "high":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const stats = {
    total: emergencies.length,
    pending: emergencies.filter((e) => e.deployment_status === "pending").length,
    dispatched: emergencies.filter((e) => e.deployment_status === "dispatched").length,
    onScene: emergencies.filter((e) => e.deployment_status === "on_scene").length,
    resolved: emergencies.filter((e) => e.deployment_status === "resolved").length,
    critical: emergencies.filter((e) => e.priority === "critical").length,
  }

  return (
    <RouteGuard requireAuth requireRole="responder" loginPath="/responder-login">
      <div className="min-h-screen bg-slate-950 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-blue-900/10 pointer-events-none" />

        <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 ring-2 ring-orange-500/20">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">WINDER+ Responder</h1>
                  <p className="text-sm text-slate-400">Emergency Response & Monitoring</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{team?.team_name || user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 py-8 relative">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-slate-900/80 border border-slate-800/50 p-1.5 rounded-xl backdrop-blur-sm shadow-lg">
              <TabsTrigger
                value="overview"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/30 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-300 data-[state=inactive]:hover:bg-slate-800/60 data-[state=inactive]:bg-slate-800/30 rounded-lg transition-all duration-200"
              >
                <Activity className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="emergencies"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/30 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-300 data-[state=inactive]:hover:bg-slate-800/60 data-[state=inactive]:bg-slate-800/30 rounded-lg transition-all duration-200"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Emergencies</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <TrendingUp className="w-5 h-5 text-slate-400" />
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        Total
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.total}</p>
                    <p className="text-sm text-slate-400">Total Emergencies</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900/90 border-blue-700/30 backdrop-blur-sm shadow-xl hover:shadow-blue-900/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Activity className="w-5 h-5 text-blue-400" />
                      <Badge variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-500/10">
                        Active
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.dispatched + stats.onScene}</p>
                    <p className="text-sm text-slate-400">In Progress</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-900/20 to-slate-900/90 border-red-700/30 backdrop-blur-sm shadow-xl hover:shadow-red-900/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Critical</Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.critical}</p>
                    <p className="text-sm text-slate-400">High Priority</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/20 to-slate-900/90 border-green-700/30 backdrop-blur-sm shadow-xl hover:shadow-green-900/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10">
                        Resolved
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.resolved}</p>
                    <p className="text-sm text-slate-400">Completed</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {team && (
                  <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-orange-400" />
                          </div>
                          Team Information
                        </CardTitle>
                        <Badge variant="outline" className="border-orange-500/50 text-orange-400">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-400 mb-1">Team Name</p>
                            <p className="font-semibold text-white">{team.team_name}</p>
                          </div>
                          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-400 mb-1">Team Type</p>
                            <p className="font-semibold text-white capitalize">{team.team_type}</p>
                          </div>
                          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-400 mb-1">Contact</p>
                            <p className="font-semibold text-white">{team.contact_number}</p>
                          </div>
                          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-400 mb-1">Your Role</p>
                            <p className="font-semibold text-white capitalize">
                              {user?.teamRole
                                ? user.teamRole
                                    .replace(/_/g, " ")
                                    .toLowerCase()
                                    .replace(/\b\w/g, (l) => l.toUpperCase())
                                : "Responder"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white">Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-slate-300">Pending</span>
                        </div>
                        <span className="font-bold text-white">{stats.pending}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-slate-300">Dispatched</span>
                        </div>
                        <span className="font-bold text-white">{stats.dispatched}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-slate-300">On Scene</span>
                        </div>
                        <span className="font-bold text-white">{stats.onScene}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-slate-300">Resolved</span>
                        </div>
                        <span className="font-bold text-white">{stats.resolved}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white">Recent Emergencies</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-slate-400">Loading emergencies...</p>
                    </div>
                  ) : emergencies.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-lg font-medium text-slate-400 mb-2">No emergencies assigned</p>
                      <p className="text-sm text-slate-500">
                        Emergency reports will appear here when assigned by admin
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {emergencies.slice(0, 5).map((emergency) => (
                        <div
                          key={emergency.id}
                          className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 hover:border-orange-500/30 transition-all cursor-pointer group"
                          onClick={() => setSelectedEmergency(emergency)}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(emergency.deployment_status)} mt-1.5 shadow-lg`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                                {emergency.user_name}
                              </p>
                              <Badge
                                variant={getPriorityColor(emergency.priority)}
                                className="capitalize flex-shrink-0"
                              >
                                {emergency.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-300 mb-2 line-clamp-1">
                              {emergency.additional_info || emergency.address}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="capitalize">{emergency.emergency_type.replace("-", " ")}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(emergency.created_at)}
                              </span>
                              <span className="capitalize">{emergency.deployment_status.replace("_", " ")}</span>
                            </div>
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Assigned Emergencies</h2>
                  <p className="text-slate-400">Emergency reports assigned to your team</p>
                </div>
              </div>

              {isLoading ? (
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50">
                  <CardContent className="py-16 text-center">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-400">Loading emergencies...</p>
                  </CardContent>
                </Card>
              ) : emergencies.length === 0 ? (
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50">
                  <CardContent className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-xl font-semibold text-slate-300 mb-2">No emergencies assigned</p>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Emergency reports will appear here when assigned by the admin. Stay ready for dispatch.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {emergencies.map((emergency) => (
                    <Card
                      key={emergency.id}
                      className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:shadow-2xl hover:shadow-orange-900/20 hover:border-orange-500/30 transition-all cursor-pointer group"
                      onClick={() => setSelectedEmergency(emergency)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`w-3 h-3 rounded-full ${getStatusColor(emergency.deployment_status)} shadow-lg`}
                              />
                              <h3 className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors">
                                {emergency.user_name}
                              </h3>
                              <Badge variant={getPriorityColor(emergency.priority)} className="capitalize">
                                {emergency.priority}
                              </Badge>
                            </div>
                            {emergency.additional_info && (
                              <p className="text-slate-300 mb-3 line-clamp-2">{emergency.additional_info}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                          <div className="p-2 bg-slate-800/30 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">Emergency Type</p>
                            <p className="text-white font-medium capitalize">
                              {emergency.emergency_type.replace("-", " ")}
                            </p>
                          </div>
                          <div className="p-2 bg-slate-800/30 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">People Count</p>
                            <p className="text-white font-medium flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {emergency.people_count}
                            </p>
                          </div>
                          <div className="p-2 bg-slate-800/30 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">Status</p>
                            <p className="text-white font-medium capitalize">
                              {emergency.deployment_status.replace("_", " ")}
                            </p>
                          </div>
                          <div className="p-2 bg-slate-800/30 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">Reported</p>
                            <p className="text-white font-medium">{formatTimeAgo(emergency.created_at)}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-800/30 rounded-lg mb-4 border border-slate-700/30">
                          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Location
                          </p>
                          <p className="text-white text-sm">{emergency.address}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`tel:${emergency.contact_number}`)
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/30"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(
                                `https://maps.google.com/?q=${emergency.location_lat},${emergency.location_lng}`,
                                "_blank",
                              )
                            }}
                            className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:border-orange-500/50"
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Navigate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={!!selectedEmergency} onOpenChange={() => setSelectedEmergency(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Emergency Details</DialogTitle>
              <DialogDescription className="text-slate-400">
                Manage deployment status and view full emergency information
              </DialogDescription>
            </DialogHeader>
            {selectedEmergency && (
              <div className="space-y-6">
                <div>
                  <Label className="text-white mb-2 block">Update Deployment Status</Label>
                  <Select
                    value={selectedEmergency.deployment_status}
                    onValueChange={(value) => handleStatusUpdate(selectedEmergency.id, value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                      <SelectItem value="on_scene">On Scene</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Reporter Name</p>
                    <p className="text-white font-semibold">{selectedEmergency.user_name}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Contact Number</p>
                    <p className="text-white font-semibold">{selectedEmergency.contact_number}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Emergency Type</p>
                    <p className="text-white font-semibold capitalize">
                      {selectedEmergency.emergency_type.replace("-", " ")}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Priority</p>
                    <Badge variant={getPriorityColor(selectedEmergency.priority)} className="capitalize">
                      {selectedEmergency.priority}
                    </Badge>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">People Count</p>
                    <p className="text-white font-semibold">{selectedEmergency.people_count}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Reported</p>
                    <p className="text-white font-semibold">{formatTimeAgo(selectedEmergency.created_at)}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </p>
                  <p className="text-white font-medium">{selectedEmergency.address}</p>
                </div>

                {selectedEmergency.additional_info && (
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-2">Additional Information</p>
                    <p className="text-white leading-relaxed">{selectedEmergency.additional_info}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`tel:${selectedEmergency.contact_number}`)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Reporter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/?q=${selectedEmergency.location_lat},${selectedEmergency.location_lng}`,
                        "_blank",
                      )
                    }
                    className="flex-1 bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigate
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  )
}
