"use client"

import { useState } from "react"
import { Phone, AlertTriangle, Clock, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface QuickEmergencyCallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenFullReport?: () => void
  onDialNumber?: (number: string) => void
}

export function QuickEmergencyCallModal({
  open,
  onOpenChange,
  onOpenFullReport,
  onDialNumber,
}: QuickEmergencyCallModalProps) {
  const { toast } = useToast()
  const [dialing, setDialing] = useState<string | null>(null)

  const emergencyNumbers = [
    {
      number: "911",
      label: "Police / Primary Emergency",
      description: "National emergency hotline for immediate response",
      color: "from-red-600 to-red-700",
      hoverColor: "hover:from-red-500 hover:to-red-600",
      icon: "🚨",
    },
    {
      number: "143",
      label: "Medical / Red Cross",
      description: "Philippine Red Cross emergency medical services",
      color: "from-green-600 to-green-700",
      hoverColor: "hover:from-green-500 hover:to-green-600",
      icon: "💚",
    },
    {
      number: "117",
      label: "Police / Additional Services",
      description: "Local police and additional emergency services",
      color: "from-orange-600 to-orange-700",
      hoverColor: "hover:from-orange-500 hover:to-orange-600",
      icon: "📞",
    },
  ]

  const triggerHapticFeedback = (pattern: number | number[] = 50) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch (error) {
        console.debug("Haptic feedback not available")
      }
    }
  }

  const handleDial = async (number: string) => {
    // Trigger haptic feedback
    triggerHapticFeedback([50, 30, 100])

    setDialing(number)

    // Show toast notification
    toast({
      title: "Connecting...",
      description: `Calling ${number}`,
      duration: 2000,
    })

    // Callback if provided
    if (onDialNumber) {
      onDialNumber(number)
    }

    // Small delay for UX feedback
    setTimeout(() => {
      // Initiate call
      window.open(`tel:${number}`, "_self")

      // Close modal after a brief delay
      setTimeout(() => {
        onOpenChange(false)
        setDialing(null)
      }, 500)
    }, 200)
  }

  const handleOpenFullReport = () => {
    triggerHapticFeedback(50)
    onOpenChange(false)

    // Delay to ensure modal closes first
    setTimeout(() => {
      if (onOpenFullReport) {
        onOpenFullReport()
      }
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] sm:w-[90vw] md:w-[500px] max-h-[90vh] overflow-y-auto
        bg-linear-to-br from-slate-950 via-slate-900 to-slate-950
        border border-slate-700/60 rounded-2xl shadow-2xl
        data-[state=open]:slide-in-from-bottom-10 md:data-[state=open]:slide-in-from-center"
      >
        {/* Header */}
        <DialogHeader className="sticky top-0 bg-linear-to-b from-slate-950 to-slate-900/50 -m-6 p-6 pb-4 border-b border-slate-700/50">
          <DialogTitle className="flex items-center gap-3 text-xl md:text-2xl font-bold text-white">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-red-600 to-red-700 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg animate-pulse">
              <Phone className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span>Emergency Hotlines</span>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-3 py-4 md:py-6">
          {/* Emergency numbers */}
          {emergencyNumbers.map(
            ({ number, label, description, color, hoverColor, icon }, index) => (
              <Button
                key={number}
                onClick={() => handleDial(number)}
                disabled={dialing !== null}
                className={`w-full h-auto py-4 md:py-5 px-4 md:px-6
                bg-linear-to-r ${color} ${hoverColor}
                text-white font-bold
                transition-all duration-200
                flex items-center justify-between
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-95
                hover:shadow-xl hover:shadow-red-500/20`}
              >
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 text-left">
                  <span className="text-2xl md:text-3xl shrink-0">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xl md:text-2xl font-bold tabular-nums">{number}</div>
                    <div className="text-sm md:text-base font-semibold text-white/90">{label}</div>
                    <div className="text-xs text-white/70 truncate">{description}</div>
                  </div>
                </div>
                <Phone className="w-5 h-5 md:w-6 md:h-6 shrink-0 ml-2" />
              </Button>
            ),
          )}
        </div>

        {/* Divider */}
        <div className="relative my-4 md:my-6">
          <div className="absolute inset-x-0 top-1/2 h-px bg-linear-to-r from-transparent via-slate-700 to-transparent"></div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-slate-900 text-xs md:text-sm text-slate-400 font-medium">
              Need detailed report?
            </span>
          </div>
        </div>

        {/* Full Report Button */}
        <Button
          onClick={handleOpenFullReport}
          className="w-full py-3 md:py-4 px-4 md:px-6
          bg-linear-to-r from-blue-600 to-blue-700
          hover:from-blue-500 hover:to-blue-600
          text-white font-semibold text-base md:text-lg
          transition-all duration-200
          flex items-center justify-center gap-2
          active:scale-95
          hover:shadow-xl hover:shadow-blue-500/20 mb-2 md:mb-3"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Report Emergency with Details</span>
        </Button>

        {/* Info Box */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 md:p-4 mt-4 md:mt-6 flex gap-3">
          <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-slate-300">
            <p className="font-semibold text-white mb-1">For life-threatening emergencies:</p>
            <p className="text-slate-400">
              Call <span className="font-bold text-red-300">911</span> immediately. Don't wait for a form. Your safety comes first.
            </p>
          </div>
        </div>

        {/* Additional help info */}
        <div className="bg-slate-800/20 rounded-lg p-3 md:p-4 mt-3 md:mt-4 flex gap-3">
          <MapPin className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-slate-400">
            <p>
              Your location will be automatically shared with emergency responders to help them reach you faster.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
