"use client"

import { useState, useRef, useEffect } from "react"
import { Phone, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FloatingEmergencyButtonProps {
  onOpenQuickCall: () => void
  onOpenFullReport?: () => void
}

export function FloatingEmergencyButton({
  onOpenQuickCall,
  onOpenFullReport,
}: FloatingEmergencyButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const lastTapRef = useRef<number>(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [showToast, setShowToast] = useState(false)

  const triggerHapticFeedback = (pattern: number | number[] = 50) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch (error) {
        console.debug("Haptic feedback not available")
      }
    }
  }

  const handleMouseDown = () => {
    // Long press detection for full report (optional)
    longPressTimerRef.current = setTimeout(() => {
      if (onOpenFullReport) {
        triggerHapticFeedback([50, 30, 50])
        onOpenFullReport()
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 600)
      }
    }, 500)
  }

  const handleMouseUp = () => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleTap = () => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapRef.current

    // Trigger haptic feedback
    triggerHapticFeedback(50)

    // Animate button
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 600)

    // Double-tap detection (optional feature)
    // Uncomment if you want to implement double-tap for full report
    // if (timeSinceLastTap < 300 && onOpenFullReport) {
    //   triggerHapticFeedback([50, 30, 100])
    //   onOpenFullReport()
    //   lastTapRef.current = 0
    //   return
    // }

    // Single tap: open quick call modal
    lastTapRef.current = now
    showConfirmation()
    onOpenQuickCall()
  }

  const showConfirmation = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 1500)
  }

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 pointer-events-none">
      {/* Pulse ring animation (background) */}
      <div
        className={`absolute inset-0 rounded-full bg-red-500/20 
        ${isAnimating || isHovered ? "animate-pulse" : "animate-pulse"} 
        pointer-events-none transition-all duration-300`}
        style={{
          transform: isAnimating ? "scale(1.2)" : "scale(1)",
          opacity: isHovered ? 0.8 : 0.5,
        }}
      ></div>

      {/* Confirmation badge */}
      {showToast && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-fadeInScale pointer-events-none">
          📞 Emergency SOS active
        </div>
      )}

      {/* Main FAB button */}
      <Button
        onClick={handleTap}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          handleMouseUp()
          setIsHovered(false)
        }}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full 
        bg-linear-to-br from-red-600 via-red-500 to-red-700 
        hover:from-red-500 hover:via-red-400 hover:to-red-600
        shadow-lg hover:shadow-2xl hover:shadow-red-500/50
        transition-all duration-200 ease-out
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-950
        active:scale-95
        ${isAnimating ? "scale-110" : "scale-100"}
        ${isHovered ? "scale-110 -translate-y-1" : "scale-100"}
        pointer-events-auto
        cursor-pointer`}
        aria-label="Emergency SOS - Quick dial emergency numbers"
        aria-description="Tap to access emergency hotlines (911, 143, 117). Long press for detailed report."
        title="Emergency SOS"
      >
        {/* Inner glow effect */}
        <div className="absolute inset-1 rounded-full bg-linear-to-tr from-red-300/20 to-transparent"></div>

        {/* Phone icon */}
        <Phone className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-md relative z-10" />

        {/* Alert indicator badge */}
        <div className="absolute top-1 right-1 w-3 h-3 md:w-3.5 md:h-3.5 bg-yellow-300 rounded-full shadow-lg animate-pulse z-20">
          <div className="absolute inset-0 rounded-full bg-yellow-300 animate-ping opacity-75"></div>
        </div>
      </Button>

      {/* Tooltip (desktop only, visible on hover) */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 whitespace-nowrap bg-slate-950 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg border border-slate-700/50 pointer-events-none animate-fadeInScale">
          Emergency SOS
          <div className="text-[10px] text-slate-400 font-normal">Tap for hotlines</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-0.5 w-2 h-2 bg-slate-950 border-r border-b border-slate-700/50 rotate-45"></div>
        </div>
      )}

      {/* Mobile accessibility label */}
      <div className="hidden md:block absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs text-slate-400 text-center whitespace-nowrap pointer-events-none font-medium">
        Emergency<br />
        <span className="text-red-400 font-bold">SOS</span>
      </div>
    </div>
  )
}
