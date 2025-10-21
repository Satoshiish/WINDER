"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  AlertTriangle,
  Phone,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Cloud,
  Sun,
  CloudRain,
  Settings,
  Bell,
  Search,
  X,
  Clock,
  CloudDrizzle,
  Zap,
  Eye,
  Heart,
  Lock,
  Users,
  Shield,
  Car,
  Flame,
  Thermometer,
  Wind,
  Package,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react" // Import useMemo
import { InlineFeed } from "@/components/social/inline-feed"

import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import {
  SearchSkeleton,
  LocationSkeleton,
  WeatherCardSkeleton,
  ForecastSkeleton,
} from "@/components/skeletons/weather-skeleton"
import { RiskPredictionCard } from "@/components/risk-prediction-card"

import { useRouter } from "next/navigation" // Import useRouter
import { useAuth } from "@/hooks/use-auth" // Replace Clerk with custom auth
// import {useUser} from "@clerk/nextjs" // Import useUser
import { useLocationSharing } from "@/contexts/location-sharing-context"
import { saveEmergencyReport } from "@/lib/emergency-db"
import { EvacuationMap } from "@/components/evacuation-map"
import { MapView } from "@/components/map-view"
import { EmergencyKitTracker } from "@/components/emergency-kit-tracker"
import { SMSSettings } from "@/components/sms-settings"
import { sendSMS } from "@/lib/sms-service" // Add sendSMS import at the top with other imports

interface WeatherData {
  temperature: number
  condition: string
  description: string
  location: string
  humidity: number
  windSpeed: number
  feelsLike: number
  icon?: string
}

interface WeatherHistoryEntry {
  id: string
  date: string
  time: string
  temperature: number
  condition: string
  description: string
  location: string
  locationName?: string
  humidity: number
  windSpeed: number
  feelsLike: number
  icon?: string
  timestamp: number
}

interface Alert {
  id: string
  type: string
  severity: string
  title: string
  description: string
  areas: string[]
  validUntil: Date
  issued: Date
}

interface RiskPrediction {
  category: string
  risk: number
  trend: string
  description: string
}

interface ForecastDay {
  date: string
  temperature: { min: number; max: number }
  condition: string
  description: string
  humidity: number
  windSpeed: number
  rainfall: number
  icon?: string
}

// Define WeatherIndices interface
interface WeatherIndices {
  heatIndex: {
    value: number
    category: string
    color: string
    advisory: string
  }
  uvIndex: {
    value: number
    category: string
    color: string
    advisory: string
  }
  typhoonImpactIndex: {
    value: number
    category: string
    color: string
    advisory: string
    typhoonLevel?: string
  }
}

export default function Home() {
  const { toast } = useToast()
  const router = useRouter() // Initialize useRouter
  const { user } = useAuth() // Use custom auth instead of Clerk
  // const {user} = useUser() // Get user object
  const { addSharedLocation } = useLocationSharing()

  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [riskPredictions, setRiskPredictions] = useState<RiskPrediction[]>([])
  const [weatherIndices, setWeatherIndices] = useState<WeatherIndices | null>(null)
  const [forecast, setForecast] = useState<ForecastDay[]>([])

  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [searchLocation, setSearchLocation] = useState("")
  const [searchWeather, setSearchWeather] = useState<WeatherData | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)
  const [weatherMapModalOpen, setWeatherMapModalOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [selectedLocationName, setSelectedLocationName] = useState("")
  const [currentLocationName, setCurrentLocationName] = useState("")
  const [activeView, setActiveView] = useState("dashboard")
  const [alertsModalOpen, setAlertsModalOpen] = useState(false)
  const [forecastModalOpen, setForecastModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [windModalOpen, setWindModalOpen] = useState(false)
  const [emergencyKitModalOpen, setEmergencyKitModalOpen] = useState(false)
  const [locationSharingModalOpen, setLocationSharingModalOpen] = useState(false)
  const [weatherHistoryModalOpen, setWeatherHistoryModalOpen] = useState(false)
  const [weatherHistory, setWeatherHistory] = useState<WeatherHistoryEntry[]>([])
  const [historyFilter, setHistoryFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [historyLoading, setHistoryLoading] = useState(false)

  const [notifications, setNotifications] = useState<
    Array<{
      id: string
      title: string
      message: string
      type: "warning" | "info" | "error" | "news"
      timestamp: Date
      isVisible: boolean
    }>
  >([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false)
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null)

  const [temperatureUnit, setTemperatureUnit] = useState<"celsius" | "fahrenheit">("celsius")
  const [windSpeedUnit, setWindSpeedUnit] = useState<"kmh" | "mph" | "ms">("kmh")
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(true)
  const [isLocationLoading, setIsLocationLoading] = useState(false)

  const [suggestedLocations, setSuggestedLocations] = useState<
    Array<{
      name: string
      temperature: number
      condition: string
      icon: string
      reason: string
      score: number
    }>
  >([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [smartSuggestions, setSmartSuggestions] = useState<
    Array<{
      location: string
      temp: number
      condition: string
    }>
  >([])

  const [previousWeatherData, setPreviousWeatherData] = useState<any>(null)
  const [previousLocation, setPreviousLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationMonitoringInterval, setLocationMonitoringInterval] = useState<NodeJS.Timeout | null>(null)
  const [weatherMonitoringInterval, setWeatherMonitoringInterval] = useState<NodeJS.Timeout | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const [currentLocationLoading, setCurrentLocationLoading] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false) // Added state for the location sharing modal
  const [showEvacuationMap, setShowEvacuationMap] = useState(false) // State to toggle between weather map and evacuation map

  // State for emergency form fields
  const [emergencyFormData, setEmergencyFormData] = useState({
    senderName: "",
    senderPhone: "",
    emergencyType: "",
    description: "",
    peopleCount: 1,
  })
  const [emergencyDescription, setEmergencyDescription] = useState("") // Specific state for the description input
  const [showEmergencyForm, setShowEmergencyForm] = useState(false)
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(true) // Controls the initial emergency prompt
  const [quickActionsModalOpen, setQuickActionsModalOpen] = useState(false)
  const [isQuickActionsFlow, setIsQuickActionsFlow] = useState(false)

  const [smsPreferences, setSmsPreferences] = useState<any>(null)
  useEffect(() => {
    // Dynamically import to avoid server-side rendering issues if the service is client-only
    const initializeSmsPreferences = async () => {
      try {
        const smsService = await import("@/lib/sms-service")
        if (smsService && smsService.getSMSPreferences) {
          setSmsPreferences(smsService.getSMSPreferences())
        } else {
          console.error("[v0] SMS service or getSMSPreferences function not found.")
          setSmsPreferences(null) // Ensure it's null if not available
        }
      } catch (error) {
        console.error("[v0] Error initializing SMS preferences:", error)
        setSmsPreferences(null) // Ensure it's null on error
      }
    }
    initializeSmsPreferences()
  }, [])

  const getWeatherIcon = (condition: string, iconCode?: string) => {
    const iconClasses = "h-5 w-5 weather-icon flex-shrink-0"

    // Use specific icon codes from API for more accurate representation
    if (iconCode) {
      switch (iconCode) {
        case "01d":
        case "01n": // Clear sky
          return <Sun className={`${iconClasses} text-yellow-400`} />
        case "02d":
        case "02n": // Few clouds
          return <Sun className={`${iconClasses} text-yellow-300`} />
        case "03d":
        case "03n": // Scattered clouds
          return <Cloud className={`${iconClasses} text-gray-400`} />
        case "04d":
        case "04n": // Broken clouds
          return <Cloud className={`${iconClasses} text-gray-500`} />
        case "09d":
        case "09n": // Shower rain
          return <CloudDrizzle className={`${iconClasses} text-blue-400`} />
        case "10d":
        case "10n": // Rain
          return <CloudRain className={`${iconClasses} text-blue-500`} />
        case "11d":
        case "11n": // Thunderstorm
          return <Zap className={`${iconClasses} text-purple-400`} />
        case "13d":
        case "13n": // Snow
          return <Cloud className={`${iconClasses} text-blue-200`} />
        case "50d":
        case "50n": // Mist
          return <Eye className={`${iconClasses} text-gray-300`} />
      }
    }

    // Fallback to condition-based mapping
    switch (condition.toLowerCase()) {
      case "clear":
        return <Sun className={`${iconClasses} text-yellow-400`} />
      case "clouds":
        return <Cloud className={`${iconClasses} text-gray-400`} />
      case "rain":
        return <CloudRain className={`${iconClasses} text-blue-400`} />
      case "drizzle":
        return <CloudDrizzle className={`${iconClasses} text-blue-300`} />
      case "thunderstorm":
        return <Zap className={`${iconClasses} text-purple-400`} />
      case "fog":
        return <Eye className={`${iconClasses} text-gray-300`} />
      default:
        return <Sun className={`${iconClasses} text-yellow-400`} />
    }
  }

  const getMainWeatherIcon = (condition: string, iconCode?: string) => {
    const iconClasses = "h-20 lg:h-24 w-20 lg:w-24 weather-icon flex-shrink-0"

    // Use specific icon codes from API for more accurate representation
    if (iconCode) {
      switch (iconCode) {
        case "01d":
        case "01n": // Clear sky
          return <Sun className={`${iconClasses} text-yellow-400`} />
        case "02d":
        case "02n": // Few clouds
          return <Sun className={`${iconClasses} text-yellow-300`} />
        case "03d":
        case "03n": // Scattered clouds
          return <Cloud className={`${iconClasses} text-gray-300`} />
        case "04d":
        case "04n": // Broken clouds
          return <Cloud className={`${iconClasses} text-gray-400`} />
        case "09d":
        case "09n": // Shower rain
          return <CloudDrizzle className={`${iconClasses} text-blue-400`} />
        case "10d":
        case "10n": // Rain
          return <CloudRain className={`${iconClasses} text-blue-500`} />
        case "11d":
        case "11n": // Thunderstorm
          return <Zap className={`${iconClasses} text-purple-400`} />
        case "13d":
        case "13n": // Snow
          return <Cloud className={`${iconClasses} text-blue-200`} />
        case "50d":
        case "50n": // Mist
          return <Eye className={`${iconClasses} text-gray-300`} />
      }
    }

    // Fallback to condition-based mapping
    switch (condition.toLowerCase()) {
      case "clear":
        return <Sun className={`${iconClasses} text-yellow-400`} />
      case "clouds":
        return <Cloud className={`${iconClasses} text-gray-300`} />
      case "rain":
        return <CloudRain className={`${iconClasses} text-blue-400`} />
      case "drizzle":
        return <CloudDrizzle className={`${iconClasses} text-blue-300`} />
      case "thunderstorm":
        return <Zap className={`${iconClasses} text-purple-400`} />
      case "fog":
        return <Eye className={`${iconClasses} text-gray-300`} />
      default:
        return <Sun className={`${iconClasses} text-yellow-400`} />
    }
  }

  useEffect(() => {
    const savedSettings = localStorage.getItem("winder-plus-settings")
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setTemperatureUnit(settings.temperatureUnit || "celsius")
        setWindSpeedUnit(settings.windSpeedUnit || "kmh")
        setLocationServicesEnabled(settings.locationServicesEnabled !== false)
        setNotificationsEnabled(settings.notificationsEnabled || false)
        setPushNotificationsEnabled(settings.pushNotificationsEnabled || false)
      } catch (error) {
        console.error("[v0] Error loading settings:", error)
      }
    }
  }, [])

  useEffect(() => {
    const savedSearches = localStorage.getItem("winder-recent-searches")
    if (savedSearches) {
      try {
        const parsed = JSON.parse(savedSearches)
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 10)) // Limit to 10 searches
        }
      } catch (error) {
        console.error("[v0] Error loading search history:", error)
      }
    }
  }, [])

  useEffect(() => {
    const settings = {
      temperatureUnit,
      windSpeedUnit,
      locationServicesEnabled,
      notificationsEnabled,
      pushNotificationsEnabled,
    }
    localStorage.setItem("winder-plus-settings", JSON.stringify(settings))
  }, [temperatureUnit, windSpeedUnit, locationServicesEnabled, notificationsEnabled, pushNotificationsEnabled])

  const convertTemperature = (celsius: number): number => {
    if (temperatureUnit === "fahrenheit") {
      return (celsius * 9) / 5 + 32
    }
    return celsius
  }

  const convertWindSpeed = (kmh: number): number => {
    switch (windSpeedUnit) {
      case "mph":
        return kmh * 0.621371
      case "ms":
        return kmh * 0.277778
      default:
        return kmh
    }
  }

  const getTemperatureUnit = (): string => {
    return temperatureUnit === "fahrenheit" ? "°F" : "°C"
  }

  const getWindSpeedUnit = (): string => {
    switch (windSpeedUnit) {
      case "mph":
        return "mph"
      case "ms":
        return "m/s"
      default:
        return "km/h"
    }
  }

  useEffect(() => {
    const initializeNotifications = async () => {
      console.log("[v0] Initializing notification system")

      // Request notification permission for direct browser notifications
      if ("Notification" in window && Notification.permission === "default") {
        try {
          const permission = await Notification.requestPermission()
          if (permission === "granted") {
            addNotification("🔔 Notifications Enabled", "You'll receive weather alerts and updates", "info")
            setPushNotificationsEnabled(true)
          } else {
            addNotification(
              "🚫 Notifications Disabled",
              "Enable notifications in browser settings for weather alerts",
              "warning",
            )
          }
        } catch (error) {
          console.log("[v0] Notification permission request failed:", error)
          addNotification(
            "❌ Permission Denied",
            "Push notifications were blocked. Please enable them in your browser settings.",
            "error",
          )
        }
      } else if (Notification.permission === "granted") {
        setPushNotificationsEnabled(true)
        addNotification("✅ Notifications Ready", "Weather alerts are enabled", "info")
      } else if (Notification.permission === "denied") {
        addNotification(
          "❌ Permission Denied",
          "Push notifications were blocked. Please enable them in your browser settings.",
          "error",
        )
      }
    }

    initializeNotifications()
  }, []) // Empty dependency array ensures this runs only once

  const requestPushNotificationPermission = async () => {
    if (!("Notification" in window)) {
      addNotification("Not Supported", "Push notifications are not supported in this browser", "error")
      return false
    }

    try {
      // Check current permission status
      let permission = Notification.permission

      if (permission === "default") {
        permission = await Notification.requestPermission()
      }

      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready

        // Use environment variable for VAPID key or fallback
        const vapidKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          "BEl62iUYgUivxIkv69yViEuiBIa40HI6YUTakcfaUYxOqHSgMfpfMUrxQJNLLISHBNKnNdoMrZYF_9_NLnomkZg"

        // Create push subscription
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        })

        setPushSubscription(subscription)
        setPushNotificationsEnabled(true)

        addNotification(
          "✅ Push Notifications Enabled",
          "You will receive weather alerts even when the app is closed",
          "info",
        )

        // Test notification
        setTimeout(() => {
          sendPushNotification("🌤️ WINDER+ Ready", "Weather notifications are now active!")
        }, 1000)

        console.log("[v0] Push subscription created:", subscription)
        return true
      } else if (permission === "denied") {
        addNotification(
          "❌ Permission Denied",
          "Push notifications were blocked. Please enable them in your browser settings.",
          "error",
        )
        return false
      } else {
        addNotification("⚠️ Permission Required", "Please allow notifications to receive weather alerts", "warning")
        return false
      }
    } catch (error) {
      console.error("[v0] Error requesting push notification permission:", error)
      addNotification("Permission Error", `Failed to enable push notifications: ${error.message}`, "error")
      return false
    }
  }

  const sendPushNotification = async (title: string, message: string) => {
    if (!pushNotificationsEnabled || !notificationsEnabled) {
      console.log("[v0] Push notifications disabled, skipping:", title)
      return
    }

    if (!("serviceWorker" in navigator)) {
      console.log("[v0] Service Worker not supported")
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready

      if (registration.active) {
        const uniqueId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        registration.active.postMessage({
          type: "PUSH_NOTIFICATION",
          title,
          message,
          id: uniqueId,
          timestamp: Date.now(),
        })

        console.log("[v0] Push notification sent via service worker")
      } else {
        console.log("[v0] Service worker not active")
      }

      // Fallback: Show immediate notification if page is visible and permission granted
      if (Notification.permission === "granted" && document.visibilityState === "visible") {
        new Notification(title, {
          body: message,
          icon: "/icon-192x192.png",
          tag: "weather-notification",
          renotify: true,
        })
        console.log("[v0] Immediate notification shown as fallback")
      }
    } catch (error) {
      console.error("[v0] Error sending push notification:", error)

      // Final fallback: browser notification if available
      if (Notification.permission === "granted") {
        try {
          new Notification(title, {
            body: message,
            icon: "/icon-192x192.png",
          })
        } catch (fallbackError) {
          console.error("[v0] Fallback notification also failed:", fallbackError)
        }
      }
    }
  }

  const sendBrowserNotification = (title: string, body: string, icon?: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notification = new Notification(title, {
          body,
          icon: icon || "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `weather-${Date.now()}`, // Prevent duplicates
          requireInteraction: false,
          silent: false,
        })

        // Auto-close after 8 seconds
        setTimeout(() => {
          notification.close()
        }, 8000)

        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (error) {
        console.log("[v0] Browser notification failed:", error)
      }
    }
  }

  const addNotification = (
    title: string,
    message: string,
    type: "warning" | "info" | "error" | "news" = "info",
    weatherData?: any,
  ) => {
    if (!notificationsEnabled) {
      console.log("[v0] Notifications disabled, skipping notification:", title)
      return
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    let enhancedMessage = message
    if (weatherData) {
      const temp = weatherData.temperature
      const condition = weatherData.condition
      const humidity = weatherData.humidity
      const windSpeed = weatherData.windSpeed

      // Add weather context to notifications
      if (type === "warning" && condition) {
        enhancedMessage = `${message} | Current: ${temp}°C, ${condition}, ${humidity}% humidity, ${windSpeed} km/h wind`
      } else if (type === "info" && temp) {
        enhancedMessage = `${message} | Weather: ${temp}°C, ${condition}`
      }
    }

    const notification = {
      id: uniqueId,
      title,
      message: enhancedMessage,
      type,
      timestamp: new Date(),
      isVisible: true,
    }

    // Enhanced duplicate prevention with content similarity check
    setNotifications((prev) => {
      const isDuplicate = prev.some(
        (n) =>
          (n.title === title && n.message === enhancedMessage && Date.now() - n.timestamp.getTime() < 5000) ||
          (n.title.includes(title.split(":")[0]) && Date.now() - n.timestamp.getTime() < 3000),
      )

      if (isDuplicate) return prev

      return [notification, ...prev.slice(0, 4)] // Keep 5 notifications for better history
    })

    toast({
      title,
      description: enhancedMessage,
      variant: type === "error" ? "destructive" : "default",
      duration: 5000,
    })

    // Enhanced auto dismiss with better timing
    setTimeout(() => {
      setNotifications((prev) => prev.map((notif) => (notif.id === uniqueId ? { ...notif, isVisible: false } : notif)))
    }, 8000)

    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== uniqueId))
    }, 8500)

    if (
      pushNotificationsEnabled &&
      notificationsEnabled &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const sendPushWithRetry = async (retries = 3) => {
        try {
          const registration = await navigator.serviceWorker.ready
          if (registration.active) {
            registration.active.postMessage({
              type: "PUSH_NOTIFICATION",
              title,
              message: enhancedMessage,
              id: uniqueId,
              timestamp: Date.now(),
            })
            console.log("[v0] Push notification sent successfully")
          }
        } catch (error) {
          console.error("[v0] Push notification error:", error)
          if (retries > 0) {
            console.log(`[v0] Retrying push notification... ${retries} attempts left`)
            setTimeout(() => sendPushWithRetry(retries - 1), 1000)
          }
        }
      }

      sendPushWithRetry()
    }

    if (smsPreferences?.enabled && smsPreferences?.phoneNumber) {
      const smsType = type === "warning" ? "alert" : type === "error" ? "alert" : "weather"
      const shouldSendSMS =
        (smsType === "alert" && smsPreferences.riskAlerts) || (smsType === "weather" && smsPreferences.weatherUpdates)

      if (shouldSendSMS) {
        console.log("[v0] Sending SMS notification:", title)
        sendSMS({
          phoneNumber: smsPreferences.phoneNumber,
          message: `${title}: ${enhancedMessage}`,
          type: smsType,
        }).catch((error) => {
          console.error("[v0] Failed to send SMS:", error)
        })
      }
    }
  }

  const [notificationQueue, setNotificationQueue] = useState<Array<{ title: string; message: string; type: string }>>(
    [],
  )

  const processNotificationQueue = () => {
    if (notificationQueue.length > 0 && navigator.onLine) {
      const queuedNotifications = [...notificationQueue]
      setNotificationQueue([])

      queuedNotifications.forEach((notification, index) => {
        setTimeout(() => {
          addNotification(notification.title, notification.message, notification.type as any)
        }, index * 500) // Stagger notifications
      })
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      console.log("[v0] Connection restored, processing queued notifications")
      processNotificationQueue()
    }

    const handleOffline = () => {
      console.log("[v0] Connection lost, notifications will be queued")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [notificationQueue])

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, isVisible: false } : notif)))
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id))
    }, 500)
  }

  useEffect(() => {
    if (!notificationsEnabled) return

    const weatherNews = [
      { title: "Weather Update", message: "Typhoon signal raised in Northern Luzon", type: "warning" as const },
      {
        title: "Breaking News",
        message: "Heavy rainfall expected in Metro Manila this afternoon",
        type: "news" as const,
      },
      { title: "Weather Alert", message: "Temperature to drop by 5°C in the next 2 hours", type: "info" as const },
      { title: "Storm Warning", message: "Tropical depression approaching Visayas region", type: "warning" as const },
      { title: "Weather Update", message: "Clear skies expected for the weekend", type: "info" as const },
      { title: "Heat Advisory", message: "Heat index may reach 42°C in some areas", type: "warning" as const },
    ]

    const interval = setInterval(() => {
      const randomNews = weatherNews[Math.floor(Math.random() * weatherNews.length)]
      // addNotification(randomNews.title, randomNews.message, randomNews.type)

      if (pushNotificationsEnabled) {
        sendPushNotification(randomNews.title, randomNews.message)
      }
    }, 15000) // Show news every 15 seconds when enabled

    return () => clearInterval(interval)
  }, [notificationsEnabled, pushNotificationsEnabled])

  // /** rest of code here **/
  useEffect(() => {
    if (notificationsEnabled && alerts.length > 0) {
      const latestAlert = alerts[0]
      const alertTitle = `Weather Alert: ${latestAlert.severity.toUpperCase()}`

      if (pushNotificationsEnabled) {
        sendPushNotification(alertTitle, latestAlert.title)
      }
    }
  }, [alerts, notificationsEnabled, pushNotificationsEnabled])
  // /** rest of code here **/

  useEffect(() => {
    let isCancelled = false

    const fetchLocationData = async () => {
      if (!navigator.geolocation || !locationServicesEnabled) {
        if (!locationServicesEnabled) {
          setLocationError("Location services are disabled. Enable them in settings to get local weather.")
          setCurrentWeather(null)
          setAlerts([])
          setRiskPredictions([])
          setForecast([])
        } else {
          setLocationError("Geolocation is not supported by this browser.")
        }
        setLoading(false)
        setIsLocationLoading(false)
        return
      }

      setIsLocationLoading(true)
      setLocationError("")

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (isCancelled) return

          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lon: longitude })

          const locationName = reverseGeocode(latitude, longitude)
          setCurrentLocationName(locationName)

          try {
            const fetchWithRetry = async (url: string, retries = 2) => {
              for (let i = 0; i <= retries; i++) {
                try {
                  const response = await fetch(url)
                  if (response.ok) {
                    return response
                  }
                  if (i === retries) throw new Error(`HTTP ${response.status}`)
                  await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
                } catch (error) {
                  if (i === retries) throw error
                  await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
                }
              }
            }

            // Fetch current weather with retry
            try {
              const weatherResponse = await fetchWithRetry(`/api/weather/current?lat=${latitude}&lon=${longitude}`)
              console.log("[v0] Weather response status:", weatherResponse.status)
              const weatherData = await weatherResponse.json()
              console.log("[v0] Weather data received:", weatherData)
              if (!isCancelled) setCurrentWeather(weatherData)
            } catch (error) {
              console.error("[v0] Weather API error:", error)
              if (!isCancelled) {
                addNotification("Weather Error", "Failed to fetch current weather data", "error")
              }
            }

            // Fetch alerts and risk predictions with retry
            try {
              const alertsResponse = await fetchWithRetry(`/api/weather/alerts?lat=${latitude}&lon=${longitude}`)
              console.log("[v0] Alerts response status:", alertsResponse.status)
              const alertsData = await alertsResponse.json()
              console.log("[v0] Alerts data received:", alertsData)
              if (!isCancelled) {
                setAlerts(alertsData.alerts || [])
                setRiskPredictions(alertsData.riskPredictions || [])
                if (alertsData.indices) {
                  setWeatherIndices(alertsData.indices)
                }
              }
            } catch (error) {
              console.error("[v0] Alerts API error:", error)
              if (!isCancelled) {
                addNotification("Alerts Error", "Failed to fetch weather alerts", "error")
              }
            }

            // Fetch forecast with retry
            try {
              const forecastResponse = await fetchWithRetry(`/api/weather/forecast?lat=${latitude}&lon=${longitude}`)
              console.log("[v0] Forecast response status:", forecastResponse.status)
              const forecastData = await forecastResponse.json()
              console.log("[v0] Forecast data received:", forecastData)
              if (!isCancelled) setForecast(forecastData.forecasts || [])
            } catch (error) {
              console.error("[v0] Forecast API error:", error)
              if (!isCancelled) {
                addNotification("Forecast Error", "Failed to fetch weather forecast", "error")
              }
            }
          } catch (error) {
            console.error("[v0] Error fetching weather data:", error)
            if (!isCancelled) {
              addNotification("Location Error", "Failed to fetch weather data for your location", "error")
            }
          } finally {
            if (!isCancelled) {
              setLoading(false)
              setIsLocationLoading(false)
            }
          }
        },
        (error) => {
          if (isCancelled) return
          console.error("[v0] Geolocation error:", error)
          setLocationError("Unable to get your location. Please check your location permissions.")
          setLoading(false)
          setIsLocationLoading(false)
          addNotification("Location Error", "Unable to access your location", "error")
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000, // 5 minutes
        },
      )
    }

    const timeoutId = setTimeout(fetchLocationData, 500)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
    }
  }, [locationServicesEnabled])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return "text-red-600"
    if (risk >= 40) return "text-orange-600"
    return "text-green-600"
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Severe":
        return "destructive"
      case "High":
        return "destructive"
      case "Moderate":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "extreme":
      case "severe":
        return "bg-red-600 text-white hover:bg-red-700"
      case "high":
        return "bg-orange-600 text-white hover:bg-orange-700"
      case "moderate":
        return "bg-yellow-600 text-white hover:bg-yellow-700"
      case "low":
        return "bg-green-600 text-white hover:bg-green-700"
      default:
        return "bg-slate-600 text-white hover:bg-slate-700"
    }
  }

  const geocodeLocation = (locationName: string): { lat: number; lon: number } | null => {
    const locations: Record<string, { lat: number; lon: number }> = {
      // NCR
      "Metro Manila": { lat: 14.5995, lon: 120.9842 },
      Manila: { lat: 14.5995, lon: 120.9842 },
      "Quezon City": { lat: 14.676, lon: 121.0437 },
      "Caloocan City": { lat: 14.7566, lon: 121.0453 },
      "Makati City": { lat: 14.5547, lon: 121.0244 },
      "Pasig City": { lat: 14.5764, lon: 121.0851 },
      "Taguig City": { lat: 14.5176, lon: 121.0509 },
      "Parañaque City": { lat: 14.4793, lon: 121.0198 },
      "Las Piñas City": { lat: 14.4499, lon: 120.9983 },
      "Muntinlupa City": { lat: 14.3833, lon: 121.05 },
      "Marikina City": { lat: 14.6507, lon: 121.1029 },
      "Valenzuela City": { lat: 14.706, lon: 120.983 },
      "San Juan City": { lat: 14.6042, lon: 121.03 },
      "Mandaluyong City": { lat: 14.5836, lon: 121.0409 },
      "Pasay City": { lat: 14.5378, lon: 120.9815 },
      "Malabon City": { lat: 14.6686, lon: 120.9563 },
      "Navotas City": { lat: 14.6667, lon: 120.95 },

      // Luzon - Central Luzon
      Pampanga: { lat: 15.0794, lon: 120.6194 },
      "San Fernando City": { lat: 15.0336, lon: 120.6844 },
      "Angeles City": { lat: 15.1449, lon: 120.5886 },

      Zambales: { lat: 15.3333, lon: 119.95 },
      "Olongapo City": { lat: 14.8365, lon: 120.2957 },
      Iba: { lat: 15.3276, lon: 119.9783 },

      Bataan: { lat: 14.676, lon: 120.54 },
      "Balanga City": { lat: 14.676, lon: 120.54 },

      Bulacan: { lat: 14.8535, lon: 120.816 },
      "Malolos City": { lat: 14.8433, lon: 120.8117 },
      "Meycauayan City": { lat: 14.7333, lon: 120.9667 },
      "San Jose del Monte City": { lat: 14.8139, lon: 121.0453 },

      // Luzon - Northern
      "Ilocos Norte": { lat: 18.1647, lon: 120.711 },
      "Laoag City": { lat: 18.1978, lon: 120.5936 },

      "Ilocos Sur": { lat: 17.5707, lon: 120.3875 },
      "Vigan City": { lat: 17.5747, lon: 120.3869 },

      "La Union": { lat: 16.6159, lon: 120.3199 },
      "San Fernando City (La Union)": { lat: 16.6159, lon: 120.3199 },

      Cagayan: { lat: 18.2489, lon: 121.878 },
      "Tuguegarao City": { lat: 17.6131, lon: 121.7269 },

      Isabela: { lat: 16.9754, lon: 121.8106 },
      "Ilagan City": { lat: 17.1486, lon: 121.8894 },

      Kalinga: { lat: 17.5, lon: 121.5 },
      "Tabuk City": { lat: 17.45, lon: 121.4583 },

      Benguet: { lat: 16.3993, lon: 120.601 },
      "Baguio City": { lat: 16.4023, lon: 120.596 },
      Sagada: { lat: 17.0756, lon: 120.9081 },

      // Luzon - Southern
      Batangas: { lat: 13.7565, lon: 121.0583 },
      "Batangas City": { lat: 13.7565, lon: 121.0583 },

      Cavite: { lat: 14.4791, lon: 120.8969 },
      "Trece Martires City": { lat: 14.2806, lon: 120.8664 },
      "Tagaytay City": { lat: 14.0976, lon: 120.9406 },

      Laguna: { lat: 14.17, lon: 121.3331 },
      "Calamba City": { lat: 14.2117, lon: 121.1653 },
      "San Pablo City": { lat: 14.0667, lon: 121.325 },

      Rizal: { lat: 14.6034, lon: 121.308 },
      "Antipolo City": { lat: 14.6258, lon: 121.1226 },

      "Quezon Province": { lat: 13.9418, lon: 121.6236 },
      "Lucena City": { lat: 13.9418, lon: 121.6236 },

      "Oriental Mindoro": { lat: 13.0833, lon: 121.0833 },
      "Calapan City": { lat: 13.4103, lon: 121.18 },

      Palawan: { lat: 9.8349, lon: 118.7384 },
      "Puerto Princesa City": { lat: 9.7392, lon: 118.7353 },

      Albay: { lat: 13.1667, lon: 123.7333 },
      "Legazpi City": { lat: 13.1333, lon: 123.7333 },

      "Camarines Sur": { lat: 13.6226, lon: 123.1948 },
      "Naga City": { lat: 13.6218, lon: 123.1948 },

      Masbate: { lat: 12.1667, lon: 123.5833 },
      "Masbate City": { lat: 12.3667, lon: 123.6167 },

      Sorsogon: { lat: 12.9667, lon: 124.0167 },
      "Sorsogon City": { lat: 12.9714, lon: 124.0064 },

      // Visayas
      Capiz: { lat: 11.5833, lon: 122.75 },
      "Roxas City": { lat: 11.5853, lon: 122.7511 },

      Iloilo: { lat: 10.7202, lon: 122.5621 },
      "Iloilo City": { lat: 10.7202, lon: 122.5621 },

      "Negros Occidental": { lat: 10.6407, lon: 122.9689 },
      "Bacolod City": { lat: 10.6765, lon: 122.9509 },

      Bohol: { lat: 9.8499, lon: 124.1435 },
      "Tagbilaran City": { lat: 9.6475, lon: 123.8556 },

      Cebu: { lat: 10.3157, lon: 123.8854 },
      "Cebu City": { lat: 10.3157, lon: 123.8854 },
      "Lapu-Lapu City": { lat: 10.3102, lon: 123.9494 },
      "Mandaue City": { lat: 10.3236, lon: 123.9226 },
      "Toledo City": { lat: 10.3772, lon: 123.6386 },
      "Carcar City": { lat: 10.115, lon: 123.6403 },
      "Danao City": { lat: 10.5281, lon: 124.0272 },
      "Talisay City (Cebu)": { lat: 10.2447, lon: 123.8494 },

      "Eastern Samar": { lat: 11.5, lon: 125.5 },
      "Borongan City": { lat: 11.6077, lon: 125.4312 },

      Leyte: { lat: 11.25, lon: 124.75 },
      "Tacloban City": { lat: 11.2433, lon: 124.9772 },
      "Ormoc City": { lat: 11.0064, lon: 124.6075 },
      "Baybay City": { lat: 10.6781, lon: 124.8 },

      Samar: { lat: 12.0, lon: 125.0 },
      "Catbalogan City": { lat: 11.7753, lon: 124.8861 },

      "Southern Leyte": { lat: 10.3333, lon: 125.0833 },
      "Maasin City": { lat: 10.1333, lon: 124.8333 },

      // Mindanao
      "Zamboanga del Norte": { lat: 8.5, lon: 123.5 },
      "Dipolog City": { lat: 8.5886, lon: 123.3409 },

      "Zamboanga del Sur": { lat: 7.8333, lon: 123.5 },
      "Pagadian City": { lat: 7.8257, lon: 123.4366 },

      "Zamboanga Sibugay": { lat: 7.8333, lon: 122.75 },
      "Zamboanga City": { lat: 6.9214, lon: 122.079 },

      Bukidnon: { lat: 8.0, lon: 125.0 },
      "Malaybalay City": { lat: 8.1458, lon: 125.1278 },
      "Valencia City": { lat: 7.9, lon: 125.0833 },

      "Misamis Occidental": { lat: 8.5, lon: 123.75 },
      "Oroquieta City": { lat: 8.4833, lon: 123.8 },
      "Ozamiz City": { lat: 8.1462, lon: 123.8444 },
      "Tangub City": { lat: 8.0672, lon: 123.75 },

      "Misamis Oriental": { lat: 8.5, lon: 124.75 },
      "Cagayan de Oro City": { lat: 8.4542, lon: 124.6319 },
      "Gingoog City": { lat: 8.8333, lon: 125.0833 },

      "Davao del Norte": { lat: 7.45, lon: 125.75 },
      "Tagum City": { lat: 7.4478, lon: 125.8078 },

      "Davao del Sur": { lat: 6.75, lon: 125.35 },
      "Digos City": { lat: 6.75, lon: 125.35 },
      "Davao City": { lat: 7.1907, lon: 125.4553 },

      "Davao Oriental": { lat: 7.0, lon: 126.1667 },
      "Mati City": { lat: 6.95, lon: 126.2167 },

      Cotabato: { lat: 7.2167, lon: 124.25 },
      "Kidapawan City": { lat: 7.0083, lon: 125.0894 },

      "South Cotabato": { lat: 6.3333, lon: 124.8333 },
      "Koronadal City": { lat: 6.5031, lon: 124.8469 },
      "General Santos City": { lat: 6.1164, lon: 125.1716 },

      "Agusan del Norte": { lat: 9.1667, lon: 125.75 },
      "Butuan City": { lat: 8.9492, lon: 125.5436 },

      "Surigao del Norte": { lat: 9.75, lon: 125.75 },
      "Surigao City": { lat: 9.7833, lon: 125.4833 },

      "Surigao del Sur": { lat: 8.75, lon: 126.1667 },
      "Tandag City": { lat: 9.0789, lon: 126.1986 },

      Basilan: { lat: 6.5, lon: 122.0833 },
      "Isabela City": { lat: 6.7, lon: 121.9667 },

      "Lanao del Sur": { lat: 7.8333, lon: 124.3333 },
      "Marawi City": { lat: 8.0, lon: 124.3 },

      "Lanao del Norte": { lat: 8.0, lon: 124.0 },
      "Iligan City": { lat: 8.2289, lon: 124.24 },

      Maguindanao: { lat: 7.05, lon: 124.45 },
      "Cotabato City": { lat: 7.2236, lon: 124.2464 },

      "Sultan Kudarat": { lat: 6.5, lon: 124.3333 },
      "Tacurong City": { lat: 6.6925, lon: 124.6764 },
    }

    const normalizedLocation = locationName.toLowerCase().trim()
    const entries = Object.entries(locations).map(([key, value]) => ({
      key: key.toLowerCase(),
      originalKey: key,
      value,
    }))

    // If province is mentioned (e.g. "San Fernando Pampanga")
    const provinceMatch = entries.find(
      (entry) =>
        normalizedLocation.includes("san fernando") &&
        normalizedLocation.includes(entry.key.split(", ")[1]?.toLowerCase() || ""),
    )
    if (provinceMatch) return provinceMatch.value

    // Exact match
    const exactMatch = entries.find((entry) => entry.key === normalizedLocation)
    if (exactMatch) return exactMatch.value

    // Starts with match
    const startsWithMatches = entries
      .filter((entry) => entry.key.startsWith(normalizedLocation))
      .sort((a, b) => a.key.length - b.key.length)
    if (startsWithMatches.length > 0) return startsWithMatches[0].value

    // Contains match
    const containsMatches = entries
      .filter((entry) => entry.key.includes(normalizedLocation))
      .sort((a, b) => a.key.length - b.key.length)
    if (containsMatches.length > 0) return containsMatches[0].value

    return null // Return null if no match found
  }

  const getAllLocations = (): string[] => {
    return [
      // NCR
      "Metro Manila",
      "Manila",
      "Quezon City",
      "Caloocan City",
      "Makati City",
      "Pasig City",
      "Taguig City",
      "Parañaque City",
      "Las Piñas City",
      "Muntinlupa City",
      "Marikina City",
      "Valenzuela City",
      "San Juan City",
      "Mandaluyong City",
      "Pasay City",
      "Malabon City",
      "Navotas City",

      // Luzon - Central Luzon
      "Pampanga",
      "San Fernando City",
      "Angeles City",

      "Zambales",
      "Olongapo City",
      "Iba",

      "Bataan",
      "Balanga City",

      "Bulacan",
      "Malolos City",
      "Meycauayan City",
      "San Jose del Monte City",

      // Luzon - Northern
      "Ilocos Norte",
      "Laoag City",

      "Ilocos Sur",
      "Vigan City",

      "La Union",
      "San Fernando City (La Union)",

      "Cagayan",
      "Tuguegarao City",

      "Isabela",
      "Ilagan City",

      "Kalinga",
      "Tabuk City",

      "Benguet",
      "Baguio City",
      "Sagada",

      // Luzon - Southern
      "Batangas",
      "Batangas City",

      "Cavite",
      "Trece Martires City",
      "Tagaytay City",

      "Laguna",
      "Calamba City",
      "San Pablo City",

      "Rizal",
      "Antipolo City",

      "Quezon Province",
      "Lucena City",

      "Oriental Mindoro",
      "Calapan City",

      "Palawan",
      "Puerto Princesa City",

      "Albay",
      "Legazpi City",

      "Camarines Sur",
      "Naga City",

      "Masbate",
      "Masbate City",

      "Sorsogon",
      "Sorsogon City",

      // Visayas
      "Capiz",
      "Roxas City",

      "Iloilo",
      "Iloilo City",

      "Negros Occidental",
      "Bacolod City",

      "Bohol",
      "Tagbilaran City",

      "Cebu",
      "Cebu City",
      "Lapu-Lapu City",
      "Mandaue City",
      "Toledo City",
      "Carcar City",
      "Danao City",
      "Talisay City (Cebu)",

      "Eastern Samar",
      "Borongan City",

      "Leyte",
      "Tacloban City",
      "Ormoc City",
      "Baybay City",

      "Samar",
      "Catbalogan City",

      "Southern Leyte",
      "Maasin City",

      // Mindanao
      "Zamboanga del Norte",
      "Dipolog City",

      "Zamboanga del Sur",
      "Pagadian City",

      "Zamboanga Sibugay",
      "Zamboanga City",

      "Bukidnon",
      "Malaybalay City",
      "Valencia City",

      "Misamis Occidental",
      "Oroquieta City",
      "Ozamiz City",
      "Tangub City",

      "Misamis Oriental",
      "Cagayan de Oro City",
      "Gingoog City",

      "Davao del Norte",
      "Tagum City",

      "Davao del Sur",
      "Digos City",
      "Davao City",

      "Davao Oriental",
      "Mati City",

      "Cotabato",
      "Kidapawan City",

      "South Cotabato",
      "Koronadal City",
      "General Santos City",

      "Agusan del Norte",
      "Butuan City",

      "Surigao del Norte",
      "Surigao City",

      "Surigao del Sur",
      "Tandag City",

      "Basilan",
      "Isabela City",

      "Lanao del Sur",
      "Marawi City",

      "Lanao del Norte",
      "Iligan City",

      "Maguindanao",
      "Cotabato City",

      "Sultan Kudarat",
      "Tacurong City",
    ]
  }

  const handleSearchInputChange = (value: string) => {
    setSearchLocation(value)

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }

    if (value.trim().length > 0) {
      const timer = setTimeout(() => {
        const allLocations = getAllLocations()
        const filtered = allLocations
          .filter((location) => {
            const searchTerm = value.toLowerCase()
            const locationLower = location.toLowerCase()

            return (
              locationLower.includes(searchTerm) ||
              locationLower.startsWith(searchTerm) ||
              location.split(" ").some((word) => word.toLowerCase().startsWith(searchTerm))
            )
          })
          .sort((a, b) => {
            const searchTerm = value.toLowerCase()
            const aLower = a.toLowerCase()
            const bLower = b.toLowerCase()

            if (aLower === searchTerm) return -1
            if (bLower === searchTerm) return 1
            if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1
            if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm)) return 1

            return a.length - b.length // Shorter names first
          })
          .slice(0, 8) // Limit to 8 suggestions

        setFilteredSuggestions(filtered)
        setShowSuggestions(true)
      }, 300) // 300ms debounce

      setSearchDebounceTimer(timer)
    } else {
      setShowSuggestions(false)
      setFilteredSuggestions([])
    }
  }

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchLocation(suggestion)
    setSelectedLocationName(suggestion)
    setShowSuggestions(false)
    setFilteredSuggestions([])
    // Automatically search when suggestion is selected
    setTimeout(() => handleLocationSearch(suggestion), 100)
  }

  const generateSmartSuggestions = useCallback(async () => {
    const allLocations = getAllLocations()
    const suggestions: Array<{
      name: string
      temperature: number
      condition: string
      icon: string
      reason: string
      score: number
    }> = []

    // Only use dynamic values after component has mounted to avoid hydration mismatch
    const now = typeof window !== "undefined" ? new Date() : new Date(2024, 0, 1, 12, 0, 0)
    const currentHour = now.getHours()
    const isWeekend = [0, 6].includes(now.getDay())
    const currentMonth = now.getMonth()

    // Enhanced location scoring algorithm
    const locationScores: Array<{
      name: string
      score: number
      reason: string
    }> = []

    allLocations.forEach((location) => {
      let score = 0
      let reason = ""

      // Factor 1: Recent searches with enhanced weighting
      const recentIndex = recentSearches.indexOf(location)
      if (recentIndex !== -1) {
        score += 60 - recentIndex * 10 // More recent = higher score
        reason = recentIndex === 0 ? "Last searched" : "Recently searched"
      }

      // Factor 2: Geographic proximity with enhanced calculation
      if (currentLocationName && location !== currentLocationName) {
        const proximityBonus = getProximityScore(currentLocationName, location)
        score += proximityBonus
        if (proximityBonus > 20) reason = reason || "Nearby location"
      }

      // Factor 3: Popular destinations with time-based weighting
      const popularCities = ["Manila", "Cebu City", "Davao City", "Baguio", "Boracay", "Palawan"]
      if (popularCities.includes(location)) {
        const popularityScore = isWeekend ? 35 : 25 // Higher on weekends
        score += popularityScore
        if (!reason) reason = isWeekend ? "Weekend destination" : "Popular destination"
      }

      // Factor 4: Enhanced seasonal recommendations
      const seasonalBonus = getSeasonalScore(location, currentMonth)
      score += seasonalBonus
      if (seasonalBonus > 15) reason = reason || "Perfect season"

      // Factor 5: Enhanced time-based suggestions
      if (currentHour >= 5 && currentHour <= 9) {
        // Early morning: suggest cooler, peaceful places
        if (["Baguio", "Tagaytay", "Sagada", "Batanes"].includes(location)) {
          score += 20
          if (!reason) reason = "Cool morning destination"
        }
      } else if (currentHour >= 16 && currentHour <= 19) {
        // Late afternoon: suggest sunset and evening destinations
        if (["Boracay", "Palawan", "Batangas", "La Union", "Siargao"].includes(location)) {
          score += 25
          if (!reason) reason = "Beautiful sunset views"
        }
      } else if (currentHour >= 20 || currentHour <= 4) {
        // Night/early morning: suggest urban areas with nightlife
        if (["Manila", "Cebu City", "Makati", "BGC"].includes(location)) {
          score += 15
          if (!reason) reason = "Vibrant nightlife"
        }
      }

      // Factor 6: Enhanced weekend suggestions
      if (isWeekend) {
        const weekendDestinations = ["Baguio", "Tagaytay", "Batangas", "Laguna", "Zambales"]
        if (weekendDestinations.includes(location)) {
          score += 25
          if (!reason) reason = "Perfect weekend escape"
        }
      }

      // Factor 7: Weather preference learning (basic implementation)
      if (recentSearches.length > 0) {
        const mountainous = ["Baguio", "Tagaytay", "Sagada", "Batanes"]
        const coastal = ["Boracay", "Palawan", "Batangas", "La Union", "Siargao"]

        const recentMountainous = recentSearches.filter((s) => mountainous.includes(s)).length
        const recentCoastal = recentSearches.filter((s) => coastal.includes(s)).length

        if (recentMountainous > recentCoastal && mountainous.includes(location)) {
          score += 10
          if (!reason) reason = "Matches your preferences"
        } else if (recentCoastal > recentMountainous && coastal.includes(location)) {
          score += 10
          if (!reason) reason = "Matches your preferences"
        }
      }

      if (score > 0) {
        locationScores.push({
          name: location,
          score,
          reason: reason || "Recommended",
        })
      }
    })

    // Sort by score and ensure diversity in suggestions
    const sortedLocations = locationScores.sort((a, b) => b.score - a.score)
    const diverseLocations = []
    const usedReasons = new Set()

    for (const location of sortedLocations) {
      if (diverseLocations.length >= 4) break

      // Ensure diversity in reasons to avoid repetitive suggestions
      if (!usedReasons.has(location.reason) || diverseLocations.length < 2) {
        diverseLocations.push(location)
        usedReasons.add(location.reason)
      }
    }

    // Fetch real weather data for top locations
    for (const location of diverseLocations) {
      try {
        const coordinates = geocodeLocation(location.name)
        if (coordinates) {
          const response = await fetch(`/api/weather/current?lat=${coordinates.lat}&lon=${coordinates.lon}`)
          if (response.ok) {
            const weatherData = await response.json()

            // Weather condition bonus for good weather
            if (weatherData.condition === "Clear" || weatherData.condition === "Clouds") {
              location.score += 15
            }

            suggestions.push({
              name: location.name,
              temperature: weatherData.temperature,
              condition: weatherData.condition,
              icon: weatherData.icon,
              reason: location.reason,
              score: location.score,
            })
          } else {
            // Fallback to generated weather if API fails
            const weatherData = generateRealisticWeather(location.name, currentMonth)
            suggestions.push({
              name: location.name,
              temperature: weatherData.temperature,
              condition: weatherData.condition,
              icon: weatherData.icon,
              reason: location.reason,
              score: location.score,
            })
          }
        }
      } catch (error) {
        console.error(`[v0] Error fetching weather for ${location.name}:`, error)
        // Fallback to generated weather if API fails
        const weatherData = generateRealisticWeather(location.name, currentMonth)
        suggestions.push({
          name: location.name,
          temperature: weatherData.temperature,
          condition: weatherData.condition,
          icon: weatherData.icon,
          reason: location.reason,
          score: location.score,
        })
      }
    }

    setSuggestedLocations(suggestions.sort((a, b) => b.score - a.score))
  }, [recentSearches, currentLocationName])

  const getProximityScore = (currentLocation: string, targetLocation: string): number => {
    const proximityMap: { [key: string]: string[] } = {
      Manila: ["Quezon City", "Caloocan", "Makati", "Pasig", "Taguig", "Paranaque", "Las Pinas", "Muntinlupa"],
      "Cebu City": ["Bohol", "Negros Oriental", "Leyte"],
      "Davao City": ["South Cotabato", "North Cotabato", "Bukidnon"],
      Baguio: ["Pangasinan", "Tarlac", "Nueva Ecija"],
    }

    const currentProximity = proximityMap[currentLocation] || []
    return currentProximity.includes(targetLocation) ? 20 : 0
  }

  const getSeasonalScore = (location: string, month: number): number => {
    // Dry season (Nov-Apr): 0-3, 10-11
    const isDrySeason = month <= 3 || month >= 10

    if (isDrySeason) {
      // Beach destinations score higher in dry season
      if (["Boracay", "Palawan", "Batangas", "La Union"].includes(location)) {
        return 15
      }
    } else {
      // Rainy season: mountain destinations score higher
      if (["Baguio", "Tagaytay", "Sagada"].includes(location)) {
        return 15
      }
    }
    return 0
  }

  const generateRealisticWeather = (location: string, month: number) => {
    const weatherPatterns: { [key: string]: any } = {
      Manila: { baseTemp: 28, variation: 4, sunnyChance: 0.6, rainChance: 0.25 },
      "Cebu City": { baseTemp: 29, variation: 3, sunnyChance: 0.7, rainChance: 0.2 },
      "Davao City": { baseTemp: 31, variation: 3, sunnyChance: 0.65, rainChance: 0.2 },
      Baguio: { baseTemp: 20, variation: 5, sunnyChance: 0.5, rainChance: 0.3 },
      Boracay: { baseTemp: 30, variation: 2, sunnyChance: 0.8, rainChance: 0.15 },
    }

    const pattern = weatherPatterns[location] || { baseTemp: 28, variation: 4, sunnyChance: 0.6, rainChance: 0.25 }
    const temp = Math.round(pattern.baseTemp + (Math.random() - 0.5) * pattern.variation)

    const rand = Math.random()
    let condition = "clear"

    if (rand < pattern.rainChance) {
      // Rain or thunderstorm
      condition = Math.random() < 0.3 ? "thunderstorm" : "rain"
    } else if (rand < pattern.rainChance + 0.2) {
      // Cloudy weather (20% chance)
      condition = "clouds"
    } else if (rand < pattern.rainChance + 0.2 + pattern.sunnyChance) {
      // Clear/sunny weather
      condition = "clear"
    } else {
      // Remaining probability goes to partly cloudy
      condition = "clouds"
    }

    return {
      temperature: temp,
      condition: condition,
      icon: condition,
    }
  }

  const updateRecentSearches = (locationName: string) => {
    try {
      const current = JSON.parse(localStorage.getItem("recentSearches") || "[]")
      const updated = [locationName, ...current.filter((item: string) => item !== locationName)].slice(0, 10)
      localStorage.setItem("recentSearches", JSON.stringify(updated))
      setRecentSearches(updated)
    } catch (error) {
      console.error("[v0] Failed to update recent searches:", error)
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recentSearches")
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch (error) {
      console.error("[v0] Failed to load recent searches:", error)
    }
  }, [])

  const handleSuggestionCardClick = (locationName: string) => {
    setSearchLocation(locationName)
    setSelectedLocationName(locationName)
    updateRecentSearches(locationName)
    setTimeout(() => handleLocationSearch(locationName), 100)
  }

  const findProperLocationName = (searchTerm: string): string => {
    const locations: Record<string, string> = {
      // Major cities
      manila: "Manila",
      quezon: "Quezon City",
      "quezon city": "Quezon City",
      caloocan: "Caloocan City",
      davao: "Davao City",
      "davao city": "Davao City",
      cebu: "Cebu City",
      "cebu city": "Cebu City",
      zamboanga: "Zamboanga City",
      "zamboanga city": "Zamboanga City",
      antipolo: "Antipolo City",
      taguig: "Taguig City",
      pasig: "Pasig City",
      cagayan: "Cagayan de Oro",
      "cagayan de oro": "Cagayan de Oro",
      paranaque: "Parañaque City",
      "las pinas": "Las Piñas City",
      makati: "Makati City",
      muntinlupa: "Muntinlupa City",
      "olongapo city": "Olongapo City",

      // Provinces/Regions
      bataan: "Bataan",
      batangas: "Batangas",
      bulacan: "Bulacan",
      cavite: "Cavite",
      laguna: "Laguna",
      rizal: "Rizal",
      pampanga: "Pampanga",
      nueva: "Nueva Ecija",
      "nueva ecija": "Nueva Ecija",
      pangasinan: "Pangasinan",
      tarlac: "Tarlac",
      zambales: "Zambales",
    }

    const normalizedSearch = searchTerm.toLowerCase().trim()

    // Try exact match first
    if (locations[normalizedSearch]) {
      return locations[normalizedSearch]
    }

    // Try partial matches
    const locationKeys = Object.keys(locations)

    // Find locations that start with the search term
    const startsWithMatches = locationKeys.filter((key) => key.startsWith(normalizedSearch))
    if (startsWithMatches.length > 0) {
      const bestMatch = startsWithMatches.sort((a, b) => a.length - b.length)[0]
      return locations[bestMatch]
    }

    // Find locations that contain the search term
    const containsMatches = locationKeys.filter((key) => key.includes(normalizedSearch))
    if (containsMatches.length > 0) {
      const bestMatch = containsMatches.sort((a, b) => a.length - b.length)[0]
      return locations[bestMatch]
    }

    return searchTerm // Fallback to original search term
  }

  const openWeatherMap = () => {
    setWeatherMapModalOpen(true)
  }

  const getWeatherMapUrl = () => {
    if (location) {
      const mapUrl = `https://openweathermap.org/weathermap?basemap=map&cities=true&layer=precipitation&lat=${location.lat}&lon=${location.lon}&zoom=12&appid=openweathermap`
      console.log("[v0] Generated map URL with user coordinates:", mapUrl)
      return mapUrl
    } else {
      const defaultUrl = `https://openweathermap.org/weathermap?basemap=map&cities=true&layer=precipitation&lat=12.8797&lon=121.7740&zoom=6&appid=openweathermap`
      console.log("[v0] Using default Philippines map URL:", defaultUrl)
      return defaultUrl
    }
  }

  const reverseGeocode = (lat: number, lon: number): string => {
    console.log("[v0] Reverse geocoding coordinates:", lat, lon)

    const locations = [
      { name: "Manila", lat: 14.5995, lon: 120.9842, radius: 0.1 },
      { name: "Quezon City", lat: 14.676, lon: 121.0437, radius: 0.1 },
      { name: "Caloocan", lat: 14.6507, lon: 120.9668, radius: 0.1 },
      { name: "Makati", lat: 14.5547, lon: 121.0244, radius: 0.1 },
      { name: "Pasig", lat: 14.5764, lon: 121.0851, radius: 0.1 },
      { name: "Taguig", lat: 14.5176, lon: 121.0509, radius: 0.1 },
      { name: "Paranaque", lat: 14.4793, lon: 121.0198, radius: 0.1 },
      { name: "Las Piñas", lat: 14.4378, lon: 120.9942, radius: 0.1 },
      { name: "Muntinlupa", lat: 14.3832, lon: 121.0409, radius: 0.1 },
      { name: "Antipolo", lat: 14.5878, lon: 121.176, radius: 0.1 },
      { name: "Olongapo City", lat: 14.8365, lon: 120.2957, radius: 0.35 },
      { name: "Subic", lat: 14.8794, lon: 120.2728, radius: 0.15 },
      { name: "Castillejos", lat: 14.9667, lon: 120.2167, radius: 0.15 },
      { name: "San Antonio", lat: 14.9333, lon: 120.1167, radius: 0.15 },
      { name: "Cebu City", lat: 10.3157, lon: 123.8854, radius: 0.2 },
      { name: "Davao City", lat: 7.1907, lon: 125.4553, radius: 0.2 },
      { name: "Zamboanga City", lat: 6.9214, lon: 122.079, radius: 0.2 },
      { name: "Cagayan de Oro", lat: 8.4542, lon: 124.6319, radius: 0.2 },
      { name: "Batangas", lat: 13.7565, lon: 121.0583, radius: 0.3 },
      { name: "Bulacan", lat: 14.7942, lon: 120.8794, radius: 0.3 },
      { name: "Cavite", lat: 14.2456, lon: 120.8781, radius: 0.3 },
      { name: "Laguna", lat: 14.2691, lon: 121.4113, radius: 0.3 },
      { name: "Rizal", lat: 14.6037, lon: 121.3084, radius: 0.3 },
      { name: "Pampanga", lat: 15.0794, lon: 120.62, radius: 0.3 },
      { name: "Nueva Ecija", lat: 15.5784, lon: 120.9726, radius: 0.3 },
      { name: "Pangasinan", lat: 15.8949, lon: 120.2863, radius: 0.4 },
      { name: "Tarlac", lat: 15.4751, lon: 120.5969, radius: 0.3 },
      { name: "Zambales", lat: 15.5093, lon: 119.9712, radius: 0.4 },
      { name: "Bataan", lat: 14.6417, lon: 120.4818, radius: 0.3 },
      { name: "Aurora", lat: 15.7494, lon: 121.397, radius: 0.5 },
      { name: "Baler", lat: 15.7594, lon: 121.5569, radius: 0.2 },
      { name: "Quezon Province", lat: 14.1014, lon: 121.6234, radius: 0.8 },
      { name: "Bohol", lat: 9.8349, lon: 124.1436, radius: 0.4 },
      { name: "Negros Occidental", lat: 10.631, lon: 122.9629, radius: 0.4 },
      { name: "Negros Oriental", lat: 9.3344, lon: 123.3018, radius: 0.4 },
      { name: "Iloilo", lat: 10.7202, lon: 122.5621, radius: 0.4 },
      { name: "Leyte", lat: 11.2421, lon: 124.8065, radius: 0.4 },
      { name: "Samar", lat: 11.5804, lon: 125.0078, radius: 0.4 },
    ]

    // Find the closest location within radius
    let closestLocation = null
    let minDistance = Number.POSITIVE_INFINITY

    for (const location of locations) {
      const distance = Math.sqrt(Math.pow(lat - location.lat, 2) + Math.pow(lon - location.lon, 2))

      if (location.name === "Olongapo City" || distance < 0.5) {
        console.log("[v0] Distance to", location.name, ":", distance.toFixed(4), "| Radius:", location.radius)
      }

      if (distance <= location.radius && distance < minDistance) {
        minDistance = distance
        closestLocation = location
      }
    }

    const result = closestLocation ? closestLocation.name : "Philippines"
    console.log("[v0] Reverse geocoding result:", result, "| Closest distance:", minDistance.toFixed(4))

    if (!closestLocation && lat >= 14.5 && lat <= 15.2 && lon >= 119.8 && lon <= 120.8) {
      console.log("[v0] Coordinates appear to be in Zambales/Bataan region, defaulting to Zambales")
      return "Zambales"
    }

    return result
  }

  const formatDate = (dateValue: string | Date): string => {
    if (!dateValue) return "N/A"

    try {
      const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue
      if (isNaN(date.getTime())) return "Invalid date"
      return date.toLocaleDateString()
    } catch (error) {
      console.error("[v0] Date formatting error:", error)
      return "Invalid date"
    }
  }

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    generateSmartSuggestions()
  }, [generateSmartSuggestions])

  useEffect(() => {
    if (!isMounted) return

    const interval = setInterval(
      () => {
        generateSmartSuggestions()
      },
      10 * 60 * 1000,
    ) // 10 minutes

    return () => clearInterval(interval)
  }, [generateSmartSuggestions, isMounted])

  const handleSearch = () => {
    // Implement your search logic here
    // For example, you can filter the smartSuggestions array based on the searchLocation
    const filteredSuggestions = smartSuggestions.filter((suggestion) =>
      suggestion.location.toLowerCase().includes(searchLocation.toLowerCase()),
    )
    setSearchSuggestions(filteredSuggestions.map((suggestion) => suggestion.location))
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      addNotification("Location Error", "Geolocation is not supported by this browser", "error")
      return
    }

    setCurrentLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const locationName = reverseGeocode(latitude, longitude)

        console.log("[v0] Current location found:", locationName, `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)

        // Use the existing handleLocationSearch function with the found location
        setSearchLocation(locationName)
        await handleLocationSearch(locationName)

        setCurrentLocationLoading(false)
        addNotification("Location Found", `Weather data loaded for ${locationName}`, "success")
      },
      (error) => {
        setCurrentLocationLoading(false)
        let errorMessage = "Unable to retrieve your location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }

        addNotification("Location Error", errorMessage, "error")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  }

  const startLiveMonitoring = () => {
    if (!notificationsEnabled || !locationServicesEnabled) return

    console.log("[v0] Starting live location and weather monitoring")

    // Clear existing intervals
    if (locationMonitoringInterval) clearInterval(locationMonitoringInterval)
    if (weatherMonitoringInterval) clearInterval(weatherMonitoringInterval)

    // Monitor location changes every 2 minutes
    const locationInterval = setInterval(() => {
      if (!navigator.geolocation || !locationServicesEnabled || !notificationsEnabled) return

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const newLocation = { lat: latitude, lon: longitude }

          if (previousLocation) {
            // Calculate distance moved (simple distance formula)
            const distance =
              Math.sqrt(Math.pow(latitude - previousLocation.lat, 2) + Math.pow(longitude - previousLocation.lon, 2)) *
              111000 // Convert to meters approximately

            // If moved more than 1km, notify about new area
            if (distance > 1000) {
              const locationName = reverseGeocode(latitude, longitude)
              sendLocationChangeNotification(locationName, distance)
              setPreviousLocation(newLocation)

              // Fetch weather for new location
              fetchWeatherForLocation(latitude, longitude)
            }
          } else {
            setPreviousLocation(newLocation)
          }
        },
        (error) => {
          console.error("[v0] Location monitoring error:", error)
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      )
    }, 120000) // Check every 2 minutes

    // Monitor weather changes every 5 minutes
    const weatherInterval = setInterval(() => {
      if (!location || !notificationsEnabled) return

      fetchWeatherForLocation(location.lat, location.lon, true)
    }, 300000) // Check every 5 minutes

    setLocationMonitoringInterval(locationInterval)
    setWeatherMonitoringInterval(weatherInterval)
  }

  const stopLiveMonitoring = () => {
    console.log("[v0] Stopping live location and weather monitoring")

    if (locationMonitoringInterval) {
      clearInterval(locationMonitoringInterval)
      setLocationMonitoringInterval(null)
    }

    if (weatherMonitoringInterval) {
      clearInterval(weatherMonitoringInterval)
      setWeatherMonitoringInterval(null)
    }
  }

  const fetchWeatherForLocation = async (lat: number, lon: number, isMonitoring = false) => {
    try {
      const response = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}`)
      if (response.ok) {
        const weatherData = await response.json()

        if (isMonitoring && previousWeatherData) {
          checkWeatherChanges(weatherData, previousWeatherData)
        }

        setPreviousWeatherData(weatherData)

        if (!isMonitoring) {
          setCurrentWeather(weatherData)
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching weather for monitoring:", error)
    }
  }

  const checkWeatherChanges = (newWeather: any, oldWeather: any) => {
    if (!newWeather || !oldWeather) return

    const tempChange = Math.abs(newWeather.temperature - oldWeather.temperature)
    const conditionChanged = newWeather.condition !== oldWeather.condition
    const windSpeedChange = Math.abs(newWeather.windSpeed - oldWeather.windSpeed)
    const humidityChange = Math.abs(newWeather.humidity - oldWeather.humidity)

    if (tempChange >= 3) {
      const direction = newWeather.temperature > oldWeather.temperature ? "increased" : "decreased"
      const severity = tempChange >= 5 ? "significantly" : "noticeably"
      addNotification(
        "🌡️ Temperature Alert",
        `Temperature has ${severity} ${direction} by ${tempChange.toFixed(1)}°C (${oldWeather.temperature}°C → ${newWeather.temperature}°C)`,
        tempChange >= 5 ? "warning" : "info",
        newWeather,
      )
    }

    if (conditionChanged) {
      const getWeatherIcon = (condition: string) => {
        const icons: { [key: string]: string } = {
          Clear: "☀️",
          Sunny: "☀️",
          Rain: "🌧️",
          Thunderstorm: "⛈️",
          Cloudy: "☁️",
          "Partly Cloudy": "⛅",
          Snow: "❄️",
          Fog: "🌫️",
        }
        return icons[condition] || "🌤️"
      }

      addNotification(
        "Weather Condition Change",
        `${getWeatherIcon(oldWeather.condition)} ${oldWeather.condition} → ${getWeatherIcon(newWeather.condition)} ${newWeather.condition}`,
        newWeather.condition.includes("Thunderstorm") || newWeather.condition.includes("Rain") ? "warning" : "info",
        newWeather,
      )
    }

    if (windSpeedChange >= 10) {
      const direction = newWeather.windSpeed > oldWeather.windSpeed ? "increased" : "decreased"
      let severity = "info"
      let icon = "💨"

      if (newWeather.windSpeed >= 50) {
        severity = "warning"
        icon = "🌪️"
      } else if (newWeather.windSpeed >= 30) {
        severity = "warning"
        icon = "💨"
      }

      addNotification(
        `${icon} Wind Speed Alert`,
        `Wind speed has ${direction} to ${newWeather.windSpeed} km/h (was ${oldWeather.windSpeed} km/h)`,
        severity as "warning" | "info",
        newWeather,
      )
    }

    if (humidityChange >= 15) {
      const direction = newWeather.humidity > oldWeather.humidity ? "increased" : "decreased"
      const comfort = newWeather.humidity > 70 ? "humid" : newWeather.humidity < 30 ? "dry" : "comfortable"

      addNotification(
        "💧 Humidity Change",
        `Humidity has ${direction} to ${newWeather.humidity}% (${comfort} conditions)`,
        "info",
        newWeather,
      )
    }
  }

  const sendLocationChangeNotification = (locationName: string, distance: number) => {
    const distanceKm = (distance / 1000).toFixed(1)
    const title = "Location Changed"
    const message = `You've moved ${distanceKm}km to ${locationName}. Getting weather for your new area.`

    // Show immediate notification
    addNotification(title, message, "info")

    // Send push notification if enabled
    if (pushNotificationsEnabled && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: message,
          icon: "/icon-192x192.png",
          tag: "location-change",
          renotify: true,
        })
        console.log("[v0] Location change notification sent")
      } catch (error) {
        console.error("[v0] Error sending location change notification:", error)
      }
    }
  }

  const sendWeatherChangeNotification = (title: string, message: string) => {
    // Show immediate notification
    addNotification(title, message, "warning")

    // Send push notification if enabled
    if (pushNotificationsEnabled && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: message,
          icon: "/icon-192x192.png",
          tag: "weather-change",
          renotify: true,
        })
        console.log("[v0] Weather change notification sent")
      } catch (error) {
        console.error("[v0] Error sending weather change notification:", error)
      }
    }
  }

  useEffect(() => {
    if (notificationsEnabled && locationServicesEnabled) {
      startLiveMonitoring()
    } else {
      stopLiveMonitoring()
    }

    return () => {
      stopLiveMonitoring()
    }
  }, [notificationsEnabled, locationServicesEnabled])

  useEffect(() => {
    return () => {
      stopLiveMonitoring()
    }
  }, [])

  useEffect(() => {
    if (riskPredictions && riskPredictions.length > 0) {
      riskPredictions.forEach((risk: any) => {
        const riskLevel = risk.risk
        const category = risk.category
        const trend = risk.trend
        const description = risk.description

        // Only notify for significant risks (>40%) or increasing trends
        if (riskLevel > 40 || (riskLevel > 25 && trend === "increasing")) {
          const getRiskIcon = (category: string) => {
            const icons: { [key: string]: string } = {
              "Rainfall Risk": "🌧️",
              "Flood Risk": "🌊",
              "Wind Risk": "💨",
              "Landslide Risk": "⛰️",
              "Thunderstorm Risk": "⛈️",
            }
            return icons[category] || "⚠️"
          }

          const severity = riskLevel > 60 ? "High" : riskLevel > 40 ? "Moderate" : "Low"
          const trendText = trend === "increasing" ? " (↗️ Rising)" : trend === "decreasing" ? " (↘️ Falling)" : ""

          addNotification(
            `${getRiskIcon(category)} ${category}`,
            `${severity} risk (${riskLevel}%)${trendText} - ${description}`,
            riskLevel > 50 ? "warning" : "info",
            currentWeather,
          )
        }
      })
    }
  }, [riskPredictions, currentWeather])

  const handleLocationSearch = async (locationName: string) => {
    const searchTerm = locationName || searchLocation

    if (!searchTerm || typeof searchTerm !== "string" || !searchTerm.trim()) {
      addNotification("Invalid Search", "Please enter a valid location name", "error")
      return
    }

    const trimmedLocation = searchTerm.trim()
    setSearchLoading(true)
    // </CHANGE> Fixed undeclared variable - changed 'response' to 'alertsResponse'
    // </CHANGE> Fixed undeclared variable - changed 'response' to 'alertsResponse'
    setSearchWeather(null)
    setSearchError("")

    console.log("[v0] Searching for location:", trimmedLocation)

    try {
      const properLocationName = findProperLocationName(trimmedLocation)
      const coordinates = geocodeLocation(properLocationName)

      if (!coordinates) {
        throw new Error(`Location "${trimmedLocation}" not found in our database`)
      }

      console.log("[v0] Found coordinates for", properLocationName, coordinates)

      const weatherResponse = await fetch(`/api/weather/current?lat=${coordinates.lat}&lon=${coordinates.lon}`)

      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch weather data")
      }

      const weatherData = await weatherResponse.json()
      console.log("[v0] Weather data received:", weatherData)

      const forecastResponse = await fetch(`/api/weather/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}`)
      let forecastData = null

      if (forecastResponse.ok) {
        forecastData = await forecastResponse.json()
        console.log("[v0] Forecast data received:", forecastData)
      }

      const searchWeatherData: WeatherData = {
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        description: weatherData.description || weatherData.condition,
        location: properLocationName,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        feelsLike: weatherData.feelsLike,
        icon: weatherData.icon,
      }

      setSearchWeather(searchWeatherData)
      setSelectedLocationName(properLocationName)

      if (forecastData && forecastData.forecasts) {
        setForecast(forecastData.forecasts)
      }

      const alertsResponse = await fetch(`/api/weather/alerts?lat=${coordinates.lat}&lon=${coordinates.lon}`)
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        if (alertsData.alerts) setAlerts(alertsData.alerts)
        if (alertsData.riskPredictions) setRiskPredictions(alertsData.riskPredictions)
      }

      const weatherEmoji = getWeatherEmoji(searchWeatherData.condition)
      addNotification(
        `${weatherEmoji} Weather Found`,
        `${properLocationName}: ${searchWeatherData.temperature}°C, ${searchWeatherData.description}`,
        "info",
      )

      updateRecentSearches(properLocationName)

      saveWeatherToHistory(searchWeatherData)
    } catch (error) {
      console.error("[v0] Location search failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch weather data"
      addNotification("Search Failed", errorMessage, "error")

      setSearchWeather(null)
      setSelectedLocationName("")
    } finally {
      setSearchLoading(false)
    }
  }

  const getWeatherEmoji = (condition: string): string => {
    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes("rain") || conditionLower.includes("drizzle")) return "🌧️"
    if (conditionLower.includes("thunder") || conditionLower.includes("storm")) return "⛈️"
    if (conditionLower.includes("cloud")) return "☁️"
    if (conditionLower.includes("clear") || conditionLower.includes("sun")) return "☀️"
    if (conditionLower.includes("snow")) return "❄️"
    if (conditionLower.includes("fog") || conditionLower.includes("mist")) return "🌫️"
    return "🌤️"
  }

  const fetchRiskPredictions = async (lat: number, lon: number, locationName: string) => {
    try {
      const response = await fetch(`/api/weather/alerts?lat=${lat}&lon=${lon}`)
      if (response.ok) {
        const alertData = await response.json()

        if (alertData.riskPredictions && alertData.riskPredictions.length > 0) {
          const highRisks = alertData.riskPredictions.filter((risk: any) => risk.risk > 50)
          const moderateRisks = alertData.riskPredictions.filter((risk: any) => risk.risk >= 30 && risk.risk <= 50)

          if (highRisks.length > 0) {
            const riskDetails = highRisks
              .map((risk: any) => `${risk.category}: ${risk.risk}% (${risk.trend})`)
              .join(", ")
            addNotification(
              "⚠️ High Risk Alert",
              `${locationName} - ${riskDetails}. ${highRisks[0].description}`,
              "warning",
              alertData,
            )
          } else if (moderateRisks.length > 0) {
            const riskDetails = moderateRisks.map((risk: any) => `${risk.category}: ${risk.risk}%`).join(", ")
            addNotification("🟡 Moderate Risk", `${locationName} - ${riskDetails}`, "info", alertData)
          } else {
            addNotification("✅ Low Risk", `${locationName} - All risk levels are currently low`, "info", alertData)
          }

          setRiskPredictions(alertData.riskPredictions)
        }
      }
    } catch (error) {
      console.error("[v0] Risk prediction fetch error:", error)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchLocation(suggestion)
    setSelectedLocationName(suggestion)
    setShowSuggestions(false)
    setFilteredSuggestions([])
    // Automatically search when suggestion is selected
    setTimeout(() => handleLocationSearch(suggestion), 100)
  }

  const fetchWeatherData = async (lat: number, lon: number, locationName?: string) => {
    try {
      setLoading(true)
      console.log("[v0] Fetching weather data for coordinates:", { lat, lon })

      const currentResponse = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}`)
      if (!currentResponse.ok) {
        throw new Error("Failed to fetch current weather")
      }
      const currentData = await currentResponse.json()

      const forecastResponse = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`)
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json()
        setForecast(forecastData.forecasts || [])
      }

      const alertsResponse = await fetch(`/api/weather/alerts?lat=${lat}&lon=${lon}`)
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setAlerts(alertsData.alerts || [])
        setRiskPredictions(alertsData.riskPredictions || [])
        if (alertsData.indices) {
          setWeatherIndices(alertsData.indices)
        }
      }

      const weatherData: WeatherData = {
        temperature: currentData.temperature,
        condition: currentData.condition,
        description: currentData.description || currentData.condition,
        location: locationName || currentData.location,
        humidity: currentData.humidity,
        windSpeed: currentData.windSpeed,
        feelsLike: currentData.feelsLike,
        icon: currentData.icon,
      }

      setCurrentWeather(weatherData)
      setCurrentLocationName(locationName || currentData.location)

      console.log("[v0] Weather data updated successfully")
    } catch (error) {
      console.error("[v0] Weather fetch error:", error)
      addNotification("Weather Error", "Failed to load weather data", "error")
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "Severe":
        return "destructive"
      case "High":
        return "destructive"
      case "Moderate":
        return "secondary"
      default:
        return "outline"
    }
  }

  const saveWeatherToHistory = useCallback((weatherData: WeatherData) => {
    if (!weatherData) return

    const now = new Date()

    let locationName = weatherData.location
    if (weatherData.location && weatherData.location.includes(",")) {
      // If location looks like coordinates (contains comma), try to reverse geocode
      const coords = weatherData.location.split(",").map((s) => Number.parseFloat(s.trim()))
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        locationName = reverseGeocode(coords[0], coords[1])
      }
    }

    const historyEntry: WeatherHistoryEntry = {
      id: `${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      date: now.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: now.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temperature: weatherData.temperature,
      condition: weatherData.condition,
      description: weatherData.description,
      location: weatherData.location,
      locationName: locationName,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      feelsLike: weatherData.feelsLike,
      icon: weatherData.icon,
      timestamp: now.getTime(),
    }

    setWeatherHistory((prev) => {
      // Remove duplicates within 10 minutes and same location
      const filtered = prev.filter(
        (entry) =>
          !(Math.abs(entry.timestamp - historyEntry.timestamp) < 600000 && entry.location === historyEntry.location),
      )

      // Keep only last 100 entries to prevent excessive storage
      const updated = [historyEntry, ...filtered].slice(0, 100)

      // Save to localStorage
      try {
        localStorage.setItem("winder-weather-history", JSON.stringify(updated))
      } catch (error) {
        console.error("[v0] Error saving weather history:", error)
      }

      return updated
    })
  }, [])

  const loadWeatherHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem("winder-weather-history")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setWeatherHistory(parsed)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading weather history:", error)
    }
  }, [])

  const getUniqueLocations = useCallback(() => {
    const locations = new Set<string>()
    weatherHistory.forEach((entry) => {
      const location = entry.locationName || entry.location
      if (location) {
        locations.add(location)
      }
    })
    return Array.from(locations).sort()
  }, [weatherHistory])

  const getFilteredHistory = useCallback(() => {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay
    const oneMonth = 30 * oneDay

    let filtered = weatherHistory

    switch (historyFilter) {
      case "today":
        filtered = filtered.filter((entry) => now - entry.timestamp < oneDay)
        break
      case "week":
        filtered = filtered.filter((entry) => now - entry.timestamp < oneWeek)
        break
      case "month":
        filtered = filtered.filter((entry) => now - entry.timestamp < oneMonth)
        break
      default:
        break
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((entry) => {
        const location = entry.locationName || entry.location
        return location === locationFilter
      })
    }

    return filtered
  }, [weatherHistory, historyFilter, locationFilter])

  const clearWeatherHistory = useCallback(() => {
    setWeatherHistory([])
    try {
      localStorage.removeItem("winder-weather-history")
      addNotification("History Cleared", "Weather history has been cleared", "info")
    } catch (error) {
      console.error("[v0] Error clearing weather history:", error)
    }
  }, [])

  useEffect(() => {
    loadWeatherHistory()
  }, [loadWeatherHistory])

  useEffect(() => {
    if (currentWeather) {
      saveWeatherToHistory(currentWeather)
    }
  }, [currentWeather, saveWeatherToHistory])

  const handleShareLocationWithAdmin = (shareType: "emergency" | "voluntary") => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const locationName = reverseGeocode(latitude, longitude)

        // Get device info
        const deviceInfo = navigator.userAgent.includes("iPhone")
          ? "iPhone"
          : navigator.userAgent.includes("Android")
            ? "Android Device"
            : navigator.userAgent.includes("Windows")
              ? "Windows Device"
              : "Unknown Device"

        // Create shared location data
        const sharedLocationData = {
          userId: user?.id || "anonymous",
          userName: user?.name || "Anonymous User",
          userEmail: user?.email || "anonymous@example.com",
          location: { lat: latitude, lng: longitude },
          address: locationName,
          shareType,
          expiresAt: new Date(Date.now() + (shareType === "emergency" ? 2 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000)), // 2h for emergency, 1h for voluntary
          accuracy: position.coords.accuracy || 10,
          deviceInfo,
        }

        // Add to admin system
        addSharedLocation(sharedLocationData)

        // Show success message
        addNotification(
          "Location Shared",
          `Your location has been shared with emergency services${shareType === "emergency" ? " as an emergency" : ""}`,
          "success",
        )

        setLocationSharingModalOpen(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        addNotification("Location Error", "Unable to access your location", "error")
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000,
      },
    )
  }

  const handleEmergencyReport = async (emergencyType: string, description: string) => {
    if (!navigator.geolocation) {
      // Always show emergency-related toasts regardless of notification settings
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    if (!emergencyFormData.senderName.trim() || !emergencyFormData.senderPhone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and phone number for emergency services",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    // Show loading toast
    toast({
      title: "Sending Report",
      description: "Getting your location and sending emergency report...",
      variant: "default",
      duration: 3000,
    })

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const locationName = reverseGeocode(latitude, longitude)

        // Get device info
        const deviceInfo = navigator.userAgent.includes("iPhone")
          ? "iPhone"
          : navigator.userAgent.includes("Android")
            ? "Android Device"
            : navigator.userAgent.includes("Windows")
              ? "Windows Device"
              : "Unknown Device"

        let priority: "critical" | "high" | "medium" | "low" = "medium"
        if (emergencyType === "medical") {
          priority = "critical"
        } else if (emergencyType === "fire" || emergencyType === "accident") {
          priority = "high"
        } else if (emergencyType === "crime" || emergencyType === "natural-disaster") {
          priority = "high"
        }

        const emergencyReportData = {
          userId: user?.id || "anonymous",
          userName: emergencyFormData.senderName,
          userEmail: user?.email || "anonymous@example.com",
          emergencyType,
          location: { lat: latitude, lng: longitude },
          address: locationName,
          contactNumber: emergencyFormData.senderPhone,
          peopleCount: emergencyFormData.peopleCount,
          additionalInfo: description,
          status: "pending" as const,
          priority,
          assignedTo: undefined,
          responseTime: undefined,
          notes: [],
          deviceInfo, // Add device info
          accuracy: position.coords.accuracy || 10,
        }

        try {
          const result = await saveEmergencyReport(emergencyReportData)
          if (result.success) {
            console.log("[v0] Emergency report saved to database successfully:", result.id)

            // Show detailed success toast - always visible for emergency reports
            const emergencyTypeFormatted = emergencyType.charAt(0).toUpperCase() + emergencyType.slice(1)
            toast({
              title: "✅ Emergency Report Sent",
              description: `${emergencyTypeFormatted} emergency reported at ${locationName}. Report ID: ${result.id?.slice(-6)}. Emergency services have been notified.`,
              variant: "default",
              duration: 8000,
            })

            setEmergencyFormData({
              senderName: "",
              senderPhone: "",
              emergencyType: "",
              description: "",
              peopleCount: 1,
            })
            setShowEmergencyForm(false)
            setLocationSharingModalOpen(false)

            // Also share location with admin
            handleShareLocationWithAdmin("emergency")
          } else {
            throw new Error("Failed to save emergency report")
          }
        } catch (error) {
          console.error("[v0] Error storing emergency report:", error)
          toast({
            title: "Error",
            description: "Failed to send emergency report. Please try again.",
            variant: "destructive",
            duration: 5000,
          })
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        // Show specific error messages based on error type - always visible for emergency reports
        let errorMessage = "Unable to access your location for emergency report"
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access denied. Please enable location services and try again."
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information unavailable. Please check your GPS settings."
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out. Please try again."
        }

        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Always try to get the latest location for emergencies
      },
    )
  }

  const handleEmergencyTypeSelect = (type: string, description: string) => {
    setEmergencyFormData((prev) => ({ ...prev, emergencyType: type, description }))
    setShowEmergencyForm(true)
  }

  const handleAssistanceRequest = (assistanceType: string, description: string) => {
    if (!navigator.geolocation) {
      addNotification("Location Error", "Geolocation is not supported by this browser", "error")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const locationName = reverseGeocode(latitude, longitude)

        // Get device info
        const deviceInfo = navigator.userAgent.includes("iPhone")
          ? "iPhone"
          : navigator.userAgent.includes("Android")
            ? "Android Device"
            : navigator.userAgent.includes("Windows")
              ? "Windows Device"
              : "Unknown Device"

        // Create assistance request data
        const assistanceRequestData = {
          id: `asr_${Date.now()}`,
          userId: user?.id || "anonymous",
          userName: user?.name || "Anonymous User",
          userEmail: user?.email || "anonymous@example.com",
          requestType: assistanceType,
          location: { lat: latitude, lng: longitude },
          address: locationName,
          contactNumber: user?.phone || "+63 XXX XXX XXXX",
          peopleCount: 1, // Default, can be updated by admin
          additionalInfo: description,
          timestamp: new Date(),
          status: "pending",
          priority: assistanceType === "rescue" ? "high" : "medium",
          assignedTo: null,
          responseTime: null,
          notes: [],
          deviceInfo,
          accuracy: position.coords.accuracy || 10,
        }

        // Add to assistance system (this would normally be an API call)
        console.log("[v0] Assistance request created:", assistanceRequestData)

        // Show success message
        addNotification(
          "Assistance Requested",
          `${assistanceType.charAt(0).toUpperCase() + assistanceType.slice(1)} assistance has been requested`,
          "success",
        )

        // Also share location with admin
        handleShareLocationWithAdmin("voluntary")
      },
      (error) => {
        console.error("Geolocation error:", error)
        addNotification("Location Error", "Unable to access your location for assistance request", "error")
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000,
      },
    )
  }

  const handleLocationSelect = (location: {
    name: string
    temperature: number
    condition: string
    icon: string
    reason: string
    score: number
  }) => {
    setSearchLocation(location.name)
    setSelectedLocationName(location.name)
    updateRecentSearches(location.name)
    setTimeout(() => handleLocationSearch(location.name), 100)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications
          .filter((notification) => notification.title.includes("Location Found"))
          .map((notification) => (
            <div
              key={notification.id}
              className={`bg-black/80 rounded-xl p-4 border border-slate-600/30 backdrop-blur-sm max-w-sm transition-all duration-500 transform ${
                notification.isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Bell className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{notification.title}</p>
                    <p className="text-xs text-slate-300 mt-1">{notification.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {notification.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="flex-shrink-0 ml-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Main Layout */}
      <div className="flex h-screen">
        {isMounted && (
          <>
            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50">
              <div className="grid grid-cols-6 gap-1 p-2">
                {/* Home */}
                <button
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                    activeView === "dashboard"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                  onClick={() => setActiveView("dashboard")}
                >
                  <Sun className="h-5 w-5 mb-1" />
                  <span className="text-[11px] font-medium">Home</span>
                </button>

                {/* Search */}
                <button
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                    mobileSearchOpen
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <Search className="h-5 w-5 mb-1" />
                  <span className="text-[11px] font-medium">Search</span>
                </button>

                {/* Map */}
                <button
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                    activeView === "map"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                  onClick={() => setActiveView("map")}
                >
                  <MapPin className="h-5 w-5 mb-1" />
                  <span className="text-[11px] font-medium">Map</span>
                </button>

                {/* Social */}
                <button
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                    activeView === "social"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                  onClick={() => setActiveView("social")}
                >
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-[11px] font-medium">Social</span>
                </button>

                {/* Quick Actions */}
                <button
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                    quickActionsModalOpen
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                  onClick={() => {
                    setQuickActionsModalOpen(true)
                  }}
                >
                  <Zap className="h-5 w-5 mb-1" />
                  <span className="text-[11px] font-medium">Quick</span>
                </button>

                {/* SOS */}
                <button
                  className="flex flex-col items-center justify-center py-3 px-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                  onClick={() => setEmergencyModalOpen(true)}
                >
                  <Phone className="h-5 w-5 mb-1" />
                  <span className="text-[11px] font-medium">SOS</span>
                </button>
              </div>
            </div>

            {/* Mobile Top Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-800/95 backdrop-blur-md border-b border-slate-700/50">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Cloud className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-blue-400">WINDER+</h1>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        {searchWeather ? selectedLocationName || searchLocation : currentLocationName || "Loading..."}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAlertsModalOpen(true)}
                    className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg relative"
                  >
                    <Bell className="h-4 w-4" />
                    {alerts.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-[10px] text-white font-bold">{alerts.length}</span>
                      </div>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettingsModalOpen(true)}
                    className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {mobileSearchOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="fixed inset-x-0 top-0 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md border-b border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                  Search Location
                </h2>
                <button
                  onClick={() => {
                    setMobileSearchOpen(false)
                    setShowSuggestions(false)
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search for cities..."
                  value={searchLocation}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLocationSearch(searchLocation)}
                  className={`w-full px-4 py-3 text-base bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 ${
                    searchLoading ? "text-white/50" : "text-white"
                  }`}
                />
                <Button
                  onClick={() => handleLocationSearch(searchLocation)}
                  disabled={searchLoading || !searchLocation.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg shadow-lg shadow-blue-500/25"
                >
                  {searchLoading ? <SearchSkeleton /> : "Search"}
                </Button>

                {/* Search Suggestions */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-r from-slate-800/95 to-slate-700/95 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-xl z-[100] max-h-64 overflow-y-auto scrollbar-hidden">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchLocation(suggestion)
                          setShowSuggestions(false)
                          handleLocationSearch(suggestion)
                          setMobileSearchOpen(false)
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleCurrentLocation}
                disabled={currentLocationLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-1.5 rounded-xl shadow-lg shadow-green-500/25 transition-all duration-200"
              >
                {currentLocationLoading ? (
                  <LocationSkeleton />
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Use Current Location
                  </>
                )}
              </Button>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-3">
                  <h3 className=" mt-2 text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    Recent Searches
                  </h3>
                  <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-3 border border-slate-600/30 backdrop-blur-sm">
                    <div className="space-y-2">
                      {recentSearches.slice(0, 5).map((search, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchLocation(search)
                            handleLocationSearch(search)
                            setMobileSearchOpen(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4 text-slate-400" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop Consolidated Sidebar */}
        <div className="hidden lg:flex lg:relative z-40 w-80 bg-slate-800/50 backdrop-blur-md border-r border-slate-700/50 flex-col h-full">
          {/* Header with branding and navigation */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Cloud className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold text-blue-400 mb-1">WINDER+</div>
                <div className="text-xs text-slate-400 leading-tight">
                  Weather, Index (Heat), Natural Disasters & Emergency Response
                </div>
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex justify-center space-x-2">
              <button
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  activeView === "dashboard"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                }`}
                onClick={() => setActiveView("dashboard")}
                title="Dashboard"
              >
                <Sun className="h-5 w-5" />
              </button>
              <button
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  activeView === "map"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                }`}
                onClick={() => setActiveView("map")}
                title="Weather Map"
              >
                <MapPin className="h-5 w-5" />
              </button>
              <button
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 relative ${
                  activeView === "alerts"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                }`}
                onClick={() => {
                  setAlertsModalOpen(true)
                }}
                title="Weather Alerts"
              >
                <Bell className="h-5 w-5" />
                {alerts.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{alerts.length}</span>
                  </div>
                )}
              </button>
              <button
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  activeView === "social"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                }`}
                onClick={() => setActiveView("social")}
                title="Social Feed"
              >
                <Users className="h-5 w-5" />
              </button>
              {/* ... existing emergency/settings buttons ... */}
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 border border-red-500/20"
                onClick={() => setEmergencyModalOpen(true)}
                title="Emergency Services"
              >
                <Phone className="h-5 w-5" />
              </button>
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/30 transition-all duration-200"
                onClick={() => setSettingsModalOpen(true)}
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-hidden">
            {/* Search Section */}
            <div className="space-y-3 relative z-50">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                Search Location
              </h2>
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-3 border border-slate-600/30 backdrop-blur-sm">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for cities..."
                    value={searchLocation}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLocationSearch(searchLocation)}
                    className={`w-full px-4 py-3 text-base bg-slate-700/50 border border-slate-600/50 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 ${
                      searchLoading ? "text-white/50 placeholder-white/40" : "text-white placeholder-slate-400"
                    }`}
                  />

                  <Button
                    onClick={() => handleLocationSearch(searchLocation)}
                    disabled={searchLoading || !searchLocation.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg shadow-lg shadow-blue-500/25"
                  >
                    {searchLoading ? <SearchSkeleton /> : "Search"}
                  </Button>

                  {/* Search Suggestions */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-r from-slate-800/95 to-slate-700/95 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-xl z-[200] max-h-64 overflow-y-auto scrollbar-hidden">
                      {filteredSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchLocation(suggestion)
                            setShowSuggestions(false)
                            handleLocationSearch(suggestion)
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCurrentLocation}
                  disabled={currentLocationLoading}
                  className="w-full mt-2 sm:mt-3 md:mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-green-500/25 transition-all duration-200"
                >
                  {currentLocationLoading ? (
                    <LocationSkeleton />
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Use Current Location
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                Quick Actions
              </h2>
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-3 border border-slate-600/30 backdrop-blur-sm">
                <div className="space-y-2">
                  <button
                    onClick={() => setEmergencyKitModalOpen(true)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Package className="h-4 w-4 text-blue-400" />
                    Emergency Kit Tracker
                  </button>
                  <button
                    onClick={() => setLocationSharingModalOpen(true)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    Report Emergency
                  </button>
                  <button
                    onClick={() => setWeatherHistoryModalOpen(true)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4 text-green-400" />
                    Weather History
                  </button>
                  {/* Admin Access Button */}
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4 text-blue-400" />
                    Admin Access
                  </button>
                  {/* Volunteer Access Button */}
                  <button
                    onClick={() => router.push("/volunteer-login")}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Users className="h-4 w-4 text-green-400" />
                    Volunteer Access
                  </button>
                  {/* Responder Access Button */}
                  <button
                    onClick={() => router.push("/responder-login")}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4 text-orange-400" />
                    Responder Access
                  </button>
                </div>
              </div>
            </div>

            {/* Suggested Locations */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                Suggested Locations
              </h2>
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-3 border border-slate-600/30 backdrop-blur-sm">
                <div className="space-y-2">
                  {suggestedLocations.slice(0, 3).map((location, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-600/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getWeatherIcon(location.condition, location.icon)}
                          <div>
                            <p className="text-sm font-medium text-white">{location.name}</p>
                            <p className="text-xs text-slate-400">{location.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {convertTemperature(location.temperature).toFixed(1)}
                            {getTemperatureUnit()}
                          </p>
                          <p className="text-xs text-slate-400">{location.condition}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                  Recent Searches
                </h2>
                <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-3 border border-slate-600/30 backdrop-blur-sm">
                  <div className="space-y-2">
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchLocation(search)
                          handleLocationSearch(search)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-slate-400" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pt-20 lg:pt-0 pb-20 lg:pb-0">
          {activeView === "social" ? (
            <InlineFeed />
          ) : activeView === "map" ? (
            <MapView
              showEvacuationMap={showEvacuationMap}
              setShowEvacuationMap={setShowEvacuationMap}
              getWeatherMapUrl={getWeatherMapUrl}
            />
          ) : (
            <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto scrollbar-hidden">
              {/* Current Weather */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-6 border border-slate-600/30 backdrop-blur-sm">
                {loading || searchLoading ? (
                  <WeatherCardSkeleton />
                ) : locationError ? (
                  <div className="text-center text-slate-400">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    {locationError}
                  </div>
                ) : searchWeather || currentWeather ? (
                  <>
                    {(() => {
                      const displayWeather = searchWeather || currentWeather
                      return (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h2 className="text-2xl font-semibold">{selectedLocationName || currentLocationName}</h2>
                              <p className="text-sm text-slate-300">
                                {formatDate(new Date())} • {displayWeather.description}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {getMainWeatherIcon(displayWeather.condition, displayWeather.icon)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-5xl font-bold">
                                {convertTemperature(displayWeather.temperature).toFixed(1)}
                                {getTemperatureUnit()}
                              </h3>
                              <p className="text-sm text-slate-300">
                                Feels like {convertTemperature(displayWeather.feelsLike).toFixed(1)}
                                {getTemperatureUnit()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-300">Humidity: {displayWeather.humidity}%</p>
                              <p className="text-sm text-slate-300">
                                Wind Speed: {convertWindSpeed(displayWeather.windSpeed).toFixed(1)}
                                {getWindSpeedUnit()}
                              </p>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </>
                ) : (
                  <div className="text-center text-slate-400">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    No weather data available.
                  </div>
                )}
              </div>

              {/* Forecast */}
              {loading || searchLoading ? (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    Weather Forecast
                  </h2>
                  <ForecastSkeleton />
                </div>
              ) : forecast.length > 0 ? (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    Weather Forecast
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {forecast.slice(1, 5).map((day) => (
                      <div
                        key={day.date}
                        className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-4 border border-slate-600/30 backdrop-blur-sm"
                      >
                        <p className="text-sm font-medium">{formatDate(day.date)}</p>
                        <div className="flex items-center justify-between my-2">
                          <div className="flex items-center">{getWeatherIcon(day.condition, day.icon)}</div>
                          <div className="text-right">
                            <p className="text-sm text-slate-300">
                              {convertTemperature(day.temperature.max).toFixed(1)}
                              {getTemperatureUnit()}
                            </p>
                            <p className="text-xs text-slate-400">
                              {convertTemperature(day.temperature.min).toFixed(1)}
                              {getTemperatureUnit()}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">{day.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Replace the inline risk predictions rendering with the new component */}
              {/* Risk Predictions */}
              {loading || searchLoading ? (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    Risk Predictions
                  </h2>
                  <RiskPredictionCard loading={true} risks={[]} />
                </div>
              ) : riskPredictions.length > 0 ? (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    Risk Predictions
                  </h2>
                  <RiskPredictionCard risks={riskPredictions} />
                </div>
              ) : null}

              {/* Weather Indices */}
              {weatherIndices && (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    Weather Indices
                  </h2>
                  {/* Update the Weather Indices display section to show UV Index instead of Flood Risk */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Heat Index */}
                    <div
                      className={`bg-gradient-to-r from-red-600/30 to-red-500/30 rounded-xl p-5 border border-red-500/40 shadow-lg transition-all duration-200`}
                    >
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-red-400" /> Heat Index
                      </h3>
                      <p className="text-2xl font-bold mt-2">{weatherIndices.heatIndex.value.toFixed(1)}°C</p>
                      <p className={`text-sm font-medium ${weatherIndices.heatIndex.color}`}>
                        {weatherIndices.heatIndex.category}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{weatherIndices.heatIndex.advisory}</p>
                    </div>

                    {/* UV Index */}
                    <div
                      className={`bg-gradient-to-r from-yellow-600/30 to-yellow-500/30 rounded-xl p-5 border border-yellow-500/40 shadow-lg transition-all duration-200`}
                    >
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Sun className="w-5 h-5 text-yellow-400" /> UV Index
                      </h3>
                      <p className="text-2xl font-bold mt-2">{weatherIndices.uvIndex.value.toFixed(1)}</p>
                      <p className={`text-sm font-medium ${weatherIndices.uvIndex.color}`}>
                        {weatherIndices.uvIndex.category}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{weatherIndices.uvIndex.advisory}</p>
                    </div>

                    {/* Typhoon Impact Index */}
                    <div
                      className={`bg-gradient-to-r from-purple-600/30 to-purple-500/30 rounded-xl p-5 border border-purple-500/40 shadow-lg transition-all duration-200`}
                    >
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Wind className="w-5 h-5 text-purple-400" /> Typhoon Impact
                      </h3>
                      <p className="text-2xl font-bold mt-2">{weatherIndices.typhoonImpactIndex.value.toFixed(1)}</p>
                      <p className={`text-sm font-medium ${weatherIndices.typhoonImpactIndex.color}`}>
                        {weatherIndices.typhoonImpactIndex.category}
                      </p>
                      {weatherIndices.typhoonImpactIndex.typhoonLevel && (
                        <p className="text-xs text-slate-300 mt-2">
                          Level: {weatherIndices.typhoonImpactIndex.typhoonLevel}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">{weatherIndices.typhoonImpactIndex.advisory}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Weather Map Modal */}
      {weatherMapModalOpen && (
        <Dialog open={weatherMapModalOpen} onOpenChange={setWeatherMapModalOpen}>
          <DialogContent
            className="w-[90vw] h-[65vh] lg:w-[75vw] lg:h-[85vh] !max-w-none
            bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
            border border-slate-700/60 text-white rounded-3xl shadow-2xl
            flex flex-col overflow-hidden animate-fadeInScale"
          >
            <DialogHeader className="flex-shrink-0 p-6 border-b border-slate-700/50">
              <DialogTitle className="flex items-center gap-4 text-xl sm:text-2xl font-bold">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <span>{showEvacuationMap ? "Evacuation Map" : "Weather Map"}</span>
              </DialogTitle>
            </DialogHeader>

            {/* Map Content */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              {showEvacuationMap ? (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6">
                  <EvacuationMap />
                </div>
              ) : (
                <iframe
                  src={getWeatherMapUrl()}
                  className="w-full h-full rounded-2xl border border-slate-700 shadow-inner hover:shadow-lg transition-all duration-300"
                  title="Weather Map"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Emergency Modal */}
      {emergencyModalOpen && (
        <Dialog open={emergencyModalOpen} onOpenChange={setEmergencyModalOpen}>
          <DialogContent
            className="w-[95vw] sm:w-[70vw] lg:w-[40vw] max-w-2xl
            mx-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
            border border-slate-700/60 text-white rounded-2xl sm:rounded-3xl shadow-2xl
            p-0 overflow-hidden animate-fadeInScale"
          >
            {/* Header */}
            <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b border-slate-700/50">
              <DialogTitle className="flex items-center gap-3 sm:gap-4 text-lg sm:text-2xl font-bold">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-red-600 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
                </div>
                <span>Emergency Services</span>
              </DialogTitle>
            </DialogHeader>

            {/* Buttons */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <Button
                className="w-full py-3 sm:py-4 justify-start rounded-xl sm:rounded-2xl
                bg-gradient-to-r from-red-600 to-red-500
                hover:from-red-500 hover:to-red-400
                border border-red-400/40 text-white
                text-base sm:text-lg font-semibold shadow-lg transition-all"
                onClick={() => {
                  window.open("tel:911", "_self")
                  setEmergencyModalOpen(false)
                }}
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                Call 911 – NDRRMC Emergency
              </Button>

              <Button
                className="w-full py-3 sm:py-4 justify-start rounded-xl sm:rounded-2xl
                bg-gradient-to-r from-blue-600 to-blue-500
                hover:from-blue-500 hover:to-blue-400
                border border-blue-400/40 text-white
                text-base sm:text-lg font-semibold shadow-lg transition-all"
                onClick={() => {
                  window.open("tel:143", "_self")
                  setEmergencyModalOpen(false)
                }}
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                Call 143 – Red Cross
              </Button>

              <Button
                className="w-full py-3 sm:py-4 justify-start rounded-xl sm:rounded-2xl
                bg-gradient-to-r from-orange-600 to-orange-500
                hover:from-orange-500 hover:to-orange-400
                border border-orange-400/40 text-white
                text-base sm:text-lg font-semibold shadow-lg transition-all"
                onClick={() => {
                  window.open("tel:117", "_self")
                  setEmergencyModalOpen(false)
                }}
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                Call 117 – Philippine Coast Guard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Alerts Modal */}
      {alertsModalOpen && (
        <Dialog open={alertsModalOpen} onOpenChange={setAlertsModalOpen}>
          <DialogContent
            className="w-[92vw] sm:w-[75vw] lg:w-[65vw] max-h-[85vh]
            bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
            border border-slate-700/60 text-white rounded-3xl shadow-2xl
            flex flex-col overflow-hidden animate-fadeInScale"
          >
            {/* Header */}
            <DialogHeader className="flex-shrink-0 p-6 border-b border-slate-700/50">
              <DialogTitle className="flex items-center gap-4 text-xl sm:text-2xl font-bold">
                <div className="w-12 h-12 bg-gradient-to-tr from-yellow-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bell className="w-6 h-6 text-white animate-pulse" />
                </div>
                <span className="text-white">Weather Alerts & Warnings</span>
              </DialogTitle>
            </DialogHeader>

            {/* Alerts Content */}
            <div
              className="flex-1 overflow-y-auto scrollbar-hide space-y-5 py-6 px-4 sm:px-6
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {alerts.length > 0 ? (
                <div className="space-y-5">
                  {alerts.map((alert) => {
                    const severityColors =
                      alert.severity === "Severe"
                        ? "from-red-700/40 via-red-600/30 to-red-700/40 border-red-600/40"
                        : alert.severity === "Moderate"
                          ? "from-yellow-600/40 via-yellow-500/30 to-yellow-600/40 border-yellow-500/40"
                          : alert.severity === "High"
                            ? "from-orange-600/40 via-orange-500/30 to-orange-600/40 border-orange-500/40"
                            : "from-blue-700/40 via-blue-600/30 to-blue-700/40 border-blue-600/40"

                    return (
                      <div
                        key={alert.id}
                        className={`bg-gradient-to-br ${severityColors}
                        rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-300 border`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-lg text-white leading-snug">{alert.title}</span>
                          <Badge
                            className={`uppercase tracking-wide text-xs px-3 py-1 rounded-lg font-semibold ${getSeverityBadgeColor(alert.severity)}`}
                          >
                            {alert.severity}
                          </Badge>
                        </div>

                        <p className="text-slate-200 mb-4 leading-relaxed text-sm">{alert.description}</p>

                        <div className="text-sm text-slate-300 space-y-2">
                          <p>
                            <span className="font-medium text-slate-200">Affected Areas:</span> {alert.areas.join(", ")}
                          </p>
                          <p>
                            <span className="font-medium text-slate-200">Valid Until:</span>{" "}
                            {formatDate(alert.validUntil)}
                          </p>
                          {alert.issued && (
                            <p>
                              <span className="font-medium text-slate-200">Issued:</span> {formatDate(alert.issued)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Bell className="h-14 w-14 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No active weather alerts</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Settings Modal */}
      {settingsModalOpen && (
        <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
          <DialogContent
            className="w-[92vw] max-w-2xl max-h-[85vh]
            bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
            border border-slate-700/60 text-white rounded-3xl shadow-2xl
            flex flex-col overflow-hidden animate-fadeInScale"
          >
            {/* Header */}
            <DialogHeader className="flex-shrink-0 p-6 border-b border-slate-700/50">
              <DialogTitle className="flex items-center gap-4 text-xl sm:text-2xl font-bold">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white animate-spin-slow"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <span className="text-white">Settings</span>
              </DialogTitle>
            </DialogHeader>

            {/* Scrollable Content */}
            <div
              className="flex-1 overflow-y-auto py-6 px-5 sm:px-6 space-y-8
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {/* Temperature Unit */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                  Temperature Unit
                </h3>
                <div className="flex space-x-3">
                  {["celsius", "fahrenheit"].map((unit) => (
                    <Button
                      key={unit}
                      size="lg"
                      onClick={() => setTemperatureUnit(unit)}
                      className={`flex-1 h-12 rounded-2xl font-medium transition-all ${
                        temperatureUnit === unit
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                          : "bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700/60"
                      }`}
                    >
                      {unit === "celsius" ? "Celsius (°C)" : "Fahrenheit (°F)"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Wind Speed Unit */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                  Wind Speed Unit
                </h3>
                <div className="flex space-x-3">
                  {["kmh", "mph", "ms"].map((unit) => (
                    <Button
                      key={unit}
                      size="lg"
                      onClick={() => setWindSpeedUnit(unit)}
                      className={`flex-1 h-12 rounded-2xl font-medium transition-all ${
                        windSpeedUnit === unit
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                          : "bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700/60"
                      }`}
                    >
                      {unit === "kmh" ? "km/h" : unit === "mph" ? "mph" : "m/s"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Location Services */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                  Location Services
                </h3>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-slate-300">Use your location for local weather</span>
                  <Button
                    size="sm"
                    onClick={() => setLocationServicesEnabled(!locationServicesEnabled)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      locationServicesEnabled
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                        : "bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 border border-slate-700/60"
                    }`}
                  >
                    {locationServicesEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                  Notifications
                </h3>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-slate-300">Enable weather alerts and updates</span>
                  <Button
                    size="sm"
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      notificationsEnabled
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                        : "bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 border border-slate-700/60"
                    }`}
                  >
                    {notificationsEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                  Push Notifications
                </h3>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-slate-300">Enable push notifications for alerts</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!pushNotificationsEnabled) {
                        requestPushNotificationPermission()
                      } else {
                        setPushNotificationsEnabled(false)
                      }
                    }}
                    disabled={!notificationsEnabled}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      pushNotificationsEnabled
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                        : "bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 border border-slate-700/60"
                    } ${!notificationsEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {pushNotificationsEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-8">
                <SMSSettings
                  onSave={(preferences) => {
                    setSmsPreferences(preferences)
                  }}
                  initialPreferences={smsPreferences} // Pass initial preferences
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Emergency Kit Tracker Component */}
      <EmergencyKitTracker
        open={emergencyKitModalOpen}
        onOpenChange={(open) => {
          setEmergencyKitModalOpen(open)
          if (!open && isQuickActionsFlow) {
            setTimeout(() => setQuickActionsModalOpen(true), 100)
          }
        }}
      />

      {/* Weather History Modal */}
      {weatherHistoryModalOpen && (
        <Dialog
          open={weatherHistoryModalOpen}
          onOpenChange={(open) => {
            setWeatherHistoryModalOpen(open)
            if (!open && isQuickActionsFlow) {
              setTimeout(() => setQuickActionsModalOpen(true), 100)
            }
          }}
        >
          <DialogContent
            className="w-[92vw] sm:w-[40vw] max-h-[80vh]
            bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
            border border-slate-700/60 text-white rounded-3xl shadow-2xl
            flex flex-col overflow-hidden animate-fadeInScale"
          >
            {/* Header */}
            <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b border-slate-700/50">
              <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xl sm:text-2xl font-bold">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-green-600 to-green-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-white text-lg sm:text-xl">Weather History</h2>
                    <p className="text-slate-400 text-xs sm:text-sm font-normal">
                      {getFilteredHistory().length} records found
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                    className="flex-1 sm:flex-none bg-slate-800/70 border border-slate-600 rounded-lg px-3 py-2 text-white
                    focus:outline-none focus:ring-2 focus:ring-green-500 shadow-inner"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>

                  {weatherHistory.length > 0 && (
                    <Button
                      onClick={clearWeatherHistory}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 border-red-600 text-red-400 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-500
                      hover:text-white transition rounded-lg px-3 sm:px-4 py-2 bg-transparent text-sm"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-hide">
              {getFilteredHistory().length > 0 ? (
                <div className="space-y-3">
                  {getFilteredHistory().map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-gradient-to-r from-slate-800/40 to-slate-900/40
                      border border-slate-700/50 rounded-2xl p-4 sm:p-5
                      hover:from-slate-800/70 hover:to-slate-900/70
                      transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                          <div className="flex-shrink-0">{getWeatherIcon(entry.condition, entry.icon)}</div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-white font-semibold text-lg">
                                {Math.round(convertTemperature(entry.temperature))}
                                {getTemperatureUnit()}
                              </h3>
                              <span className="text-slate-300 text-sm">{entry.condition}</span>
                            </div>

                            <p className="text-slate-400 text-sm mb-2">{entry.description}</p>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{entry.locationName || entry.location}</span>
                              </span>
                              <span className="whitespace-nowrap">💧 {entry.humidity}%</span>
                              <span className="whitespace-nowrap">
                                💨 {Math.round(convertWindSpeed(entry.windSpeed))} {getWindSpeedUnit()}
                              </span>
                              <span className="whitespace-nowrap">
                                🌡️ Feels like {Math.round(convertTemperature(entry.feelsLike))}
                                {getTemperatureUnit()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right text-slate-400 text-sm flex-shrink-0">
                          <div className="font-medium text-xs sm:text-sm">{entry.date}</div>
                          <div className="text-xs">{entry.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-16">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-slate-600 animate-pulse" />
                  <h3 className="text-lg font-medium mb-2">No weather history available</h3>
                  <p className="text-sm">
                    {historyFilter === "all"
                      ? "Weather data will appear here as you use the app"
                      : `No weather data found for the selected time period`}
                  </p>
                  {historyFilter !== "all" && (
                    <Button
                      onClick={() => setHistoryFilter("all")}
                      variant="outline"
                      size="sm"
                      className="mt-4 border-slate-600 text-slate-400 hover:bg-slate-700 rounded-lg"
                    >
                      View All History
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Report Emergency Modal */}
      {locationSharingModalOpen && (
        <Dialog
          open={locationSharingModalOpen}
          onOpenChange={(open) => {
            setLocationSharingModalOpen(open)
            if (!open && isQuickActionsFlow) {
              setTimeout(() => setQuickActionsModalOpen(true), 100)
            }
          }}
        >
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

            <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto scrollbar-hide max-h-[60vh] sm:max-h-[70vh]">
              {showEmergencyForm ? (
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
                        value={emergencyFormData.senderName}
                        onChange={(e) => setEmergencyFormData((prev) => ({ ...prev, senderName: e.target.value }))}
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
                        value={emergencyFormData.senderPhone}
                        onChange={(e) => setEmergencyFormData((prev) => ({ ...prev, senderPhone: e.target.value }))}
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
                        value={emergencyFormData.peopleCount}
                        onChange={(e) =>
                          setEmergencyFormData((prev) => ({
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
                        {emergencyFormData.emergencyType.charAt(0).toUpperCase() +
                          emergencyFormData.emergencyType.slice(1)}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">{emergencyFormData.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowEmergencyForm(false)}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() =>
                        handleEmergencyReport(emergencyFormData.emergencyType, emergencyFormData.description)
                      }
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white"
                      disabled={!emergencyFormData.senderName.trim() || !emergencyFormData.senderPhone.trim()}
                    >
                      Send Emergency Report
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-300 leading-relaxed text-center text-xs sm:text-sm md:text-base">
                    Select the type of emergency to report. Your location will be automatically shared with emergency
                    services.
                  </p>

                  <div className="space-y-2 sm:space-y-3">
                    {/* Medical Emergency */}
                    <Button
                      className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400
                      text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-red-500/20
                      flex items-center justify-start gap-2 sm:gap-3 md:gap-4 group"
                      onClick={() =>
                        handleEmergencyTypeSelect("medical", "Medical emergency - immediate assistance needed")
                      }
                    >
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                        <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-xs sm:text-sm md:text-base">Medical Emergency</div>
                        <div className="text-xs opacity-90">Injury, illness, or health crisis</div>
                      </div>
                    </Button>

                    {/* Fire Emergency */}
                    <Button
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400
                      text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-orange-500/20
                      flex items-center gap-2 sm:gap-3 md:gap-4 group"
                      onClick={() => handleEmergencyTypeSelect("fire", "Fire emergency - fire department needed")}
                    >
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-xs sm:text-sm md:text-base">Fire Emergency</div>
                        <div className="text-xs opacity-90">Fire, smoke, or burning hazard</div>
                      </div>
                    </Button>

                    {/* Crime/Security */}
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400
                      text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-purple-500/20
                      flex items-center gap-2 sm:gap-3 md:gap-4 group"
                      onClick={() => handleEmergencyTypeSelect("crime", "Crime emergency - police assistance needed")}
                    >
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-xs sm:text-sm md:text-base">Crime Emergency</div>
                        <div className="text-xs opacity-90">Crime, threat, or safety concern</div>
                      </div>
                    </Button>

                    {/* Natural Disaster */}
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                      text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-blue-500/20
                      flex items-center gap-2 sm:gap-3 md:gap-4 group"
                      onClick={() =>
                        handleEmergencyTypeSelect(
                          "natural-disaster",
                          "Natural disaster - flood, typhoon, earthquake, or landslide",
                        )
                      }
                    >
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                        <CloudRain className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-xs sm:text-sm md:text-base">Natural Disaster</div>
                        <div className="text-xs opacity-90">Flood, typhoon, earthquake, landslide</div>
                      </div>
                    </Button>

                    {/* Accident */}
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400
                      text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-yellow-500/20
                      flex items-center gap-2 sm:gap-3 md:gap-4 group"
                      onClick={() =>
                        handleEmergencyTypeSelect("accident", "Traffic accident - emergency response needed")
                      }
                    >
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                        <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-xs sm:text-sm md:text-base">Traffic Accident</div>
                        <div className="text-xs opacity-90">Vehicle collision or road incident</div>
                      </div>
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-slate-700/50">
                    <p className="text-slate-400 text-sm text-center mb-3">Or contact emergency services directly:</p>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500
                        text-white rounded-xl py-3 font-semibold shadow-lg transition hover:scale-[1.02]"
                        onClick={() => window.open("tel:911", "_self")}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call 911
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500
                        text-white rounded-xl py-3 font-semibold shadow-lg transition hover:scale-[1.02]"
                        onClick={() => window.open("tel:143", "_self")}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call 143
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quick Actions Modal */}
      {quickActionsModalOpen && (
        <Dialog
          open={quickActionsModalOpen}
          onOpenChange={(open) => {
            setQuickActionsModalOpen(open)
            if (!open) {
              setIsQuickActionsFlow(false)
            }
          }}
        >
          <DialogContent
            className="w-[95vw] sm:w-[90vw] md:w-[70vw] lg:w-[50vw] max-w-2xl
            mx-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
            border border-slate-700/60 rounded-2xl shadow-2xl
            p-0 overflow-hidden animate-fadeInScale"
          >
            {/* Header */}
            <DialogHeader className="flex-shrink-0 p-4 sm:p-5 md:p-6 border-b border-slate-700/50">
              <DialogTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-2xl font-bold">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-tr from-red-600 to-red-500 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white animate-pulse" />
                </div>
                <span>Quick Actions</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 p-3 sm:p-4 md:p-6 space-y-1.5 sm:space-y-2 md:space-y-3 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto scrollbar-hide">
              <p className="text-slate-300 leading-relaxed text-center text-xs sm:text-sm md:text-base mb-3 sm:mb-4">
                Access essential features and emergency services quickly.
              </p>

              <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                {/* Emergency Kit Tracker */}
                <button
                  onClick={() => {
                    setIsQuickActionsFlow(true)
                    setEmergencyKitModalOpen(true)
                    setQuickActionsModalOpen(false)
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                  text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-blue-500/20
                  flex items-center gap-2 sm:gap-3 md:gap-4 group"
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm md:text-base">Emergency Kit Tracker</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">Preparedness & inventory</div>
                  </div>
                </button>

                {/* Report Emergency */}
                <button
                  onClick={() => {
                    setIsQuickActionsFlow(true)
                    setLocationSharingModalOpen(true)
                    setQuickActionsModalOpen(false)
                  }}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400
                  text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-orange-500/20
                  flex items-center gap-2 sm:gap-3 md:gap-4 group"
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm md:text-base">Report Emergency</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">Alert emergency services</div>
                  </div>
                </button>

                {/* Weather History */}
                <button
                  onClick={() => {
                    setIsQuickActionsFlow(true)
                    setWeatherHistoryModalOpen(true)
                    setQuickActionsModalOpen(false)
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400
                  text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-green-500/20
                  flex items-center gap-2 sm:gap-3 md:gap-4 group"
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm md:text-base">Weather History</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">View past weather data</div>
                  </div>
                </button>

                {/* Admin Access */}
                <button
                  onClick={() => {
                    router.push("/login")
                    setQuickActionsModalOpen(false)
                    setIsQuickActionsFlow(false)
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                  text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-blue-500/20
                  flex items-center gap-2 sm:gap-3 md:gap-4 group"
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm md:text-base">Admin Access</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">Administrative dashboard</div>
                  </div>
                </button>

                {/* Volunteer Access */}
                <button
                  onClick={() => {
                    router.push("/volunteer-login")
                    setQuickActionsModalOpen(false)
                    setIsQuickActionsFlow(false)
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400
                  text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-emerald-500/20
                  flex items-center gap-2 sm:gap-3 md:gap-4 group"
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm md:text-base">Volunteer Access</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">Field updates and monitoring</div>
                  </div>
                </button>

                {/* Responder Access */}
                <button
                  onClick={() => {
                    router.push("/responder-login")
                    setQuickActionsModalOpen(false)
                    setIsQuickActionsFlow(false)
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400
                  text-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 font-semibold shadow-lg transition hover:shadow-xl hover:shadow-red-500/20
                  flex items-center gap-2 sm:gap-3 md:gap-4 group"
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm md:text-base">Responder Access</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">Emergency response portal</div>
                  </div>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  )
}
