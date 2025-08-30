"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  Phone,
  MapPin,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Settings,
  Bell,
  Search,
  X,
  Clock,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"

interface WeatherData {
  temperature: number
  condition: string
  description: string
  location: string
  humidity: number
  windSpeed: number
  pressure: number
  feelsLike: number
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
}

export default function WinderPlus() {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [riskPredictions, setRiskPredictions] = useState<RiskPrediction[]>([])
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
    if ("serviceWorker" in navigator && "PushManager" in window) {
      // Create inline service worker to avoid file serving issues
      const serviceWorkerCode = `
        self.addEventListener('push', function(event) {
          const options = {
            body: event.data ? event.data.text() : 'Weather update available',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'weather-notification',
            renotify: true,
            requireInteraction: false,
            actions: [
              {
                action: 'view',
                title: 'View Details'
              }
            ]
          };
          
          event.waitUntil(
            self.registration.showNotification('Weather Alert', options)
          );
        });

        self.addEventListener('notificationclick', function(event) {
          event.notification.close();
          event.waitUntil(
            clients.openWindow('/')
          );
        });

        self.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
            const options = {
              body: event.data.message,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: 'weather-notification',
              renotify: true,
              requireInteraction: false
            };
            
            self.registration.showNotification(event.data.title, options);
          }
        });
      `

      const blob = new Blob([serviceWorkerCode], { type: "application/javascript" })
      const serviceWorkerUrl = URL.createObjectURL(blob)

      navigator.serviceWorker
        .register(serviceWorkerUrl, { scope: "/" })
        .then((registration) => {
          console.log("[v0] Service Worker registered successfully:", registration)
          // Clean up the blob URL
          URL.revokeObjectURL(serviceWorkerUrl)

          // Check if there's an existing subscription
          return registration.pushManager.getSubscription()
        })
        .then((existingSubscription) => {
          if (existingSubscription) {
            setPushSubscription(existingSubscription)
            setPushNotificationsEnabled(true)
            console.log("[v0] Found existing push subscription")
          }
        })
        .catch((error) => {
          console.log("[v0] Service Worker registration failed:", error)
          // Clean up the blob URL on error
          URL.revokeObjectURL(serviceWorkerUrl)
          addNotification("Service Worker Error", "Push notifications may not work properly", "error")
        })
    } else {
      console.log("[v0] Service Worker or Push Manager not supported")
      addNotification("Not Supported", "Push notifications are not supported in this browser", "error")
    }
  }, [])

  const requestPushNotificationPermission = async () => {
    if (!("Notification" in window)) {
      addNotification("Not Supported", "Push notifications are not supported in this browser", "error")
      return false
    }

    try {
      const permission = await Notification.requestPermission()

      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready

        // Use environment variable for VAPID key or fallback to demo key
        const vapidKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          "BEl62iUYgUivxIkv69yViEuiBIa40HI6YUTakcfaUYxOqHSgMfpfMUrxQJNLLISHBNKnNdoMrZYF_9_NLnomkZg"

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        })

        setPushSubscription(subscription)
        setPushNotificationsEnabled(true)
        addNotification(
          "Push Notifications Enabled",
          "You will receive weather alerts even when the app is closed",
          "info",
        )

        console.log("[v0] Push subscription created:", subscription)
        return true
      } else {
        addNotification("Permission Denied", "Push notifications were not allowed", "error")
        return false
      }
    } catch (error) {
      console.error("[v0] Error requesting push notification permission:", error)
      addNotification("Permission Error", "Failed to enable push notifications", "error")
      return false
    }
  }

  const sendPushNotification = (title: string, message: string) => {
    if (!pushNotificationsEnabled || !("serviceWorker" in navigator)) {
      console.log("[v0] Push notifications not enabled or not supported")
      return
    }

    // Send via service worker for background notifications
    navigator.serviceWorker.ready
      .then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: "PUSH_NOTIFICATION",
            title,
            message,
          })
          console.log("[v0] Push notification sent via service worker")
        }
      })
      .catch((error) => {
        console.error("[v0] Error sending push notification:", error)
      })

    // Also show immediate notification if permission is granted and page is visible
    if (Notification.permission === "granted" && document.visibilityState === "visible") {
      try {
        new Notification(title, {
          body: message,
          icon: "/icon-192x192.png",
          tag: "weather-notification",
          renotify: true,
        })
        console.log("[v0] Immediate notification shown")
      } catch (error) {
        console.error("[v0] Error showing immediate notification:", error)
      }
    }
  }

  const addNotification = (title: string, message: string, type: "warning" | "info" | "error" | "news" = "info") => {
    const notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date(),
      isVisible: true,
    }
    setNotifications((prev) => [notification, ...prev.slice(0, 2)]) // Keep only 3 notifications

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notification.id ? { ...notif, isVisible: false } : notif)),
      )
    }, 6000)

    // Remove from array after animation completes
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== notification.id))
    }, 6500)
  }

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
      addNotification(randomNews.title, randomNews.message, randomNews.type)

      if (pushNotificationsEnabled) {
        sendPushNotification(randomNews.title, randomNews.message)
      }
    }, 15000) // Show news every 15 seconds when enabled

    return () => clearInterval(interval)
  }, [notificationsEnabled, pushNotificationsEnabled])

  useEffect(() => {
    if (notificationsEnabled && alerts.length > 0) {
      const latestAlert = alerts[0]
      const alertTitle = `Weather Alert: ${latestAlert.severity.toUpperCase()}`
      addNotification(alertTitle, latestAlert.title, "warning")

      if (pushNotificationsEnabled) {
        sendPushNotification(alertTitle, latestAlert.title)
      }
    }
  }, [alerts, notificationsEnabled, pushNotificationsEnabled])

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
      case "extreme":
        return "destructive"
      case "high":
        return "destructive"
      case "moderate":
        return "secondary"
      default:
        return "outline"
    }
  }

  const geocodeLocation = (locationName: string): { lat: number; lon: number } | null => {
    const locations: Record<string, { lat: number; lon: number }> = {
      // NCR
  "Metro Manila": { lat: 14.5995, lon: 120.9842 },
  "Manila": { lat: 14.5995, lon: 120.9842 },
  "Quezon City": { lat: 14.6760, lon: 121.0437 },
  "Caloocan City": { lat: 14.7566, lon: 121.0453 },
  "Makati City": { lat: 14.5547, lon: 121.0244 },
  "Pasig City": { lat: 14.5764, lon: 121.0851 },
  "Taguig City": { lat: 14.5176, lon: 121.0509 },
  "Parañaque City": { lat: 14.4793, lon: 121.0198 },
  "Las Piñas City": { lat: 14.4499, lon: 120.9983 },
  "Muntinlupa City": { lat: 14.3833, lon: 121.0500 },
  "Marikina City": { lat: 14.6507, lon: 121.1029 },
  "Valenzuela City": { lat: 14.7060, lon: 120.9830 },
  "San Juan City": { lat: 14.6042, lon: 121.0300 },
  "Mandaluyong City": { lat: 14.5836, lon: 121.0409 },
  "Pasay City": { lat: 14.5378, lon: 120.9815 },
  "Malabon City": { lat: 14.6686, lon: 120.9563 },
  "Navotas City": { lat: 14.6667, lon: 120.9500 },

  // Luzon - Central Luzon
  "Pampanga": { lat: 15.0794, lon: 120.6194 },
  "San Fernando City": { lat: 15.0336, lon: 120.6844 },
  "Angeles City": { lat: 15.1449, lon: 120.5886 },

  "Zambales": { lat: 15.3333, lon: 119.9500 },
  "Olongapo City": { lat: 14.8386, lon: 120.2842 },
  "Iba": { lat: 15.3276, lon: 119.9783 },

  "Bataan": { lat: 14.6760, lon: 120.5400 },
  "Balanga City": { lat: 14.6760, lon: 120.5400 },

  "Bulacan": { lat: 14.8535, lon: 120.8160 },
  "Malolos City": { lat: 14.8433, lon: 120.8117 },
  "Meycauayan City": { lat: 14.7333, lon: 120.9667 },
  "San Jose del Monte City": { lat: 14.8139, lon: 121.0453 },

  // Luzon - Northern
  "Ilocos Norte": { lat: 18.1647, lon: 120.7110 },
  "Laoag City": { lat: 18.1978, lon: 120.5936 },

  "Ilocos Sur": { lat: 17.5707, lon: 120.3875 },
  "Vigan City": { lat: 17.5747, lon: 120.3869 },

  "La Union": { lat: 16.6159, lon: 120.3199 },
  "San Fernando City (La Union)": { lat: 16.6159, lon: 120.3199 },

  "Cagayan": { lat: 18.2489, lon: 121.8780 },
  "Tuguegarao City": { lat: 17.6131, lon: 121.7269 },

  "Isabela": { lat: 16.9754, lon: 121.8106 },
  "Ilagan City": { lat: 17.1486, lon: 121.8894 },

  "Kalinga": { lat: 17.5000, lon: 121.5000 },
  "Tabuk City": { lat: 17.4500, lon: 121.4583 },

  "Benguet": { lat: 16.3993, lon: 120.6010 },
  "Baguio City": { lat: 16.4023, lon: 120.5960 },
  "Sagada": { lat: 17.0756, lon: 120.9081 },

  // Luzon - Southern
  "Batangas": { lat: 13.7565, lon: 121.0583 },
  "Batangas City": { lat: 13.7565, lon: 121.0583 },

  "Cavite": { lat: 14.4791, lon: 120.8969 },
  "Trece Martires City": { lat: 14.2806, lon: 120.8664 },
  "Tagaytay City": { lat: 14.0976, lon: 120.9406 },

  "Laguna": { lat: 14.1700, lon: 121.3331 },
  "Calamba City": { lat: 14.2117, lon: 121.1653 },
  "San Pablo City": { lat: 14.0667, lon: 121.3250 },

  "Rizal": { lat: 14.6034, lon: 121.3080 },
  "Antipolo City": { lat: 14.6258, lon: 121.1226 },

  "Quezon Province": { lat: 13.9418, lon: 121.6236 },
  "Lucena City": { lat: 13.9418, lon: 121.6236 },

  "Oriental Mindoro": { lat: 13.0833, lon: 121.0833 },
  "Calapan City": { lat: 13.4103, lon: 121.1800 },

  "Palawan": { lat: 9.8349, lon: 118.7384 },
  "Puerto Princesa City": { lat: 9.7392, lon: 118.7353 },

  "Albay": { lat: 13.1667, lon: 123.7333 },
  "Legazpi City": { lat: 13.1333, lon: 123.7333 },

  "Camarines Sur": { lat: 13.6226, lon: 123.1948 },
  "Naga City": { lat: 13.6218, lon: 123.1948 },

  "Masbate": { lat: 12.1667, lon: 123.5833 },
  "Masbate City": { lat: 12.3667, lon: 123.6167 },

  "Sorsogon": { lat: 12.9667, lon: 124.0167 },
  "Sorsogon City": { lat: 12.9714, lon: 124.0064 },

  // Visayas
  "Capiz": { lat: 11.5833, lon: 122.7500 },
  "Roxas City": { lat: 11.5853, lon: 122.7511 },

  "Iloilo": { lat: 10.7202, lon: 122.5621 },
  "Iloilo City": { lat: 10.7202, lon: 122.5621 },

  "Negros Occidental": { lat: 10.6407, lon: 122.9689 },
  "Bacolod City": { lat: 10.6765, lon: 122.9509 },

  "Bohol": { lat: 9.8499, lon: 124.1435 },
  "Tagbilaran City": { lat: 9.6475, lon: 123.8556 },

  "Cebu": { lat: 10.3157, lon: 123.8854 },
  "Cebu City": { lat: 10.3157, lon: 123.8854 },
  "Lapu-Lapu City": { lat: 10.3102, lon: 123.9494 },
  "Mandaue City": { lat: 10.3236, lon: 123.9226 },
  "Toledo City": { lat: 10.3772, lon: 123.6386 },
  "Carcar City": { lat: 10.1150, lon: 123.6403 },
  "Danao City": { lat: 10.5281, lon: 124.0272 },
  "Talisay City (Cebu)": { lat: 10.2447, lon: 123.8494 },

  "Eastern Samar": { lat: 11.5000, lon: 125.5000 },
  "Borongan City": { lat: 11.6077, lon: 125.4312 },

  "Leyte": { lat: 11.2500, lon: 124.7500 },
  "Tacloban City": { lat: 11.2433, lon: 124.9772 },
  "Ormoc City": { lat: 11.0064, lon: 124.6075 },
  "Baybay City": { lat: 10.6781, lon: 124.8000 },

  "Samar": { lat: 12.0000, lon: 125.0000 },
  "Catbalogan City": { lat: 11.7753, lon: 124.8861 },

  "Southern Leyte": { lat: 10.3333, lon: 125.0833 },
  "Maasin City": { lat: 10.1333, lon: 124.8333 },

  // Mindanao
  "Zamboanga del Norte": { lat: 8.5, lon: 123.5 },
  "Dipolog City": { lat: 8.5886, lon: 123.3409 },

  "Zamboanga del Sur": { lat: 7.8333, lon: 123.5000 },
  "Pagadian City": { lat: 7.8257, lon: 123.4366 },

  "Zamboanga Sibugay": { lat: 7.8333, lon: 122.7500 },
  "Zamboanga City": { lat: 6.9214, lon: 122.0790 },

  "Bukidnon": { lat: 8.0000, lon: 125.0000 },
  "Malaybalay City": { lat: 8.1458, lon: 125.1278 },
  "Valencia City": { lat: 7.9000, lon: 125.0833 },

  "Misamis Occidental": { lat: 8.5000, lon: 123.7500 },
  "Oroquieta City": { lat: 8.4833, lon: 123.8000 },
  "Ozamiz City": { lat: 8.1462, lon: 123.8444 },
  "Tangub City": { lat: 8.0672, lon: 123.7500 },

  "Misamis Oriental": { lat: 8.5000, lon: 124.7500 },
  "Cagayan de Oro City": { lat: 8.4542, lon: 124.6319 },
  "Gingoog City": { lat: 8.8333, lon: 125.0833 },

  "Davao del Norte": { lat: 7.4500, lon: 125.7500 },
  "Tagum City": { lat: 7.4478, lon: 125.8078 },

  "Davao del Sur": { lat: 6.7500, lon: 125.3500 },
  "Digos City": { lat: 6.7500, lon: 125.3500 },
  "Davao City": { lat: 7.1907, lon: 125.4553 },

  "Davao Oriental": { lat: 7.0000, lon: 126.1667 },
  "Mati City": { lat: 6.9500, lon: 126.2167 },

  "Cotabato": { lat: 7.2167, lon: 124.2500 },
  "Kidapawan City": { lat: 7.0083, lon: 125.0894 },

  "South Cotabato": { lat: 6.3333, lon: 124.8333 },
  "Koronadal City": { lat: 6.5031, lon: 124.8469 },
  "General Santos City": { lat: 6.1164, lon: 125.1716 },

  "Agusan del Norte": { lat: 9.1667, lon: 125.7500 },
  "Butuan City": { lat: 8.9492, lon: 125.5436 },

  "Surigao del Norte": { lat: 9.7500, lon: 125.7500 },
  "Surigao City": { lat: 9.7833, lon: 125.4833 },

  "Surigao del Sur": { lat: 8.7500, lon: 126.1667 },
  "Tandag City": { lat: 9.0789, lon: 126.1986 },

  "Basilan": { lat: 6.5000, lon: 122.0833 },
  "Isabela City": { lat: 6.7000, lon: 121.9667 },

  "Lanao del Sur": { lat: 7.8333, lon: 124.3333 },
  "Marawi City": { lat: 8.0000, lon: 124.3000 },

  "Lanao del Norte": { lat: 8.0000, lon: 124.0000 },
  "Iligan City": { lat: 8.2289, lon: 124.2400 },

  "Maguindanao": { lat: 7.0500, lon: 124.4500 },
  "Cotabato City": { lat: 7.2236, lon: 124.2464 },

  "Sultan Kudarat": { lat: 6.5000, lon: 124.3333 },
  "Tacurong City": { lat: 6.6925, lon: 124.6764 },
    }

    const normalizedLocation = locationName.toLowerCase().trim();
  const entries = Object.entries(locations).map(([key, value]) => ({
    key: key.toLowerCase(),
    originalKey: key,
    value,
  }));

  // If province is mentioned (e.g. "San Fernando Pampanga")
  const provinceMatch = entries.find(
    (entry) =>
      normalizedLocation.includes("san fernando") &&
      normalizedLocation.includes(entry.key.split(", ")[1]?.toLowerCase() || "")
  );
  if (provinceMatch) return provinceMatch.value;

  // Exact match
  const exactMatch = entries.find((entry) => entry.key === normalizedLocation);
  if (exactMatch) return exactMatch.value;

  // Starts with match
  const startsWithMatches = entries
    .filter((entry) => entry.key.startsWith(normalizedLocation))
    .sort((a, b) => a.key.length - b.key.length);
  if (startsWithMatches.length > 0) return startsWithMatches[0].value;

  // Contains match
  const containsMatches = entries
    .filter((entry) => entry.key.includes(normalizedLocation))
    .sort((a, b) => a.key.length - b.key.length);
  if (containsMatches.length > 0) return containsMatches[0].value;

  return null;
};

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

    if (value.trim().length > 0) {
      const allLocations = getAllLocations()
      const filtered = allLocations
        .filter((location) => location.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 8) // Limit to 8 suggestions

      setFilteredSuggestions(filtered)
      setShowSuggestions(true)
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
    setTimeout(() => handleLocationSearch(), 100)
  }

  const generateSmartSuggestions = useCallback(() => {
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
    const now = typeof window !== "undefined" ? new Date() : new Date(2024, 0, 1, 12, 0, 0) // Default to noon on Jan 1, 2024 for SSR
    const currentHour = now.getHours()
    const isWeekend = [0, 6].includes(now.getDay())
    const currentMonth = now.getMonth()

    allLocations.forEach((location) => {
      let score = 0
      let reason = ""

      // Factor 1: Recent searches (highest priority)
      if (recentSearches.includes(location)) {
        score += 50
        reason = "Recently searched"
      }

      // Factor 2: Geographic proximity to current location
      if (currentLocationName && location !== currentLocationName) {
        const proximityBonus = getProximityScore(currentLocationName, location)
        score += proximityBonus
        if (proximityBonus > 15) reason = "Nearby location"
      }

      // Factor 3: Popular destinations
      const popularCities = ["Manila", "Cebu City", "Davao City", "Baguio", "Boracay", "Palawan"]
      if (popularCities.includes(location)) {
        score += 25
        if (!reason) reason = "Popular destination"
      }

      // Factor 4: Seasonal recommendations
      const seasonalBonus = getSeasonalScore(location, currentMonth)
      score += seasonalBonus
      if (seasonalBonus > 10 && !reason) reason = "Great weather season"

      // Factor 5: Time-based suggestions
      if (currentHour >= 6 && currentHour <= 10) {
        // Morning: suggest cooler places
        if (["Baguio", "Tagaytay", "Sagada"].includes(location)) {
          score += 15
          if (!reason) reason = "Cool morning weather"
        }
      } else if (currentHour >= 17 && currentHour <= 21) {
        // Evening: suggest places with good sunset views
        if (["Boracay", "Palawan", "Batangas", "La Union"].includes(location)) {
          score += 15
          if (!reason) reason = "Beautiful sunset views"
        }
      }

      // Factor 6: Weekend suggestions
      if (isWeekend) {
        const weekendDestinations = ["Baguio", "Tagaytay", "Batangas", "Laguna"]
        if (weekendDestinations.includes(location)) {
          score += 20
          if (!reason) reason = "Perfect weekend getaway"
        }
      }

      // Generate realistic weather data based on location and season
      const weatherData = generateRealisticWeather(location, currentMonth)

      // Factor 7: Weather condition bonus
      if (weatherData.condition === "sunny" || weatherData.condition === "partly-cloudy") {
        score += 10
      }

      if (score > 0) {
        suggestions.push({
          name: location,
          temperature: weatherData.temperature,
          condition: weatherData.condition,
          icon: weatherData.icon,
          reason: reason || "Recommended",
          score,
        })
      }
    })

    // Sort by score and take top 4, then use stable selection for SSR consistency
    const topSuggestions = suggestions.sort((a, b) => b.score - a.score).slice(0, 4)

    const finalSuggestions =
      typeof window !== "undefined"
        ? topSuggestions.sort(() => Math.random() - 0.5).slice(0, 2)
        : topSuggestions.slice(0, 2) // Use first 2 for SSR consistency

    setSuggestedLocations(finalSuggestions)
  }, [currentLocationName, recentSearches])

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
      Manila: { baseTemp: 28, variation: 4, sunnyChance: 0.6 },
      "Cebu City": { baseTemp: 29, variation: 3, sunnyChance: 0.7 },
      "Davao City": { baseTemp: 31, variation: 3, sunnyChance: 0.65 },
      Baguio: { baseTemp: 20, variation: 5, sunnyChance: 0.5 },
      Boracay: { baseTemp: 30, variation: 2, sunnyChance: 0.8 },
    }

    const pattern = weatherPatterns[location] || { baseTemp: 28, variation: 4, sunnyChance: 0.6 }
    const temp = Math.round(pattern.baseTemp + (Math.random() - 0.5) * pattern.variation)
    const isSunny = Math.random() < pattern.sunnyChance

    return {
      temperature: temp,
      condition: isSunny ? "sunny" : "partly-cloudy",
      icon: isSunny ? "sun" : "cloud",
    }
  }

  const updateRecentSearches = (location: string) => {
    setRecentSearches((prev) => {
      const updated = [location, ...prev.filter((l) => l !== location)].slice(0, 5)
      return updated
    })
  }

  const handleSuggestionCardClick = (locationName: string) => {
    setSearchLocation(locationName)
    setSelectedLocationName(locationName)
    updateRecentSearches(locationName)
    setTimeout(() => handleLocationSearch(), 100)
  }

  const handleLocationSearch = async () => {
    if (!searchLocation.trim()) return

    setSearchLoading(true)
    setShowSuggestions(false) // Hide suggestions when searching
    console.log("[v0] Searching for location:", searchLocation)

    updateRecentSearches(searchLocation)

    try {
      const coordinates = geocodeLocation(searchLocation)

      if (!coordinates) {
        console.error("[v0] Location not found in geocoding database:", searchLocation)
        alert(
          `Location "${searchLocation}" not found. Try searching for major Philippine cities like Manila, Cebu, Davao, etc.`,
        )
        return
      }

      console.log("[v0] Found coordinates for", searchLocation, ":", coordinates)

      const properLocationName = findProperLocationName(searchLocation)
      const displayName = selectedLocationName || properLocationName || searchLocation

      try {
        // Fetch current weather
        const response = await fetch(`/api/weather/current?lat=${coordinates.lat}&lon=${coordinates.lon}`)
        console.log("[v0] Search weather response status:", response.status)

        if (response.ok) {
          const weatherData = await response.json()
          console.log("[v0] Search weather data received:", weatherData)
          weatherData.location = `${displayName} (${coordinates.lat.toFixed(2)}, ${coordinates.lon.toFixed(2)})`
          setSearchWeather(weatherData)
        } else {
          const errorText = await response.text()
          console.error("[v0] Failed to fetch weather for searched location:", errorText)
          alert("Failed to fetch weather data for the searched location. Please try again.")
        }

        // Fetch forecast for searched location
        const forecastResponse = await fetch(`/api/weather/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}`)
        console.log("[v0] Search forecast response status:", forecastResponse.status)

        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json()
          console.log("[v0] Search forecast data received:", forecastData)
          setForecast(forecastData.forecasts || [])
        } else {
          const forecastErrorText = await forecastResponse.text()
          console.error("[v0] Failed to fetch forecast for searched location:", forecastErrorText)
          // Don't show alert for forecast error, just log it
        }

        // Fetch alerts for searched location
        const alertsResponse = await fetch(`/api/weather/alerts?lat=${coordinates.lat}&lon=${coordinates.lon}`)
        console.log("[v0] Search alerts response status:", alertsResponse.status)

        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json()
          console.log("[v0] Search alerts data received:", alertsData)
          setAlerts(alertsData.alerts || [])
          setRiskPredictions(alertsData.riskPredictions || [])
        } else {
          const alertsErrorText = await alertsResponse.text()
          console.error("[v0] Failed to fetch alerts for searched location:", alertsErrorText)
          // Don't show alert for alerts error, just log it
        }
      } catch (fetchError) {
        console.error("[v0] Error fetching weather data for searched location:", fetchError)
        alert("Failed to fetch complete weather data for the searched location. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error searching location:", error)
      alert("An error occurred while searching for the location. Please try again.")
    } finally {
      setSearchLoading(false)
    }
  }

  const findProperLocationName = (searchTerm: string): string => {
    const locations: Record<string, string> = {
      // Major cities
      manila: "Manila",
      quezon: "Quezon City",
      "quezon city": "Quezon City",
      caloocan: "Caloocan",
      davao: "Davao City",
      "davao city": "Davao City",
      cebu: "Cebu City",
      "cebu city": "Cebu City",
      zamboanga: "Zamboanga City",
      "zamboanga city": "Zamboanga City",
      antipolo: "Antipolo",
      taguig: "Taguig",
      pasig: "Pasig",
      cagayan: "Cagayan de Oro",
      "cagayan de oro": "Cagayan de Oro",
      paranaque: "Paranaque",
      "las pinas": "Las Pinas",
      makati: "Makati",
      muntinlupa: "Muntinlupa",
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

      // Visayas
      bohol: "Bohol",
      negros: "Negros Occidental",
      "negros occidental": "Negros Occidental",
      "negros oriental": "Negros Oriental",
      iloilo: "Iloilo",
      leyte: "Leyte",
      samar: "Samar",

      // Mindanao
      "south cotabato": "South Cotabato",
      "north cotabato": "North Cotabato",
      bukidnon: "Bukidnon",
      "surigao del norte": "Surigao del Norte",
      "surigao del sur": "Surigao del Sur",
      "agusan del norte": "Agusan del Norte",
      "agusan del sur": "Agusan del Sur",
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
      { name: "Las Pinas", lat: 14.4378, lon: 120.9942, radius: 0.1 },
      { name: "Muntinlupa", lat: 14.3832, lon: 121.0409, radius: 0.1 },
      { name: "Antipolo", lat: 14.5878, lon: 121.176, radius: 0.1 },
      { name: "Olongapo City", lat: 14.8293, lon: 120.2824, radius: 0.25 },
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

    // Notify on significant temperature change (>3°C)
    if (tempChange >= 3) {
      const direction = newWeather.temperature > oldWeather.temperature ? "increased" : "decreased"
      sendWeatherChangeNotification(
        "Temperature Change",
        `Temperature has ${direction} by ${tempChange.toFixed(1)}°C to ${newWeather.temperature}°C`,
      )
    }

    // Notify on weather condition change
    if (conditionChanged) {
      sendWeatherChangeNotification(
        "Weather Condition Change",
        `Weather changed from ${oldWeather.condition} to ${newWeather.condition}`,
      )
    }

    // Notify on significant wind speed change (>10 km/h)
    if (windSpeedChange >= 10) {
      const direction = newWeather.windSpeed > oldWeather.windSpeed ? "increased" : "decreased"
      sendWeatherChangeNotification("Wind Speed Change", `Wind speed has ${direction} to ${newWeather.windSpeed} km/h`)
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

      // Send initial notification
      addNotification("Live Notifications Enabled", "You'll receive updates about weather changes in your area", "info")
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

  return (
    <div className="min-h-screen dark-dashboard text-white">
      <div className="flex h-screen">
        {isMounted && (
          <>
            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-md border-t border-slate-700/50">
              <div className="grid grid-cols-5 gap-1 p-2">
                <button
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${
                    activeView === "dashboard"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                  onClick={() => setActiveView("dashboard")}
                >
                  <Sun className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Home</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${
                    mobileSearchOpen
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <Search className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Search</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${
                    activeView === "map"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                  onClick={() => {
                    setActiveView("map")
                    setWeatherMapModalOpen(true)
                  }}
                >
                  <MapPin className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Map</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 relative ${
                    activeView === "alerts"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                  onClick={() => {
                    setActiveView("alerts")
                    setAlertsModalOpen(true)
                  }}
                >
                  <Bell className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Alerts</span>
                  {alerts.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{alerts.length}</span>
                    </div>
                  )}
                </button>
                <button
                  className="flex flex-col items-center justify-center py-2 px-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                  onClick={() => setEmergencyModalOpen(true)}
                >
                  <Phone className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">SOS</span>
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
                    <h1 className="text-sm font-bold text-blue-400">WINDER+</h1>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-300">
                        {searchWeather ? selectedLocationName || searchLocation : currentLocationName || "Loading..."}
                      </span>
                    </div>
                  </div>
                </div>
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
          </>
        )}

        {mobileSearchOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="fixed inset-x-0 top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Search Location</h2>
                <button
                  onClick={() => {
                    setMobileSearchOpen(false)
                    setShowSuggestions(false)
                  }}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/30"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Philippine cities..."
                    value={searchLocation}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
                    className="w-full pl-10 pr-20 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    onClick={handleLocationSearch}
                    disabled={searchLoading || !searchLocation.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>

                {/* Mobile Search Suggestions */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleSuggestionSelect(suggestion)
                          setMobileSearchOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Searches for Mobile */}
              {recentSearches.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-white">Recent Searches</h3>
                  <div className="space-y-2">
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchLocation(search)
                          handleLocationSearch()
                          setMobileSearchOpen(false)
                        }}
                        className="w-full flex items-center px-3 py-2 text-left text-white hover:bg-slate-700/30 rounded-lg transition-colors"
                      >
                        <Clock className="h-4 w-4 mr-3 text-slate-400" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop Consolidated Sidebar - merged navigation and search into single sidebar */}
        <div className="hidden lg:flex lg:relative z-40 w-80 bg-slate-800/50 backdrop-blur-md border-r border-slate-700/50 flex-col h-full">
          {/* Header with branding and navigation */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Cloud className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-blue-400 mb-1">WINDER+</div>
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
                onClick={() => {
                  setActiveView("map")
                  setWeatherMapModalOpen(true)
                }}
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
                  setActiveView("alerts")
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
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Search Location</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Philippine cities..."
                  value={searchLocation}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
                  className="w-full px-4 py-3 text-base bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                />
                <Button
                  onClick={handleLocationSearch}
                  disabled={searchLoading || !searchLocation.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>

                {/* Search Suggestions */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto scrollbar-hidden">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="w-full px-4 py-3 text-base text-left text-white hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Services */}
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Emergency Services</h2>
              <div className="space-y-3">
                <Button
                  variant="destructive"
                  size="default"
                  className="w-full justify-start bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-white text-sm h-12 rounded-xl"
                  onClick={() => window.open("tel:911", "_self")}
                >
                  <Phone className="h-4 w-4 mr-3" />
                  911 - NDRRMC
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className="w-full justify-start bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-white text-sm h-12 rounded-xl"
                  onClick={() => window.open("tel:143", "_self")}
                >
                  <Phone className="h-4 w-4 mr-3" />
                  143 - Red Cross
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className="w-full justify-start bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-white text-sm h-12 rounded-xl"
                  onClick={() => window.open("tel:117", "_self")}
                >
                  <Phone className="h-4 w-4 mr-3" />
                  117 - Coast Guard
                </Button>
              </div>
            </div>

            {/* Latest Searches */}
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Latest Searches</h2>
              <div className="space-y-3">
                {currentWeather && (
                  <div
                    onClick={async () => {
                      if (!navigator.geolocation || !locationServicesEnabled) {
                        addNotification("Location Error", "Location services are disabled", "error")
                        return
                      }

                      setIsLocationLoading(true)
                      setSearchWeather(null)
                      setSelectedLocationName("")
                      setSearchLocation("")

                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          const { latitude, longitude } = position.coords
                          const locationName = reverseGeocode(latitude, longitude)
                          setCurrentLocationName(locationName)

                          try {
                            // Fetch fresh current weather data
                            const weatherResponse = await fetch(`/api/weather/current?lat=${latitude}&lon=${longitude}`)
                            if (weatherResponse.ok) {
                              const weatherData = await weatherResponse.json()
                              setCurrentWeather(weatherData)
                            }

                            // Fetch fresh forecast data
                            const forecastResponse = await fetch(
                              `/api/weather/forecast?lat=${latitude}&lon=${longitude}`,
                            )
                            if (forecastResponse.ok) {
                              const forecastData = await forecastResponse.json()
                              setForecast(forecastData.forecasts || [])
                            }

                            // Fetch fresh alerts data
                            const alertsResponse = await fetch(`/api/weather/alerts?lat=${latitude}&lon=${longitude}`)
                            if (alertsResponse.ok) {
                              const alertsData = await alertsResponse.json()
                              setAlerts(alertsData.alerts || [])
                              setRiskPredictions(alertsData.riskPredictions || [])
                            }

                            addNotification("Location Updated", "Current location weather refreshed", "info")
                          } catch (error) {
                            console.error("[v0] Error refreshing current location:", error)
                            addNotification("Refresh Error", "Failed to refresh current location data", "error")
                          } finally {
                            setIsLocationLoading(false)
                          }
                        },
                        (error) => {
                          console.error("[v0] Geolocation error:", error)
                          addNotification("Location Error", "Unable to get your current location", "error")
                          setIsLocationLoading(false)
                        },
                        { timeout: 10000, enableHighAccuracy: true },
                      )
                    }}
                    className="glass-card rounded-xl p-4 hover:bg-slate-700/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Sun className="h-6 w-6 text-yellow-400 weather-icon" />
                        <div>
                          <h3 className="font-medium text-white text-sm">{currentLocationName}</h3>
                          <p className="text-xs text-slate-400">Current Location</p>
                        </div>
                      </div>
                      <span className="text-2xl font-light text-white">
                        {Math.round(convertTemperature(currentWeather.temperature))}
                        {getTemperatureUnit()}
                      </span>
                    </div>
                  </div>
                )}

                {searchWeather && (
                  <div
                    onClick={async () => {
                      const searchName = selectedLocationName || searchLocation
                      if (!searchName) return

                      setSearchLoading(true)
                      updateRecentSearches(searchName)

                      try {
                        const coordinates = geocodeLocation(searchName)
                        if (!coordinates) {
                          addNotification("Location Error", `Could not find coordinates for ${searchName}`, "error")
                          return
                        }

                        // Fetch all weather data for the searched location
                        const [weatherResponse, forecastResponse, alertsResponse] = await Promise.all([
                          fetch(`/api/weather/current?lat=${coordinates.lat}&lon=${coordinates.lon}`),
                          fetch(`/api/weather/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}`),
                          fetch(`/api/weather/alerts?lat=${coordinates.lat}&lon=${coordinates.lon}`),
                        ])

                        if (weatherResponse.ok) {
                          const weatherData = await weatherResponse.json()
                          setSearchWeather(weatherData)
                        }

                        if (forecastResponse.ok) {
                          const forecastData = await forecastResponse.json()
                          setForecast(forecastData.forecasts || [])
                        }

                        if (alertsResponse.ok) {
                          const alertsData = await alertsResponse.json()
                          setAlerts(alertsData.alerts || [])
                          setRiskPredictions(alertsData.riskPredictions || [])
                        }

                        addNotification("Weather Updated", `Refreshed weather data for ${searchName}`, "info")
                      } catch (error) {
                        console.error("[v0] Error refreshing search location:", error)
                        addNotification("Refresh Error", `Failed to refresh weather data for ${searchName}`, "error")
                      } finally {
                        setSearchLoading(false)
                      }
                    }}
                    className="glass-card rounded-xl p-4 hover:bg-slate-700/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Cloud className="h-6 w-6 text-gray-400 weather-icon" />
                        <div>
                          <h3 className="font-medium text-white text-sm">{selectedLocationName || searchLocation}</h3>
                          <p className="text-xs text-slate-400">Search Result</p>
                        </div>
                      </div>
                      <span className="text-2xl font-light text-white">
                        {Math.round(convertTemperature(searchWeather.temperature))}
                        {getTemperatureUnit()}
                      </span>
                    </div>
                  </div>
                )}

                <div
                  onClick={async () => {
                    setSearchLocation("Manila")
                    setSelectedLocationName("Manila")
                    updateRecentSearches("Manila")

                    setSearchLoading(true)
                    try {
                      const coordinates = geocodeLocation("Manila")
                      if (!coordinates) {
                        addNotification("Location Error", "Could not find coordinates for Manila", "error")
                        return
                      }

                      // Fetch all weather data for Manila
                      const [weatherResponse, forecastResponse, alertsResponse] = await Promise.all([
                        fetch(`/api/weather/current?lat=${coordinates.lat}&lon=${coordinates.lon}`),
                        fetch(`/api/weather/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}`),
                        fetch(`/api/weather/alerts?lat=${coordinates.lat}&lon=${coordinates.lon}`),
                      ])

                      if (weatherResponse.ok) {
                        const weatherData = await weatherResponse.json()
                        setSearchWeather(weatherData)
                      }

                      if (forecastResponse.ok) {
                        const forecastData = await forecastResponse.json()
                        setForecast(forecastData.forecasts || [])
                      }

                      if (alertsResponse.ok) {
                        const alertsData = await alertsResponse.json()
                        setAlerts(alertsData.alerts || [])
                        setRiskPredictions(alertsData.riskPredictions || [])
                      }

                      addNotification("Weather Loaded", "Loaded weather data for Manila", "info")
                    } catch (error) {
                      console.error("[v0] Error loading Manila weather:", error)
                      addNotification("Load Error", "Failed to load weather data for Manila", "error")
                    } finally {
                      setSearchLoading(false)
                    }
                  }}
                  className="glass-card rounded-xl p-4 hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Wind className="h-6 w-6 text-blue-400 weather-icon" />
                      <div>
                        <h3 className="font-medium text-white text-sm mb-1">Manila</h3>
                        <p className="text-xs text-slate-400">Capital City</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-400">Tap to load</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Suggestions */}
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Smart Suggestions</h2>
              <div className="grid grid-cols-2 gap-3">
                {suggestedLocations.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionCardClick(suggestion.name)}
                    className="glass-card rounded-xl p-4 text-center hover:bg-slate-700/30 transition-all duration-200 group min-h-[120px] flex flex-col justify-center"
                  >
                    {suggestion.icon === "sun" ? (
                      <Sun className="h-8 w-8 text-yellow-400 mx-auto mb-3 weather-icon group-hover:scale-110 transition-transform" />
                    ) : (
                      <Cloud className="h-8 w-8 text-gray-400 mx-auto mb-3 weather-icon group-hover:scale-110 transition-transform" />
                    )}
                    <h3 className="font-medium text-white mb-2 text-sm leading-tight">{suggestion.name}</h3>
                    <span className="text-xl font-light text-white">
                      {suggestion.temperature}
                      {getTemperatureUnit()}
                    </span>
                    <p className="text-xs text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity leading-tight">
                      {suggestion.reason}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - improved layout with single sidebar */}
        <div className="flex-1 flex flex-col pt-16 lg:pt-0 pb-20 lg:pb-0 min-w-0">
          {/* Right Weather Detail Panel */}
          <div className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto scrollbar-hidden min-w-0">
            <div className="glass-card rounded-2xl p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
                <div className="mb-6 lg:mb-0 min-w-0 flex-1">
                  <h1 className="text-4xl lg:text-5xl font-light text-white mb-4 leading-tight truncate">
                    {searchWeather ? selectedLocationName || searchLocation : currentLocationName || "Loading..."}
                  </h1>
                  <div className="flex items-center space-x-8">
                    <span className="text-6xl lg:text-7xl font-thin text-white">
                      {searchWeather
                        ? Math.round(convertTemperature(searchWeather.temperature))
                        : currentWeather
                          ? Math.round(convertTemperature(currentWeather.temperature))
                          : "--"}
                      {getTemperatureUnit()}
                    </span>
                    <Cloud className="h-20 lg:h-24 w-20 lg:w-24 text-gray-300 weather-icon flex-shrink-0" />
                  </div>
                  {(searchWeather || currentWeather) && (
                    <p className="text-slate-400 mt-4 text-lg">
                      {searchWeather ? searchWeather.description : currentWeather?.description}
                    </p>
                  )}
                </div>
              </div>

              {(currentWeather || searchWeather) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                  <div className="text-center bg-slate-700/30 rounded-xl p-4 md:p-6">
                    <p className="text-sm text-slate-400 mb-2">Humidity</p>
                    <p className="text-lg md:text-xl text-white font-medium">
                      {searchWeather ? searchWeather.humidity : currentWeather?.humidity}%
                    </p>
                  </div>
                  <div className="text-center bg-slate-700/30 rounded-xl p-4 md:p-6">
                    <p className="text-sm text-slate-400 mb-2">Wind Speed</p>
                    <p className="text-lg md:text-xl text-white font-medium">
                      {Math.round(
                        convertWindSpeed(searchWeather ? searchWeather.windSpeed : currentWeather?.windSpeed || 0),
                      )}{" "}
                      {getWindSpeedUnit()}
                    </p>
                  </div>
                  <div className="text-center bg-slate-700/30 rounded-xl p-4 md:p-6">
                    <p className="text-sm text-slate-400 mb-2">Pressure</p>
                    <p className="text-lg md:text-xl text-white font-medium">
                      {searchWeather ? searchWeather.pressure : currentWeather?.pressure} hPa
                    </p>
                  </div>
                </div>
              )}

              {forecast.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">5 DAY FORECAST</h3>
                  <div className="space-y-3">
                    {forecast.slice(0, 5).map((day, index) => (
                      <div key={index} className="flex items-center justify-between py-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-slate-400 w-12">
                            {index === 0 ? "Today" : new Date(day.date).toLocaleDateString("en", { weekday: "short" })}
                          </span>
                          <Sun className="h-5 w-5 text-yellow-400 weather-icon" />
                          <span className="text-sm text-white">{day.description}</span>
                        </div>
                        <span className="text-sm text-white">
                          {Math.round(convertTemperature(day.temperature.max))}
                          {getTemperatureUnit()}/{Math.round(convertTemperature(day.temperature.min))}
                          {getTemperatureUnit()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  <span className="ml-3 text-white">Loading weather data...</span>
                </div>
              </div>
            )}

            {alerts.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                  Active Alerts
                </h3>
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white">{alert.title}</span>
                        <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">{alert.description}</p>
                      <p className="text-xs text-slate-500 mt-1">Valid until: {formatDate(alert.validUntil)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {riskPredictions.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Risk Predictions</h3>
                <div className="space-y-3">
                  {riskPredictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTrendIcon(prediction.trend)}
                        <div>
                          <span className="text-sm font-medium text-white">{prediction.category}</span>
                          <p className="text-xs text-slate-400">{prediction.description}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-medium ${getRiskColor(prediction.risk)}`}>{prediction.risk}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {weatherMapModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-medium text-white">Weather Map</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeatherMapModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 p-6">
              <iframe
                src={getWeatherMapUrl()}
                className="w-full h-full rounded-xl border border-slate-600"
                title="Weather Map"
              />
            </div>
          </div>
        </div>
      )}

      {emergencyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-medium text-white flex items-center">
                <Phone className="h-5 w-5 text-red-400 mr-2" />
                Emergency Services
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEmergencyModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <div className="p-6 space-y-3">
              <Button
                variant="destructive"
                className="w-full justify-start bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-white"
                onClick={() => {
                  window.open("tel:911", "_self")
                  setEmergencyModalOpen(false)
                }}
              >
                <Phone className="h-4 w-4 mr-3" />
                Call 911 - NDRRMC Emergency
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-white"
                onClick={() => {
                  window.open("tel:143", "_self")
                  setEmergencyModalOpen(false)
                }}
              >
                <Phone className="h-4 w-4 mr-3" />
                Call 143 - Red Cross
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-white"
                onClick={() => {
                  window.open("tel:117", "_self")
                  setEmergencyModalOpen(false)
                }}
              >
                <Phone className="h-4 w-4 mr-3" />
                Call 117 - Philippine Coast Guard
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-white"
                onClick={() => {
                  setWeatherMapModalOpen(true)
                  setEmergencyModalOpen(false)
                }}
              >
                <MapPin className="h-4 w-4 mr-3" />
                Open Weather Map
              </Button>
            </div>
          </div>
        </div>
      )}

      {alertsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-medium text-white flex items-center">
                <Bell className="h-5 w-5 text-yellow-400 mr-2" />
                Weather Alerts & Warnings
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAlertsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto scrollbar-hidden">
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-white">{alert.title}</span>
                        <Badge variant={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                      </div>
                      <p className="text-slate-300 mb-2">{alert.description}</p>
                      <div className="text-sm text-slate-400">
                        <p>Areas: {alert.areas.join(", ")}</p>
                        <p>Valid until: {formatDate(alert.validUntil)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No active weather alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {forecastModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-medium text-white flex items-center">
                <CloudRain className="h-5 w-5 text-blue-400 mr-2" />
                Extended Weather Forecast
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setForecastModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto scrollbar-hidden">
              {forecast.length > 0 ? (
                <div className="space-y-4">
                  {forecast.map((day, index) => (
                    <div key={index} className="glass-card rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Sun className="h-6 w-6 text-yellow-400" />
                          <div>
                            <h3 className="font-medium text-white">
                              {index === 0
                                ? "Today"
                                : new Date(day.date).toLocaleDateString("en", {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                  })}
                            </h3>
                            <p className="text-sm text-slate-400">{day.description}</p>
                          </div>
                        </div>
                        <span className="text-2xl font-light text-white">
                          {Math.round(convertTemperature(day.temperature.max))}
                          {getTemperatureUnit()}/{Math.round(convertTemperature(day.temperature.min))}
                          {getTemperatureUnit()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Humidity</p>
                          <p className="text-white">{day.humidity}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Wind</p>
                          <p className="text-white">
                            {Math.round(convertWindSpeed(day.windSpeed))} {getWindSpeedUnit()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Rainfall</p>
                          <p className="text-white">{day.rainfall}mm</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CloudRain className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No forecast data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {settingsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-medium text-white flex items-center">
                <Settings className="h-5 w-5 text-slate-400 mr-2" />
                Settings
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Temperature Unit</span>
                <select
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  value={temperatureUnit}
                  onChange={(e) => setTemperatureUnit(e.target.value as "celsius" | "fahrenheit")}
                >
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Wind Speed Unit</span>
                <select
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  value={windSpeedUnit}
                  onChange={(e) => setWindSpeedUnit(e.target.value as "kmh" | "mph" | "ms")}
                >
                  <option value="kmh">km/h</option>
                  <option value="mph">mph</option>
                  <option value="ms">m/s</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Location Services</span>
                <button
                  onClick={() => {
                    const newState = !locationServicesEnabled
                    setLocationServicesEnabled(newState)

                    if (newState) {
                      addNotification("Location Services Enabled", "Fetching weather data for your location...", "info")
                      setLoading(true)
                    } else {
                      addNotification(
                        "Location Services Disabled",
                        "Weather data will no longer use your location",
                        "info",
                      )
                      // Clear location-based data
                      setCurrentWeather(null)
                      setLocation(null)
                      setCurrentLocationName("")
                      setAlerts([])
                      setRiskPredictions([])
                      setForecast([])
                    }
                  }}
                  disabled={isLocationLoading}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    locationServicesEnabled ? "bg-green-600 text-white" : "bg-slate-600 text-slate-300"
                  } ${isLocationLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isLocationLoading ? "Loading..." : locationServicesEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white">Notifications</span>
                <button
                  onClick={() => {
                    setNotificationsEnabled(!notificationsEnabled)
                    if (!notificationsEnabled) {
                      addNotification(
                        "Notifications Enabled",
                        "You'll now receive live weather alerts and news updates",
                        "info",
                      )
                    } else {
                      addNotification(
                        "Notifications Disabled",
                        "Weather alerts and news updates are now turned off",
                        "info",
                      )
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    notificationsEnabled ? "bg-green-600 text-white" : "bg-slate-600 text-slate-300"
                  }`}
                >
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white">Push Notifications</span>
                  <p className="text-slate-400 text-xs">Receive alerts when app is closed</p>
                </div>
                <button
                  onClick={async () => {
                    if (!pushNotificationsEnabled) {
                      const success = await requestPushNotificationPermission()
                      if (success) {
                        setPushNotificationsEnabled(true)
                      }
                    } else {
                      setPushNotificationsEnabled(false)
                      setPushSubscription(null)
                      addNotification(
                        "Push Notifications Disabled",
                        "You will no longer receive alerts when the app is closed",
                        "info",
                      )
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    pushNotificationsEnabled ? "bg-green-600 text-white" : "bg-slate-600 text-slate-300"
                  }`}
                >
                  {pushNotificationsEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
