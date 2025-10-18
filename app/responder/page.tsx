"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { RouteGuard } from "@/components/route-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, LogOut, AlertTriangle, Clock, Users, Phone, Navigation, CheckCircle2 } from "lucide-react"
import {
  getTeamEmergencies,
  getTeamInfo,
  updateDeploymentStatus,
  type Emergency,
  type ResponseTeam,
} from "@/lib/responder-db"

export default function ResponderPage() {
  return (
    <RouteGuard requiredRole="responder" loginPath="/responder-login">
      <ResponderDashboard />
    </RouteGuard>
  )
}

function ResponderDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [teamInfo, setTeamInfo] = useState<ResponseTeam | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null)
  const [updateNotes, setUpdateNotes] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (user?.team_id) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user?.team_id) return

    setLoading(true)
    const [emergenciesData, teamData] = await Promise.all([getTeamEmergencies(user.team_id), getTeamInfo(user.team_id)])

    setEmergencies(emergenciesData)
    setTeamInfo(teamData)
    setLoading(false)
  }

  const handleLogout = () => {
    logout()
    router.push("/responder-login")
  }

  const handleStatusUpdate = async (emergencyId: number, newStatus: string) => {
    setUpdatingStatus(true)
    const success = await updateDeploymentStatus(emergencyId, newStatus, updateNotes)
    if (success) {
      await loadData()
      setSelectedEmergency(null)
      setUpdateNotes("")
    }
    setUpdatingStatus(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "dispatched":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "on_scene":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "resolved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  const activeEmergencies = emergencies.filter((e) => e.deployment_status !== "resolved")
  const resolvedEmergencies = emergencies.filter((e) => e.deployment_status === "resolved")
  const criticalEmergencies = emergencies.filter((e) => e.priority === "critical" && e.deployment_status !== "resolved")

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Shield className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Responder Dashboard</h1>
                <p className="text-sm text-slate-400">{teamInfo?.team_name || "Response Team"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-700 bg-transparent">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{emergencies.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{activeEmergencies.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{criticalEmergencies.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{resolvedEmergencies.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency List */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="active" className="data-[state=active]:bg-slate-800">
              Active Emergencies
              {activeEmergencies.length > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">{activeEmergencies.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved" className="data-[state=active]:bg-slate-800">
              Resolved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeEmergencies.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No active emergencies</p>
                </CardContent>
              </Card>
            ) : (
              activeEmergencies.map((emergency) => (
                <Card
                  key={emergency.id}
                  className="bg-slate-900/50 border-slate-800 hover:border-orange-500/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEmergency(emergency)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-white">{emergency.emergency_type}</CardTitle>
                          <Badge className={getPriorityColor(emergency.priority)}>{emergency.priority}</Badge>
                          <Badge className={getStatusColor(emergency.deployment_status)}>
                            {emergency.deployment_status}
                          </Badge>
                        </div>
                        <CardDescription className="text-slate-400">{emergency.address}</CardDescription>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users className="h-4 w-4" />
                        <span>{emergency.user_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="h-4 w-4" />
                        <span>{emergency.contact_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users className="h-4 w-4" />
                        <span>{emergency.people_count} people</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(emergency.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    {emergency.additional_info && (
                      <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                        {emergency.additional_info}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-700 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${emergency.location_lat},${emergency.location_lng}`,
                            "_blank",
                          )
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {resolvedEmergencies.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">No resolved emergencies</p>
                </CardContent>
              </Card>
            ) : (
              resolvedEmergencies.map((emergency) => (
                <Card key={emergency.id} className="bg-slate-900/50 border-slate-800 opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-white">{emergency.emergency_type}</CardTitle>
                          <Badge className={getPriorityColor(emergency.priority)}>{emergency.priority}</Badge>
                          <Badge className={getStatusColor(emergency.deployment_status)}>Resolved</Badge>
                        </div>
                        <CardDescription className="text-slate-400">{emergency.address}</CardDescription>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-400">
                      Resolved on {emergency.resolved_at ? new Date(emergency.resolved_at).toLocaleString() : "N/A"}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Emergency Details Dialog */}
      <Dialog open={!!selectedEmergency} onOpenChange={() => setSelectedEmergency(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Emergency Request Details</DialogTitle>
            <DialogDescription className="text-slate-400">Update deployment status and add notes</DialogDescription>
          </DialogHeader>

          {selectedEmergency && (
            <div className="space-y-6">
              {/* Status Update */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Deployment Status</label>
                <Select
                  value={selectedEmergency.deployment_status}
                  onValueChange={(value) => handleStatusUpdate(selectedEmergency.id, value)}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="on_scene">On Scene</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-300">User Information</h3>
                <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-medium">{selectedEmergency.user_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact:</span>
                    <span className="font-medium">{selectedEmergency.contact_number}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Details */}
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-300">Emergency Details</h3>
                <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-medium">{selectedEmergency.emergency_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Priority:</span>
                    <Badge className={getPriorityColor(selectedEmergency.priority)}>{selectedEmergency.priority}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">People Count:</span>
                    <span className="font-medium">{selectedEmergency.people_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-medium text-right">{selectedEmergency.address}</span>
                  </div>
                  {selectedEmergency.additional_info && (
                    <div className="pt-2 border-t border-slate-700">
                      <span className="text-slate-400 block mb-1">Additional Info:</span>
                      <p className="text-sm">{selectedEmergency.additional_info}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Response Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Response Notes</label>
                <Textarea
                  placeholder="Add notes about the response..."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  className="bg-slate-800 border-slate-700 min-h-[100px]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleStatusUpdate(selectedEmergency.id, selectedEmergency.deployment_status)}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Updating..." : "Save Notes"}
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-700 bg-transparent"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedEmergency.location_lat},${selectedEmergency.location_lng}`,
                      "_blank",
                    )
                  }
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
