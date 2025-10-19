"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Heart, Flame, AlertCircle, Zap, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportEmergencyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEmergencyTypeSelect: (type: string, description: string) => void
  onEmergencyReport: (type: string, description: string) => void
  isQuickActionsFlow?: boolean
  onQuickActionsReturn?: () => void
}

export function ReportEmergencyModal({
  open,
  onOpenChange,
  onEmergencyTypeSelect,
  onEmergencyReport,
  isQuickActionsFlow = false,
  onQuickActionsReturn,
}: ReportEmergencyModalProps) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    emergencyType: "",
    description: "",
    peopleCount: 1,
  })
  const { toast } = useToast()

  const handleClose = (open: boolean) => {
    onOpenChange(open)
    if (!open && isQuickActionsFlow && onQuickActionsReturn) {
      setTimeout(() => onQuickActionsReturn(), 100)
    }
  }

  const handleEmergencyTypeSelect = (type: string, description: string) => {
    setFormData((prev) => ({ ...prev, emergencyType: type, description }))
    setShowForm(true)
    onEmergencyTypeSelect(type, description)
  }

  const handleSubmit = () => {
    if (!formData.senderName.trim() || !formData.senderPhone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and phone number",
        variant: "destructive",
        duration: 5000,
      })
      return
    }
    onEmergencyReport(formData.emergencyType, formData.description)
    setShowForm(false)
    setFormData({
      senderName: "",
      senderPhone: "",
      emergencyType: "",
      description: "",
      peopleCount: 1,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-[95vw] sm:w-[70vw] lg:w-[40vw] max-w-lg
        mx-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
        border border-slate-700/60 text-white rounded-2xl sm:rounded-3xl shadow-2xl
        p-0 overflow-hidden animate-fadeInScale"
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b border-slate-700/50">
          <DialogTitle className="flex items-center gap-3 sm:gap-4 text-lg sm:text-2xl font-bold">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-red-600 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
            </div>
            <span>Report Emergency</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-4 sm:p-6 space-y-4">
          {showForm ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-slate-300 leading-relaxed">
                  Please provide your contact information so emergency services can reach you.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="senderName" className="text-slate-300 text-sm font-medium">
                    Your Full Name *
                  </Label>
                  <Input
                    id="senderName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.senderName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, senderName: e.target.value }))}
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="senderPhone" className="text-slate-300 text-sm font-medium">
                    Phone Number *
                  </Label>
                  <Input
                    id="senderPhone"
                    type="tel"
                    placeholder="+63 XXX XXX XXXX"
                    value={formData.senderPhone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, senderPhone: e.target.value }))}
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="peopleCount" className="text-slate-300 text-sm font-medium">
                    Number of People Affected
                  </Label>
                  <Input
                    id="peopleCount"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.peopleCount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        peopleCount: Number.parseInt(e.target.value) || 1,
                      }))
                    }
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>

                <div className="bg-slate-800/30 p-3 rounded-lg">
                  <p className="text-sm text-slate-300">
                    <strong>Emergency Type:</strong>{" "}
                    {formData.emergencyType.charAt(0).toUpperCase() + formData.emergencyType.slice(1)}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">{formData.description}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white"
                  disabled={!formData.senderName.trim() || !formData.senderPhone.trim()}
                >
                  Send Emergency Report
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-300 leading-relaxed text-center">
                Select the type of emergency to report. Your location will be automatically shared with emergency
                services.
              </p>

              <div className="space-y-3">
                {/* Medical Emergency */}
                <Button
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400
                  text-white rounded-xl py-4 font-semibold shadow-lg transition hover:scale-[1.02] flex items-center justify-start gap-3"
                  onClick={() =>
                    handleEmergencyTypeSelect("medical", "Medical emergency - immediate assistance needed")
                  }
                >
                  <Heart className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Medical Emergency</div>
                    <div className="text-xs opacity-90">Injury, illness, or health crisis</div>
                  </div>
                </Button>

                {/* Fire Emergency */}
                <Button
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400
                  text-white rounded-xl py-4 font-semibold shadow-lg transition hover:scale-[1.02] flex items-center justify-start gap-3"
                  onClick={() => handleEmergencyTypeSelect("fire", "Fire emergency - fire department needed")}
                >
                  <Flame className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Fire Emergency</div>
                    <div className="text-xs opacity-90">Fire, smoke, or explosion</div>
                  </div>
                </Button>

                {/* Accident */}
                <Button
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400
                  text-white rounded-xl py-4 font-semibold shadow-lg transition hover:scale-[1.02] flex items-center justify-start gap-3"
                  onClick={() => handleEmergencyTypeSelect("accident", "Traffic or workplace accident")}
                >
                  <AlertCircle className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Accident</div>
                    <div className="text-xs opacity-90">Traffic or workplace incident</div>
                  </div>
                </Button>

                {/* Crime */}
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400
                  text-white rounded-xl py-4 font-semibold shadow-lg transition hover:scale-[1.02] flex items-center justify-start gap-3"
                  onClick={() => handleEmergencyTypeSelect("crime", "Crime in progress or suspicious activity")}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Crime</div>
                    <div className="text-xs opacity-90">Theft, assault, or suspicious activity</div>
                  </div>
                </Button>

                {/* Natural Disaster */}
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                  text-white rounded-xl py-4 font-semibold shadow-lg transition hover:scale-[1.02] flex items-center justify-start gap-3"
                  onClick={() =>
                    handleEmergencyTypeSelect("natural-disaster", "Natural disaster - earthquake, flood, etc.")
                  }
                >
                  <Zap className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Natural Disaster</div>
                    <div className="text-xs opacity-90">Earthquake, flood, or severe weather</div>
                  </div>
                </Button>

                {/* Other */}
                <Button
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400
                  text-white rounded-xl py-4 font-semibold shadow-lg transition hover:scale-[1.02] flex items-center justify-start gap-3"
                  onClick={() => handleEmergencyTypeSelect("other", "Other emergency situation")}
                >
                  <Users className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Other Emergency</div>
                    <div className="text-xs opacity-90">Other urgent situation</div>
                  </div>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
