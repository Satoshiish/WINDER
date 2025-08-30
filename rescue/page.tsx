"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Shield, Phone, CheckCircle, XCircle, Loader2, Users, Zap } from "lucide-react"

interface LocationData {
  latitude: number
  longitude: number
  address: string
  accuracy: number
}

type RescueStatus = "idle" | "locating" | "ready" | "sending" | "success" | "error"

export default function RescuePage() {
  const router = useRouter()
  const [status, setStatus] = useState<RescueStatus>("idle")
  const [location, setLocation] = useState<LocationData | null>(null)
  const [emergencyType, setEmergencyType] = useState<string>("")
  const [additionalInfo, setAdditionalInfo] = useState<string>("")
  const [contactNumber, setContactNumber] = useState<string>("")
  const [peopleCount, setPeopleCount] = useState<string>("1")
  const [language, setLanguage] = useState<"en" | "tl">("en")

  const translations = {
    en: {
      title: "Emergency Rescue Request",
      subtitle: "Help is on the way",
      detectingLocation: "Detecting your location...",
      locationFound: "Location detected",
      locationError: "Unable to detect location",
      emergencyType: "Type of Emergency",
      additionalInfo: "Additional Information",
      contactNumber: "Contact Number",
      peopleCount: "Number of People",
      sendRescue: "SEND RESCUE ALERT",
      sending: "Sending rescue request...",
      success: "Rescue request sent successfully!",
      error: "Failed to send rescue request",
      tryAgain: "Try Again",
      backHome: "Back to Home",
      emergencyContacts: "Emergency Contacts",
      currentLocation: "Current Location",
      accuracy: "Accuracy",
      optional: "Optional",
      required: "Required",
    },
    tl: {
      title: "Kahilingan para sa Emergency Rescue",
      subtitle: "Paparating na ang tulong",
      detectingLocation: "Hinahanap ang inyong lokasyon...",
      locationFound: "Nahanap ang lokasyon",
      locationError: "Hindi mahanap ang lokasyon",
      emergencyType: "Uri ng Emergency",
      additionalInfo: "Karagdagang Impormasyon",
      contactNumber: "Numero ng Telepono",
      peopleCount: "Bilang ng Tao",
      sendRescue: "MAGPADALA NG RESCUE ALERT",
      sending: "Nagpapadala ng rescue request...",
      success: "Matagumpay na naipadala ang rescue request!",
      error: "Hindi naipadala ang rescue request",
      tryAgain: "Subukan Muli",
      backHome: "Balik sa Home",
      emergencyContacts: "Emergency Contacts",
      currentLocation: "Kasalukuyang Lokasyon",
      accuracy: "Katumpakan",
      optional: "Opsyonal",
      required: "Kailangan",
    },
  }

  const t = translations[language]

  const emergencyTypes = [
    { value: "flood", label: "Flood / Baha", icon: "🌊" },
    { value: "fire", label: "Fire / Sunog", icon: "🔥" },
    { value: "medical", label: "Medical Emergency", icon: "🏥" },
    { value: "accident", label: "Accident / Aksidente", icon: "🚗" },
    { value: "landslide", label: "Landslide", icon: "⛰️" },
    { value: "other", label: "Other / Iba pa", icon: "⚠️" },
  ]

  const emergencyContacts = [
    { name: "NDRRMC", number: "911", type: "Primary" },
    { name: "Philippine Red Cross", number: "143", type: "Medical" },
    { name: "Fire Department", number: "116", type: "Fire" },
    { name: "Police", number: "117", type: "Security" },
  ]

  // Auto-detect location on component mount
  useEffect(() => {
    detectLocation()
  }, [])

  const detectLocation = async () => {
    setStatus("locating")

    if (!navigator.geolocation) {
      setStatus("error")
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 30000, // Increased timeout for GPS
      maximumAge: 0, // Force fresh GPS reading
    }

    let attempts = 0
    const maxAttempts = 3

    const tryGetLocation = () => {
      attempts++
      console.log(`[v0] Attempting location detection (attempt ${attempts})`)

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          console.log(`[v0] Location detected with accuracy: ${accuracy.toFixed(1)}m`)

          // Reject very inaccurate locations and retry
          if (accuracy > 1000 && attempts < maxAttempts) {
            console.log(`[v0] Poor accuracy (${accuracy.toFixed(1)}m), retrying...`)
            setTimeout(tryGetLocation, 2000)
            return
          }

          try {
            const address = await reverseGeocode(latitude, longitude)
            console.log(`[v0] Reverse geocoded location: ${address}`)

            setLocation({
              latitude,
              longitude,
              address,
              accuracy: Math.round(accuracy),
            })
            setStatus("ready")
          } catch (error) {
            console.error("Geocoding error:", error)
            setLocation({
              latitude,
              longitude,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              accuracy: Math.round(accuracy),
            })
            setStatus("ready")
          }
        },
        (error) => {
          console.error("Location error:", error)
          if (attempts < maxAttempts) {
            console.log(`[v0] Location failed, retrying (${attempts}/${maxAttempts})...`)
            setTimeout(tryGetLocation, 2000)
          } else {
            setStatus("error")
          }
        },
        options,
      )
    }

    tryGetLocation()
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "Philippine Weather Hub/1.0",
            Accept: "application/json",
          },
        },
      )

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format")
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data && data.display_name) {
        // Extract meaningful parts of the address
        const address = data.address || {}
        const parts = [
          address.neighbourhood || address.suburb || address.village,
          address.city || address.town || address.municipality,
          address.state || address.province,
        ].filter(Boolean)

        return parts.length > 0 ? parts.join(", ") : data.display_name
      }

      throw new Error("No address found")
    } catch (error) {
      console.error("Reverse geocoding failed:", error)
      // Fallback to coordinates
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  const sendRescueRequest = async () => {
    if (!location || !emergencyType) return

    setStatus("sending")

    try {
      // Simulate API call to emergency services
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In real app, send to actual emergency services API
      const rescueData = {
        location,
        emergencyType,
        additionalInfo,
        contactNumber,
        peopleCount: Number.parseInt(peopleCount),
        timestamp: new Date().toISOString(),
      }

      console.log("Rescue request sent:", rescueData)
      setStatus("success")
    } catch (error) {
      console.error("Failed to send rescue request:", error)
      setStatus("error")
    }
  }

  const renderLocationStatus = () => {
    switch (status) {
      case "locating":
        return (
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">{t.detectingLocation}</p>
                  <p className="text-sm text-muted-foreground">Please allow location access</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "ready":
        return location ? (
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-700">{t.locationFound}</p>
                  <p className="text-sm text-muted-foreground mt-1">{location.address}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>
                      {t.accuracy}: {location.accuracy}m
                    </span>
                    <span>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null

      case "error":
        return (
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">{t.locationError}</p>
                  <p className="text-sm text-muted-foreground">Please enable location services</p>
                </div>
                <Button size="sm" variant="outline" onClick={detectLocation}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const renderSuccessScreen = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">{t.success}</h2>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Request ID:</span>
              <span className="font-mono">RQ-{Date.now().toString().slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emergency Type:</span>
              <span className="capitalize">{emergencyType}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button onClick={() => router.push("/")} className="w-full">
          {t.backHome}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          {emergencyContacts.slice(0, 2).map((contact, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-transparent"
              onClick={() => window.open(`tel:${contact.number}`)}
            >
              <Phone className="h-4 w-4" />
              {contact.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-md pt-8">{renderSuccessScreen()}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-destructive text-destructive-foreground p-4 lg:p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-destructive-foreground hover:bg-destructive-foreground/10 transition-all duration-200 ease-out"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold font-sans">{t.title}</h1>
              <p className="text-sm opacity-90 font-body">Emergency Response System</p>
            </div>
            <Shield className="h-8 w-8" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md lg:max-w-4xl">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Location Status */}
            {renderLocationStatus()}

            {/* Emergency Form */}
            {status === "ready" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium font-sans">{t.emergencyType} *</Label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    {emergencyTypes.map((type) => (
                      <Button
                        key={type.value}
                        variant={emergencyType === type.value ? "default" : "outline"}
                        className="h-auto p-3 flex-col gap-2 transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-primary/20"
                        onClick={() => setEmergencyType(type.value)}
                      >
                        <span className="text-lg">{type.icon}</span>
                        <span className="text-xs text-center leading-tight font-body">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact" className="text-base font-medium font-sans">
                    {t.contactNumber} *
                  </Label>
                  <Input
                    id="contact"
                    type="tel"
                    placeholder="+63 9XX XXX XXXX"
                    value={contactNumber}
                    onChange={(e) => {
                      // Only allow numbers, spaces, hyphens, and plus signs
                      const value = e.target.value.replace(/[^0-9\s\-+]/g, "")
                      setContactNumber(value)
                    }}
                    className="mt-2 transition-all duration-200 ease-out focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* People Count */}
                <div>
                  <Label htmlFor="people" className="text-base font-medium font-sans">
                    {t.peopleCount}
                  </Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPeopleCount(Math.max(1, Number.parseInt(peopleCount) - 1).toString())}
                    >
                      -
                    </Button>
                    <Input
                      id="people"
                      type="number"
                      min="1"
                      max="50"
                      value={peopleCount}
                      onChange={(e) => setPeopleCount(e.target.value)}
                      className="text-center w-20"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPeopleCount((Number.parseInt(peopleCount) + 1).toString())}
                    >
                      +
                    </Button>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>people</span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <Label htmlFor="info" className="text-base font-medium font-sans">
                    {t.additionalInfo} <span className="text-muted-foreground">({t.optional})</span>
                  </Label>
                  <Textarea
                    id="info"
                    placeholder="Describe your situation, injuries, or specific help needed..."
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full h-16 text-xl font-bold bg-destructive hover:bg-destructive/90 transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02]"
                  onClick={sendRescueRequest}
                  disabled={!emergencyType || !contactNumber || status === "sending"}
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    <>
                      <Zap className="mr-3 h-6 w-6" />
                      {t.sendRescue}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 mt-6 lg:mt-0">
            {status === "ready" && (
              <Card className="transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 font-sans">
                    <Phone className="h-5 w-5" />
                    {t.emergencyContacts}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                    {emergencyContacts.map((contact, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="flex-col gap-1 h-auto p-3 bg-transparent transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-primary/20"
                        onClick={() => window.open(`tel:${contact.number}`)}
                      >
                        <span className="font-semibold font-sans">{contact.number}</span>
                        <span className="text-xs text-muted-foreground font-body">{contact.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
