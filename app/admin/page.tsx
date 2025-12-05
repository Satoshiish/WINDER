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
  Edit2,
  Star,
  UserCheck,
  UserX,
  Plus,
  X,
  Download,
  Mail,
} from "lucide-react"
import { getEmergencyStats } from "@/services/emergencyService"
import { loadAdminUsers, addAdminUser, removeAdminUser, type AdminUser } from "@/services/adminStorageService"
import { useToast } from "@/hooks/use-toast"
import { formatAddress } from "@/lib/format-address"
import {
  getVolunteerUpdates,
  getVolunteerUpdateStats,
  updateVolunteerUpdateStatus,
  type VolunteerUpdate,
} from "@/services/volunteerService"
import {
  getAllVolunteers,
  addVolunteer,
  updateVolunteer,
  deleteVolunteer,
  getOlongapoBarangays,
  assignMultipleLocations,
  setPrimaryLocation,
  removeVolunteerAssignment,
  type Volunteer,
  type VolunteerArea,
} from "@/services/volunteerAdminService"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getVolunteerFeedback, 
  addVolunteerFeedback, 
  getFeedbackStats,
  validateVolunteer, 
  revokeValidation,
  getVolunteerValidationStatus,
  type VolunteerFeedback 
} from "@/services/feedbackService"
import { getVolunteerProfile, upsertVolunteerProfile } from "@/services/volunteerProfileService"

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
    dataRetention: 0, // Changed to 0 to indicate no deletion
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

  // Volunteer management state
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [selectedVolunteerAreas, setSelectedVolunteerAreas] = useState<VolunteerArea[]>([])
  const [isManageLocationsDialogOpen, setIsManageLocationsDialogOpen] = useState(false)
  const [selectedVolunteerForLocations, setSelectedVolunteerForLocations] = useState<Volunteer | null>(null)
  const [locationSelections, setLocationSelections] = useState<{ barangay: string; is_primary: boolean }[]>([])
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState(false)
  const [isAddVolunteerDialogOpen, setIsAddVolunteerDialogOpen] = useState(false)
  const [isEditVolunteerDialogOpen, setIsEditVolunteerDialogOpen] = useState(false)
  const [volunteerToDelete, setVolunteerToDelete] = useState<Volunteer | null>(null)
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null)
  const [newVolunteerForm, setNewVolunteerForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    barangay: "",
    municipality: "Olongapo City",
  })
  const [editVolunteerForm, setEditVolunteerForm] = useState({
    full_name: "",
    phone_number: "",
    barangay: "",
    is_active: true,
  })
  const [isAddingVolunteer, setIsAddingVolunteer] = useState(false)
  const [isEditingVolunteer, setIsEditingVolunteer] = useState(false)

  // Feedback system state
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
  const [selectedVolunteerForFeedback, setSelectedVolunteerForFeedback] = useState<Volunteer | null>(null)
  const [volunteerFeedback, setVolunteerFeedback] = useState<VolunteerFeedback[]>([])
  const [feedbackStats, setFeedbackStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    needs_improvement: 0,
    average_rating: 0,
  })
  const [feedbackForm, setFeedbackForm] = useState({
    feedback_type: 'validation' as 'validation' | 'performance' | 'general',
    rating: 5,
    comments: '',
    status: 'approved' as 'pending' | 'approved' | 'rejected' | 'needs_improvement',
  })
  const [isValidatingVolunteer, setIsValidatingVolunteer] = useState(false)
  const [volunteerToValidate, setVolunteerToValidate] = useState<Volunteer | null>(null)
  const [volunteerToRevoke, setVolunteerToRevoke] = useState<Volunteer | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [profileVolunteer, setProfileVolunteer] = useState<Volunteer | null>(null)
  const [profileDetails, setProfileDetails] = useState<any | null>(null)
  const [profileValidation, setProfileValidation] = useState<{ is_validated: boolean; overall_rating?: number }>({ is_validated: false })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editProfileForm, setEditProfileForm] = useState<any>({ bio: "", trainings: "", total_hours: undefined, phone_number: "", barangay: "" })

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

  // Volunteer loading effect
  useEffect(() => {
    loadVolunteers()
    loadFeedbackData()
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

  const loadFeedbackData = async () => {
    try {
      const [feedback, stats] = await Promise.all([
        getVolunteerFeedback(),
        getFeedbackStats()
      ])
      setVolunteerFeedback(feedback)
      setFeedbackStats(stats)
    } catch (error) {
      console.error("Error loading feedback data:", error)
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
      const parsedSettings = JSON.parse(savedSettings)
      // Ensure data retention is set to 0 (no deletion)
      setSettings({ ...parsedSettings, dataRetention: 0 })
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
    // Prevent changing data retention from 0
    if (key === "dataRetention") {
      toast({
        title: "Settings Locked",
        description: "Data retention is permanently disabled. Reports will not be deleted.",
        variant: "default",
      })
      return
    }
    
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem("winder-admin-settings", JSON.stringify(newSettings))

    toast({
      title: "Settings Updated",
      description: `${key.replace(/([A-Z])/g, " $1").trim()} has been ${typeof value === "boolean" ? (value ? "enabled" : "disabled") : "updated"}.`,
    })
  }

  // Volunteer management functions
  const loadVolunteers = async () => {
    setIsLoadingVolunteers(true)
    try {
      const data = await getAllVolunteers()
      
      // Fetch validation status for each volunteer and add it to the volunteer object
      const volunteersWithValidation = await Promise.all(
        data.map(async (volunteer) => {
          const validationStatus = await getVolunteerValidationStatus(volunteer.id)
          return {
            ...volunteer,
            is_validated: validationStatus.is_validated // Add this field
          }
        })
      )
      
      setVolunteers(volunteersWithValidation)
    } catch (error) {
      console.error("Error loading volunteers:", error)
      toast({
        title: "Error",
        description: "Failed to load volunteers",
        variant: "destructive",
      })
    } finally {
      setIsLoadingVolunteers(false)
    }
  }

  const handleAddVolunteer = async () => {
    if (
      !newVolunteerForm.email ||
      !newVolunteerForm.password ||
      !newVolunteerForm.full_name ||
      !newVolunteerForm.phone_number ||
      !newVolunteerForm.barangay
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsAddingVolunteer(true)
    try {
      const result = await addVolunteer(newVolunteerForm)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsAddVolunteerDialogOpen(false)
        setNewVolunteerForm({
          email: "",
          password: "",
          full_name: "",
          phone_number: "",
          barangay: "",
          municipality: "Olongapo City",
        })
        await loadVolunteers()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding volunteer:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsAddingVolunteer(false)
    }
  }

  const handleEditVolunteer = async () => {
    if (!selectedVolunteer) return

    if (!editVolunteerForm.full_name || !editVolunteerForm.phone_number || !editVolunteerForm.barangay) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsEditingVolunteer(true)
    try {
      const result = await updateVolunteer(selectedVolunteer.id, editVolunteerForm)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsEditVolunteerDialogOpen(false)
        setSelectedVolunteer(null)
        await loadVolunteers()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating volunteer:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsEditingVolunteer(false)
    }
  }

  const handleDeleteVolunteer = async (volunteer: Volunteer) => {
    try {
      const result = await deleteVolunteer(volunteer.id)

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
    } catch (error) {
      console.error("Error deleting volunteer:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setVolunteerToDelete(null)
    }
  }

  // Feedback functions
  const openFeedbackDialog = (volunteer: Volunteer) => {
    setSelectedVolunteerForFeedback(volunteer)
    setIsFeedbackDialogOpen(true)
  }

  const handleSubmitFeedback = async () => {
    if (!selectedVolunteerForFeedback || !user) return

    const result = await addVolunteerFeedback(
      selectedVolunteerForFeedback.id,
      selectedVolunteerForFeedback.full_name,
      user.id,
      user.name || 'Admin',
      feedbackForm
    )

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      setIsFeedbackDialogOpen(false)
      setSelectedVolunteerForFeedback(null)
      setFeedbackForm({
        feedback_type: 'validation',
        rating: 5,
        comments: '',
        status: 'approved',
      })
      await loadFeedbackData()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleValidateVolunteer = async () => {
    if (!volunteerToValidate || !user) return

    setIsValidatingVolunteer(true)
    try {
      const result = await validateVolunteer(volunteerToValidate.id)
      
      if (result.success) {
        toast({
          title: "Success",
          description: `${volunteerToValidate.full_name} has been validated successfully`,
        })
        setVolunteerToValidate(null)
        
        // Force complete refresh
        await loadVolunteers()
        await loadFeedbackData()
        
        // Add a small delay and force state update
        setTimeout(() => {
          setVolunteers(prev => [...prev.map(v => ({...v}))])
        }, 100)
        
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error validating volunteer:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsValidatingVolunteer(false)
    }
  }

  const handleRevokeValidation = async () => {
    if (!volunteerToRevoke) return

    try {
      const result = await revokeValidation(volunteerToRevoke.id)
      
      if (result.success) {
        toast({
          title: "Success",
          description: `${volunteerToRevoke.full_name}'s validation has been revoked`,
        })
        setVolunteerToRevoke(null)
        await loadFeedbackData()
        await loadVolunteers()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error revoking validation:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer)
    setEditVolunteerForm({
      full_name: volunteer.full_name,
      phone_number: volunteer.phone_number || "",
      barangay: volunteer.barangay || "",
      is_active: volunteer.is_active,
    })
    setIsEditVolunteerDialogOpen(true)
  }

  const openVolunteerProfile = async (volunteer: Volunteer) => {
    setProfileVolunteer(volunteer)
    try {
      const [profile, validation] = await Promise.all([
        getVolunteerProfile(Number(volunteer.id)),
        getVolunteerValidationStatus(Number(volunteer.id)),
      ])
      
      setProfileDetails(profile)
      setProfileValidation({ is_validated: validation.is_validated, overall_rating: validation.overall_rating })
      
      // Prepare edit form with default values
      setEditProfileForm({
        bio: profile?.bio || "",
        trainings: (profile?.trainings || []).join(", ") || "",
        total_hours: profile?.total_hours ?? undefined,
        phone_number: volunteer.phone_number || "",
        barangay: volunteer.barangay || "",
      })
      
      setIsProfileDialogOpen(true)
    } catch (err) {
      console.error("Error loading volunteer profile or validation:", err)
      toast({
        title: "Error",
        description: "Failed to load volunteer profile",
        variant: "destructive",
      })
    }
  }

  const handleSaveProfile = async () => {
    if (!profileVolunteer) return
    try {
      const payload = {
        bio: editProfileForm.bio,
        trainings: editProfileForm.trainings ? editProfileForm.trainings.split(/,\s*/) : [],
        total_hours: editProfileForm.total_hours ? Number(editProfileForm.total_hours) : null,
      }

      const res = await upsertVolunteerProfile(profileVolunteer.id, payload)
      if (!res.success) {
        toast({ title: "Error", description: res.message || "Failed to save profile", variant: "destructive" })
        return
      }

      // Update core volunteer fields if changed
      const volUpdates: any = {}
      if (editProfileForm.phone_number !== profileVolunteer.phone_number) volUpdates.phone_number = editProfileForm.phone_number
      if (editProfileForm.barangay !== profileVolunteer.barangay) volUpdates.barangay = editProfileForm.barangay
      if (Object.keys(volUpdates).length > 0) {
        const ures = await updateVolunteer(profileVolunteer.id, volUpdates)
        if (!ures.success) {
          toast({ title: "Warning", description: "Profile saved, but failed to update volunteer core details", variant: "destructive" })
        }
      }

      toast({ title: "Success", description: "Profile updated" })
      setIsEditingProfile(false)
      // Refresh data
      await loadVolunteers()
      const refreshed = await getVolunteerProfile(profileVolunteer.id)
      setProfileDetails(refreshed)
    } catch (err) {
      console.error("Error saving profile:", err)
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" })
    }
  }

  const handleSetPrimaryLocation = async (areaId: number) => {
    if (!profileVolunteer) return
    const res = await setPrimaryLocation(profileVolunteer.id, areaId)
    if (res.success) {
      toast({ title: "Success", description: res.message })
      await loadVolunteers()
      // Refresh volunteer areas
      const v = (await getAllVolunteers()).find((x: any) => x.id === profileVolunteer.id)
      if (v) setProfileVolunteer(v)
    } else {
      toast({ title: "Error", description: res.message, variant: "destructive" })
    }
  }

  const handleRemoveArea = async (areaId: number) => {
    if (!profileVolunteer) return
    const confirmDelete = confirm("Remove this area assignment for the volunteer? This cannot be undone.")
    if (!confirmDelete) return
    const res = await removeVolunteerAssignment(areaId)
    if (res.success) {
      toast({ title: "Success", description: res.message })
      await loadVolunteers()
      const v = (await getAllVolunteers()).find((x: any) => x.id === profileVolunteer.id)
      if (v) setProfileVolunteer(v)
    } else {
      toast({ title: "Error", description: res.message, variant: "destructive" })
    }
  }

  const openManageLocationsDialog = (volunteer: Volunteer) => {
    setSelectedVolunteerForLocations(volunteer)
    const areas = volunteer.areas || []
    setSelectedVolunteerAreas(areas)

    // Pre-populate with existing assignments
    if (areas.length > 0) {
      setLocationSelections(
        areas.map((area: VolunteerArea) => ({
          barangay: area.barangay,
          is_primary: area.is_primary,
        })),
      )
    } else {
      // Start with primary location if no areas exist
      setLocationSelections(volunteer.barangay ? [{ barangay: volunteer.barangay, is_primary: true }] : [])
    }

    setIsManageLocationsDialogOpen(true)
  }

  const handleAddLocation = () => {
    setLocationSelections([...locationSelections, { barangay: "", is_primary: false }])
  }

  const handleRemoveLocation = (index: number) => {
    const newSelections = locationSelections.filter((_, i) => i !== index)
    // If we removed the primary, make the first one primary
    if (newSelections.length > 0 && !newSelections.some((loc) => loc.is_primary)) {
      newSelections[0].is_primary = true
    }
    setLocationSelections(newSelections)
  }

  const handleLocationChange = (index: number, barangay: string) => {
    const newSelections = [...locationSelections]
    newSelections[index].barangay = barangay
    setLocationSelections(newSelections)
  }

  const handlePrimaryChange = (index: number) => {
    const newSelections = locationSelections.map((loc, i) => ({
      ...loc,
      is_primary: i === index,
    }))
    setLocationSelections(newSelections)
  }

  const handleSaveLocations = async () => {
    if (!selectedVolunteerForLocations) return

    // Validate that all locations have a barangay selected
    if (locationSelections.some((loc) => !loc.barangay)) {
      toast({
        title: "Validation Error",
        description: "Please select a barangay for all locations",
        variant: "destructive",
      })
      return
    }

    // Ensure at least one location is primary
    if (!locationSelections.some((loc) => loc.is_primary)) {
      toast({
        title: "Validation Error",
        description: "Please mark one location as primary",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await assignMultipleLocations(selectedVolunteerForLocations.id, locationSelections)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsManageLocationsDialogOpen(false)
        await loadVolunteers()
      } else {
        toast({
          title: "Error",
          description: result.message,
        })
      }
    } catch (error) {
      console.error("Error saving locations:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
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

  return (
    <RouteGuard requireAuth requireRole="admin">
      <div className="min-h-screen bg-slate-950 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />

        <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-xl">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20">
                  <Cloud className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">WINDER+ Admin</h1>
                  <p className="text-sm text-slate-400">Emergency Management System</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
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
            <TabsList className="grid w-full grid-cols-4 bg-slate-900/80 border border-slate-800/50 p-1.5 rounded-xl backdrop-blur-sm shadow-lg">
              <TabsTrigger
                value="overview"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-300 data-[state=inactive]:hover:bg-slate-800/60 data-[state=inactive]:bg-slate-800/30 rounded-lg transition-all duration-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="emergencies"
                className="flex items-center justify-center gap-2 relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-300 data-[state=inactive]:hover:bg-slate-800/60 data-[state=inactive]:bg-slate-800/30 rounded-lg transition-all duration-200"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Emergencies</span>
                {emergencyStats.pending > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px]">
                    {emergencyStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="volunteer-reports"
                className="flex items-center justify-center gap-2 relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-300 data-[state=inactive]:hover:bg-slate-800/60 data-[state=inactive]:bg-slate-800/30 rounded-lg transition-all duration-200"
              >
                <Users className="w-4 h-4" />
                <span>Volunteers</span>
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
                className="flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-300 data-[state=inactive]:hover:bg-slate-800/60 data-[state=inactive]:bg-slate-800/30 rounded-lg transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 capitalize">
                        Pending
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{emergencyStats.pending}</p>
                    <p className="text-sm text-slate-400">Pending</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <Badge variant="outline" className="border-red-500/50 text-red-500 capitalize">
                        Critical
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{emergencyStats.critical}</p>
                    <p className="text-sm text-slate-400">Critical</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <Badge variant="outline" className="border-blue-500/50 text-blue-500 capitalize">
                        In Progress
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{emergencyStats.inProgress}</p>
                    <p className="text-sm text-slate-400">In Progress</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <Badge variant="outline" className="border-green-500/50 text-green-500 capitalize">
                        Resolved
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{emergencyStats.resolved}</p>
                    <p className="text-sm text-slate-400">Resolved</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <TrendingUp className="w-5 h-5 text-slate-400" />
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
                  className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  onClick={() => router.push("/admin/emergencies")}
                >
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center relative">
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
                      <ArrowRight className="w-5 h-5 text-slate-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  onClick={() => setActiveTab("volunteer-reports")}
                >
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center relative">
                          <Users className="w-6 h-6 text-green-500" />
                          {volunteerStats.active > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">{volunteerStats.active}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Volunteer Management</h3>
                          <p className="text-sm text-slate-400">Manage volunteers and view their reports</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                      {sharedLocations.length} Total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {sharedLocations.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sharedLocations.slice(0, 5).map((share) => (
                        <div
                          key={share.id}
                          className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 hover:border-blue-500/30 transition-all"
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

            {/* Emergencies Tab */}
            <TabsContent value="emergencies" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Emergency Management</h2>
                  <p className="text-slate-400">Handle and respond to emergency requests</p>
                </div>
                <Button 
                  onClick={() => router.push("/admin/emergencies")} 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/30"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
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

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
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

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
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

              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
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
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/30"
                      >
                        Manage Emergencies
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Volunteer Reports Tab */}
            <TabsContent value="volunteer-reports" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Volunteer Reports</h2>
                  <p className="text-slate-400">Field updates and reports from volunteers</p>
                </div>
                <Button
                  onClick={loadVolunteerUpdates}
                  variant="outline"
                  className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50"
                >
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
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

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
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

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
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

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
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

              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white">All Volunteer Reports</CardTitle>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                    {volunteerUpdates.length} Reports
                  </Badge>
                </CardHeader>
                <CardContent>
                  {isLoadingVolunteerUpdates ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
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
                            className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 hover:border-blue-500/30 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${getSeverityColor(update.severity)}/10`}
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
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white">Emergency Response</CardTitle>
                    <CardDescription className="text-slate-400">
                      Configure notification and response settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <div>
                        <Label className="text-white font-medium">Auto Notifications</Label>
                        <p className="text-sm text-slate-400">Instant alerts for new reports</p>
                      </div>
                      <Switch
                        checked={settings.autoNotifications}
                        onCheckedChange={(checked) => handleSettingChange("autoNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <div>
                        <Label className="text-white font-medium">Critical Alerts</Label>
                        <p className="text-sm text-slate-400">Priority alerts for critical situations</p>
                      </div>
                      <Switch
                        checked={settings.criticalAlerts}
                        onCheckedChange={(checked) => handleSettingChange("criticalAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
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

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white">Data Management</CardTitle>
                    <CardDescription className="text-slate-400">Configure data retention policies</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-white font-medium">Data Retention</Label>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                          Permanent
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">
                        All reports are permanently stored in the database
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-700/50">
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
                        className="w-full bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Manage Reports
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl flex flex-col">
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
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    {isLoadingUsers ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-slate-400">Loading admin users...</p>
                      </div>
                    ) : (
                      <>
                        <div
                          className="space-y-2 max-h-[300px] overflow-y-auto flex-1"
                          style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                        >
                          <style jsx>{`
                            div::-webkit-scrollbar {
                              display: none;
                            }
                          `}</style>
                          {adminUsers.map((adminUser) => (
                            <div
                              key={adminUser.id}
                              className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:bg-slate-800/40 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
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
                      </>
                    )}

                    <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50 mt-auto"
                          disabled={adminUsers.length >= 10 || isLoadingUsers}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Admin User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700 text-white backdrop-blur-xl">
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
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            disabled={isAddingUser}
                          >
                            {isAddingUser ? "Adding..." : "Add User"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Volunteer Management</CardTitle>
                        <CardDescription className="text-slate-400">Add and assign volunteers to areas</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {volunteers.length} Total
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    {isLoadingVolunteers ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-slate-700 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-slate-400">Loading volunteers...</p>
                      </div>
                    ) : volunteers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400">No volunteers added yet</p>
                      </div>
                    ) : (
                      <div
                        className="space-y-2 max-h-[300px] overflow-y-auto flex-1"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        <style jsx>{`
                          div::-webkit-scrollbar {
                            display: none;
                          }
                        `}</style>
                        {volunteers.map((volunteer: any) => {
                          return (
                            <div
                              key={volunteer.id}
                              className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:bg-slate-800/40 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  volunteer.is_validated ? 'bg-green-500/20' : 'bg-slate-500/20'
                                }`}>
                                  {volunteer.is_validated ? (
                                    <UserCheck className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <User className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-white truncate">{volunteer.full_name}</p>
                                    {!volunteer.is_active && (
                                      <Badge variant="secondary" className="bg-red-500/10 text-red-500 text-xs">
                                        Inactive
                                      </Badge>
                                    )}
                                    {volunteer.is_validated && (
                                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs">
                                        <UserCheck className="w-3 h-3 mr-1" />
                                        Validated
                                      </Badge>
                                    )}
                                    {!volunteer.is_validated && (
                                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 text-xs">
                                        <UserX className="w-3 h-3 mr-1" />
                                        Unvalidated
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 truncate">{volunteer.email}</p>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{volunteer.barangay || "No primary location"}</span>
                                    {volunteer.areas && volunteer.areas.length > 1 && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-blue-500/10 text-blue-400 text-[10px] px-1"
                                      >
                                        +{volunteer.areas.length - 1} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Validation Button - Changes based on current state */}
                                {!volunteer.is_validated ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setVolunteerToValidate(volunteer)}
                                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10 border border-green-500/30"
                                    title="Validate Volunteer"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    <span className="ml-1 text-xs">Validate</span>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setVolunteerToRevoke(volunteer)}
                                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 border border-yellow-500/30"
                                    title="Unvalidate Volunteer"
                                  >
                                    <UserX className="w-4 h-4" />
                                    <span className="ml-1 text-xs">Unvalidate</span>
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openVolunteerProfile(volunteer)}
                                  className="text-slate-300 hover:text-white hover:bg-slate-700/20"
                                  title="View Profile"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>

                                {/* Message action removed from row — available in profile modal */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openManageLocationsDialog(volunteer)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  title="Manage locations"
                                >
                                  <MapPin className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(volunteer)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setVolunteerToDelete(volunteer)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <Dialog open={isAddVolunteerDialogOpen} onOpenChange={setIsAddVolunteerDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50 mt-auto"
                          disabled={isLoadingVolunteers}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Volunteer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md backdrop-blur-xl">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add New Volunteer</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Create a new volunteer account and assign to a barangay
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label className="text-white">Full Name</Label>
                            <Input
                              placeholder="Juan Dela Cruz"
                              value={newVolunteerForm.full_name}
                              onChange={(e) => setNewVolunteerForm({ ...newVolunteerForm, full_name: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              disabled={isAddingVolunteer}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Email</Label>
                            <Input
                              type="email"
                              placeholder="volunteer@example.com"
                              value={newVolunteerForm.email}
                              onChange={(e) => setNewVolunteerForm({ ...newVolunteerForm, email: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              disabled={isAddingVolunteer}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Password</Label>
                            <Input
                              type="password"
                              placeholder="Min. 6 characters"
                              value={newVolunteerForm.password}
                              onChange={(e) => setNewVolunteerForm({ ...newVolunteerForm, password: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              disabled={isAddingVolunteer}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Phone Number</Label>
                            <Input
                              placeholder="0917-123-4567"
                              value={newVolunteerForm.phone_number}
                              onChange={(e) =>
                                setNewVolunteerForm({ ...newVolunteerForm, phone_number: e.target.value })
                              }
                              className="bg-slate-800 border-slate-700 text-white"
                              disabled={isAddingVolunteer}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Assigned Barangay</Label>
                            <Select
                              value={newVolunteerForm.barangay}
                              onValueChange={(value) => setNewVolunteerForm({ ...newVolunteerForm, barangay: value })}
                              disabled={isAddingVolunteer}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder="Select barangay" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {getOlongapoBarangays().map((barangay) => (
                                  <SelectItem key={barangay} value={barangay} className="text-white">
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
                            onClick={() => setIsAddVolunteerDialogOpen(false)}
                            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                            disabled={isAddingVolunteer}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddVolunteer}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                            disabled={isAddingVolunteer}
                          >
                            {isAddingVolunteer ? "Adding..." : "Add Volunteer"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>

              {/* Feedback Management Card */}
              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    Volunteer Feedback System
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Review and provide feedback to volunteers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <p className="text-2xl font-bold text-white">{feedbackStats.total}</p>
                      <p className="text-sm text-slate-400">Total</p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <p className="text-2xl font-bold text-green-500">{feedbackStats.approved}</p>
                      <p className="text-sm text-slate-400">Approved</p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <p className="text-2xl font-bold text-yellow-500">{feedbackStats.pending}</p>
                      <p className="text-sm text-slate-400">Pending</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {volunteerFeedback.slice(0, 5).map((feedback) => (
                      <div key={feedback.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            feedback.status === 'approved' ? 'bg-green-500' :
                            feedback.status === 'rejected' ? 'bg-red-500' :
                            feedback.status === 'needs_improvement' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-white">{feedback.volunteer_name}</p>
                            <p className="text-xs text-slate-400">{feedback.feedback_type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${
                                  i < feedback.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'
                                }`} 
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {volunteerFeedback.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-slate-400">No feedback given yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/")}
                      className="h-auto py-6 bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50 transition-all"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Globe className="w-6 h-6" />
                        <span>Weather App</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin/emergencies")}
                      className="h-auto py-6 bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50 transition-all"
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

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Provide Feedback</DialogTitle>
            <DialogDescription className="text-slate-400">
              Give feedback to {selectedVolunteerForFeedback?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Feedback Type</Label>
              <Select
                value={feedbackForm.feedback_type}
                onValueChange={(value: 'validation' | 'performance' | 'general') => 
                  setFeedbackForm({...feedbackForm, feedback_type: value})
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="validation" className="text-white">Validation</SelectItem>
                  <SelectItem value="performance" className="text-white">Performance</SelectItem>
                  <SelectItem value="general" className="text-white">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFeedbackForm({...feedbackForm, rating: star})}
                    className={`p-1 hover:bg-transparent ${
                      star <= feedbackForm.rating ? 'text-yellow-500' : 'text-gray-500'
                    }`}
                  >
                    <Star className={`w-6 h-6 ${star <= feedbackForm.rating ? 'fill-yellow-500' : ''}`} />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Status</Label>
              <Select
                value={feedbackForm.status}
                onValueChange={(value: 'pending' | 'approved' | 'rejected' | 'needs_improvement') => 
                  setFeedbackForm({...feedbackForm, status: value})
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="approved" className="text-white">Approved</SelectItem>
                  <SelectItem value="needs_improvement" className="text-white">Needs Improvement</SelectItem>
                  <SelectItem value="rejected" className="text-white">Rejected</SelectItem>
                  <SelectItem value="pending" className="text-white">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Comments</Label>
              <textarea
                placeholder="Provide detailed feedback..."
                value={feedbackForm.comments}
                onChange={(e) => setFeedbackForm({...feedbackForm, comments: e.target.value})}
                className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFeedbackDialogOpen(false)}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Volunteer Profile Dialog - FIXED DESIGN */}
<Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
  <DialogContent className="bg-slate-900/95 border-slate-700/40 text-white w-[92vw] sm:max-w-4xl max-w-[calc(100%-2rem)] backdrop-blur-xl rounded-2xl p-0 overflow-hidden">
    {/* Header */}
    <div className="sticky top-0 z-10 bg-slate-900/90 border-b border-slate-700/40 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <DialogTitle className="text-white text-xl">Volunteer Profile</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review details, reports, and feedback for {profileVolunteer?.full_name}
            </DialogDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsProfileDialogOpen(false)}
          className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>

    <style jsx>{`
      .profile-modal-scroll::-webkit-scrollbar { display: none; }
      .profile-modal-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>

    <div className="flex flex-col lg:flex-row max-h-[70vh] overflow-hidden">
      {/* Left Column - Basic Info */}
      <div
        className="lg:w-1/3 border-r border-slate-700/40 p-6 overflow-y-auto profile-modal-scroll"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Profile Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center border border-slate-700/50">
              <User className="w-8 h-8 text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-white truncate">{profileVolunteer?.full_name}</p>
              <p className="text-sm text-slate-400 truncate">{profileVolunteer?.email}</p>
              {profileVolunteer?.phone_number && (
                <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {profileVolunteer.phone_number}
                </p>
              )}
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            {profileValidation.is_validated ? (
              <Badge className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Validated
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-500/30 flex items-center gap-1.5">
                <UserX className="w-4 h-4" />
                Unvalidated
              </Badge>
            )}
            {!profileVolunteer?.is_active && (
              <Badge className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full">
                Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Primary Location */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            Primary Location
          </h4>
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
            <p className="text-white font-medium">{profileVolunteer?.barangay || "Not assigned"}</p>
            <p className="text-sm text-slate-400 mt-1">{profileVolunteer?.municipality || "Olongapo City"}</p>
          </div>
        </div>

        {/* Assigned Areas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-300">Assigned Areas</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => profileVolunteer && openManageLocationsDialog(profileVolunteer)}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-xs px-3 py-1.5 h-auto"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Manage Areas
            </Button>
          </div>
          
          {profileVolunteer?.areas && profileVolunteer.areas.length > 0 ? (
            <div className="space-y-2">
              {profileVolunteer.areas.map((area: any) => (
                <div key={area.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-4 h-4 ${area.is_primary ? 'text-green-400' : 'text-blue-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{area.barangay}</p>
                      <p className="text-xs text-slate-400">
                        {area.is_primary ? "Primary" : "Secondary"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!area.is_primary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetPrimaryLocation(area.id)}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-1"
                        title="Set as Primary"
                      >
                        <MapPin className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveArea(area.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1"
                      title="Remove Area"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-slate-700/50 rounded-xl text-center">
              <MapPin className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No areas assigned</p>
              <p className="text-xs text-slate-500 mt-1">Manage areas to assign locations</p>
            </div>
          )}
        </div>

        {/* Bio Section */}
        {(profileDetails?.bio || isEditingProfile) && (
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">About</h4>
            {isEditingProfile ? (
              <textarea
                value={editProfileForm.bio}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 resize-none h-32 text-sm"
                placeholder="Tell us about this volunteer..."
              />
            ) : (
              <p className="text-sm text-slate-300 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 leading-relaxed">
                {profileDetails.bio}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right Column - Reports & Feedback */}
      <div
        className="lg:w-2/3 p-6 overflow-y-auto profile-modal-scroll"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Recent Reports Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Recent Reports</h4>
                <p className="text-sm text-slate-400">
                  {volunteerUpdates.filter(u => u.volunteer_name === profileVolunteer?.full_name).length} reports submitted
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              {volunteerUpdates.filter(u => u.volunteer_name === profileVolunteer?.full_name).length} total
            </Badge>
          </div>

          {volunteerUpdates.filter(u => u.volunteer_name === profileVolunteer?.full_name).length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-xl">
              <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">No reports submitted</p>
              <p className="text-xs text-slate-500">This volunteer hasn't submitted any reports yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {volunteerUpdates
                .filter(u => u.volunteer_name === profileVolunteer?.full_name)
                .slice(0, 5)
                .map((u) => {
                  const TypeIcon = getUpdateTypeInfo(u.update_type).icon
                  const typeColor = getUpdateTypeInfo(u.update_type).color
                  
                  return (
                    <div key={u.id} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getSeverityColor(u.severity)}/10 flex-shrink-0`}>
                          <TypeIcon className={`w-6 h-6 ${typeColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-white mb-1">{u.title}</h5>
                              <p className="text-sm text-slate-400 line-clamp-2">{u.description}</p>
                            </div>
                            <Badge 
                              className={`ml-2 flex-shrink-0 ${
                                u.severity === "critical" ? "bg-red-500/20 text-red-400" :
                                u.severity === "high" ? "bg-orange-500/20 text-orange-400" :
                                u.severity === "moderate" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-blue-500/20 text-blue-400"
                              } capitalize`}
                            >
                              {u.severity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge 
                              variant="outline" 
                              className={`${
                                u.status === "active" ? "border-green-500/50 text-green-500" :
                                u.status === "resolved" ? "border-blue-500/50 text-blue-500" :
                                "border-slate-600 text-slate-400"
                              } capitalize text-xs`}
                            >
                              {u.status}
                            </Badge>
                            <span className="text-xs text-slate-500">{formatDate(u.created_at)}</span>
                            <span className="text-xs text-slate-500">{u.barangay}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Feedback & History Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Feedback & History</h4>
                <p className="text-sm text-slate-400">
                  {volunteerFeedback.filter(f => f.volunteer_name === profileVolunteer?.full_name).length} feedback records
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              {volunteerFeedback.filter(f => f.volunteer_name === profileVolunteer?.full_name).length} records
            </Badge>
          </div>

          {volunteerFeedback.filter(f => f.volunteer_name === profileVolunteer?.full_name).length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-xl">
              <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">No feedback recorded</p>
              <p className="text-xs text-slate-500">No feedback has been given to this volunteer yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {volunteerFeedback
                .filter(f => f.volunteer_name === profileVolunteer?.full_name)
                .slice(0, 5)
                .map((f) => (
                  <div key={f.id} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`${
                            f.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            f.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            f.status === 'needs_improvement' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          } capitalize`}
                        >
                          {f.status}
                        </Badge>
                        <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                          {f.feedback_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(f.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <p className="text-sm text-slate-300 mb-3">{f.comments || "No comments provided."}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < f.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">Rating: {f.rating}/5</span>
                      </div>
                      <p className="text-xs text-slate-400">By: {f.admin_name}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Footer Actions */}
    <div className="sticky bottom-0 bg-slate-900/90 border-t border-slate-700/40 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {profileValidation.is_validated ? (
            <Button
              onClick={async () => {
                if (!profileVolunteer) return
                const res = await revokeValidation(profileVolunteer.id)
                if (res.success) {
                  toast({ title: "Success", description: res.message })
                  setProfileValidation({ is_validated: false })
                  await loadVolunteers()
                } else {
                  toast({ title: "Error", description: res.message, variant: "destructive" })
                }
              }}
              variant="outline"
              className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 px-4"
            >
              <UserX className="w-4 h-4 mr-2" />
              Revoke Validation
            </Button>
          ) : (
            <Button
              onClick={async () => {
                if (!profileVolunteer) return
                const res = await validateVolunteer(profileVolunteer.id)
                if (res.success) {
                  toast({ title: "Success", description: res.message })
                  setProfileValidation({ is_validated: true })
                  await loadVolunteers()
                } else {
                  toast({ title: "Error", description: res.message, variant: "destructive" })
                }
              }}
              variant="outline"
              className="border-green-500/50 text-green-400 hover:bg-green-500/10 px-4"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Validate Volunteer
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={() => {
              if (!profileVolunteer) return
              setSelectedVolunteerForFeedback(profileVolunteer)
              setIsFeedbackDialogOpen(true)
            }}
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-4"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Feedback
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              const payload = {
                volunteer: profileVolunteer,
                profile: profileDetails,
                recent_reports: volunteerUpdates.filter(u => u.volunteer_name === profileVolunteer?.full_name),
                feedback: volunteerFeedback.filter(f => f.volunteer_name === profileVolunteer?.full_name),
              }
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `${profileVolunteer?.full_name?.replace(/\s+/g, "_") || "volunteer"}_profile.json`
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
              toast({
                title: "Exported",
                description: "Volunteer profile exported successfully",
              })
            }}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 px-4"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          {isEditingProfile ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditingProfile(false)}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-4"
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setIsEditingProfile(true)}
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-4"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsProfileDialogOpen(false)}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 px-4"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>

      {/* Admin User Deletion Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white backdrop-blur-xl">
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

      {/* Volunteer Deletion Dialog */}
      <AlertDialog open={!!volunteerToDelete} onOpenChange={() => setVolunteerToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Volunteer</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to remove <strong>{volunteerToDelete?.full_name}</strong> (
              {volunteerToDelete?.email})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => volunteerToDelete && handleDeleteVolunteer(volunteerToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Volunteer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Volunteer Validation Dialog */}
      <AlertDialog open={!!volunteerToValidate} onOpenChange={() => setVolunteerToValidate(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Validate Volunteer</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to validate <strong>{volunteerToValidate?.full_name}</strong>? 
              This will mark them as a validated volunteer in the system and they will receive a validated badge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleValidateVolunteer}
              className="bg-green-600 hover:bg-green-700"
              disabled={isValidatingVolunteer}
            >
              {isValidatingVolunteer ? "Validating..." : "Validate Volunteer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Volunteer Unvalidation Dialog */}
      <AlertDialog open={!!volunteerToRevoke} onOpenChange={() => setVolunteerToRevoke(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Unvalidate Volunteer</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to unvalidate <strong>{volunteerToRevoke?.full_name}</strong>? 
              This will remove their validated status and badge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeValidation}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Unvalidate Volunteer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteGuard>
  )
}