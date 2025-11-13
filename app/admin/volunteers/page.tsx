"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  UserPlus,
  MapPin,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Plus,
  UserCheck,
  UserX,
  ArrowLeft,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getAllVolunteers,
  addVolunteer,
  assignVolunteerToBarangay,
  removeVolunteerAssignment,
  deactivateVolunteer,
  reactivateVolunteer,
  getOlongapoBarangays,
  type VolunteerWithAreas,
} from "@/services/volunteerAdminService"
import { getVolunteerUpdates, type VolunteerUpdate } from "@/services/volunteerService"

export default function VolunteerManagement() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [volunteers, setVolunteers] = useState<VolunteerWithAreas[]>([])
  const [volunteerUpdates, setVolunteerUpdates] = useState<VolunteerUpdate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerWithAreas | null>(null)

  const [newVolunteerForm, setNewVolunteerForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    barangay: "",
  })

  const [assignmentForm, setAssignmentForm] = useState({
    barangay: "",
  })

  const barangays = getOlongapoBarangays()

  useEffect(() => {
    loadVolunteers()
    loadVolunteerUpdates()
  }, [])

  const loadVolunteers = async () => {
    setIsLoading(true)
    try {
      const data = await getAllVolunteers()
      setVolunteers(data)
    } catch (error) {
      console.error("Error loading volunteers:", error)
      toast({
        title: "Error",
        description: "Failed to load volunteers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadVolunteerUpdates = async () => {
    try {
      const updates = await getVolunteerUpdates()
      setVolunteerUpdates(updates)
    } catch (error) {
      console.error("Error loading volunteer updates:", error)
    }
  }

  const handleAddVolunteer = async () => {
    if (!newVolunteerForm.email || !newVolunteerForm.password || !newVolunteerForm.full_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const result = await addVolunteer(newVolunteerForm)

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      setIsAddDialogOpen(false)
      setNewVolunteerForm({
        email: "",
        password: "",
        full_name: "",
        phone_number: "",
        barangay: "",
      })
      await loadVolunteers()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleAssignVolunteer = async () => {
    if (!selectedVolunteer || !assignmentForm.barangay) {
      toast({
        title: "Validation Error",
        description: "Please select a barangay",
        variant: "destructive",
      })
      return
    }

    const result = await assignVolunteerToBarangay(
      selectedVolunteer.id,
      assignmentForm.barangay,
      "Olongapo City",
      "Zambales",
    )

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      setIsAssignDialogOpen(false)
      setAssignmentForm({ barangay: "" })
      setSelectedVolunteer(null)
      await loadVolunteers()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleRemoveAssignment = async (areaId: number) => {
    const result = await removeVolunteerAssignment(areaId)

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      await loadVolunteers()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleToggleVolunteerStatus = async (volunteer: VolunteerWithAreas) => {
    const result = volunteer.is_active
      ? await deactivateVolunteer(volunteer.id)
      : await reactivateVolunteer(volunteer.id)

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      await loadVolunteers()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <RouteGuard requireAuth requireRole="admin">
      <div className="min-h-screen bg-slate-950">
        <div className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin")}
                  className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-green-500" />
                  <h1 className="text-2xl font-bold text-white">Volunteer Management</h1>
                </div>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Volunteer
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add New Volunteer</DialogTitle>
                    <DialogDescription className="text-slate-400">Create a new volunteer account</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-white">Full Name *</Label>
                      <Input
                        placeholder="Juan Dela Cruz"
                        value={newVolunteerForm.full_name}
                        onChange={(e) => setNewVolunteerForm({ ...newVolunteerForm, full_name: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Email *</Label>
                      <Input
                        type="email"
                        placeholder="volunteer@example.com"
                        value={newVolunteerForm.email}
                        onChange={(e) => setNewVolunteerForm({ ...newVolunteerForm, email: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Password *</Label>
                      <Input
                        type="password"
                        placeholder="Min. 6 characters"
                        value={newVolunteerForm.password}
                        onChange={(e) => setNewVolunteerForm({ ...newVolunteerForm, password: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Phone Number</Label>
                      <Input
                        placeholder="0917-123-4567"
                        value={newVolunteerForm.phone_number}
                        onChange={(e) => setNewVolunteerForm({ ...newVolunteerForm, phone_number: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Barangay</Label>
                      <Select
                        value={newVolunteerForm.barangay}
                        onValueChange={(value) => setNewVolunteerForm({ ...newVolunteerForm, barangay: value })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Select Barangay" />
                        </SelectTrigger>
                        <SelectContent>
                          {barangays.map((barangay) => (
                            <SelectItem key={barangay} value={barangay}>
                              {barangay}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddVolunteer} className="bg-green-600 hover:bg-green-700">
                      Add Volunteer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-5 h-5 text-green-500" />
                  <Badge variant="outline" className="border-green-500/50 text-green-500">
                    Active
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{volunteers.filter((v) => v.is_active).length}</p>
                <p className="text-sm text-slate-400">Active Volunteers</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <Badge variant="outline" className="border-blue-500/50 text-blue-500">
                    Reports
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{volunteerUpdates.length}</p>
                <p className="text-sm text-slate-400">Total Updates</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <Badge variant="outline" className="border-purple-500/50 text-purple-500">
                    Areas
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {volunteers.reduce((sum, v) => sum + (v.areas?.length || 0), 0)}
                </p>
                <p className="text-sm text-slate-400">Assigned Areas</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <UserX className="w-5 h-5 text-slate-500" />
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    Inactive
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{volunteers.filter((v) => !v.is_active).length}</p>
                <p className="text-sm text-slate-400">Inactive Volunteers</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">All Volunteers</CardTitle>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                  {volunteers.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Loading volunteers...</p>
                </div>
              ) : volunteers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400">No volunteers yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {volunteers.map((volunteer) => (
                    <div
                      key={volunteer.id}
                      className={`p-4 rounded-lg border ${
                        volunteer.is_active ? "bg-slate-800/50 border-slate-800" : "bg-slate-800/20 border-slate-800/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{volunteer.full_name}</h3>
                            <Badge
                              variant={volunteer.is_active ? "default" : "secondary"}
                              className={volunteer.is_active ? "bg-green-500" : "bg-slate-600"}
                            >
                              {volunteer.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {volunteer.email}
                            </div>
                            {volunteer.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {volunteer.phone_number}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Joined {formatDate(volunteer.created_at)}
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              {volunteer.update_count} Reports
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm text-slate-400">Assigned to:</span>
                              {volunteer.areas && volunteer.areas.length > 0 ? (
                                volunteer.areas.map((area) => (
                                  <Badge key={area.id} variant="outline" className="border-green-500/50 text-green-400">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {area.barangay}
                                    <button
                                      onClick={() => handleRemoveAssignment(area.id)}
                                      className="ml-2 hover:text-red-400"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">No assignments</span>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedVolunteer(volunteer)
                                  setIsAssignDialogOpen(true)
                                }}
                                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-6 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Assign
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleVolunteerStatus(volunteer)}
                            className={`${
                              volunteer.is_active
                                ? "bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30"
                                : "bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30"
                            }`}
                          >
                            {volunteer.is_active ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Assign to Barangay</DialogTitle>
            <DialogDescription className="text-slate-400">
              Assign {selectedVolunteer?.full_name} to a new barangay
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Barangay *</Label>
              <Select value={assignmentForm.barangay} onValueChange={(value) => setAssignmentForm({ barangay: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select Barangay" />
                </SelectTrigger>
                <SelectContent>
                  {barangays.map((barangay) => (
                    <SelectItem key={barangay} value={barangay}>
                      {barangay}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button onClick={handleAssignVolunteer} className="bg-green-600 hover:bg-green-700">
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RouteGuard>
  )
}
