"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  AlertTriangle,
  Cloud,
  Droplets,
  Wind,
  Thermometer,
  Gauge,
  Zap,
  Mountain,
  Waves,
  Sun,
  CloudRain,
  Languages,
} from "lucide-react"

interface WeatherAlert {
  id: string
  type: "thunderstorm" | "flood" | "typhoon" | "heat" | "landslide"
  severity: "low" | "moderate" | "high" | "extreme"
  title: string
  description: string
  areas: string[]
  validUntil: Date
  issued: Date
}

interface WeatherForecast {
  date: Date
  temperature: { min: number; max: number }
  humidity: number
  windSpeed: number
  rainfall: number
  condition: string
  icon: string
}

interface RiskPrediction {
  category: string
  risk: number
  trend: "increasing" | "decreasing" | "stable"
  description: string
}

export default function AlertsPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"en" | "tl">("en")
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [forecast, setForecast] = useState<WeatherForecast[]>([])
  const [riskPredictions, setRiskPredictions] = useState<RiskPrediction[]>([])
  const [selectedTab, setSelectedTab] = useState<"alerts" | "forecast" | "predictions">("alerts")

  const translations = {
    en: {
      title: "Weather Alerts & Predictions",
      subtitle: "AI-powered weather monitoring",
      currentAlerts: "Current Alerts",
      forecast: "7-Day Forecast",
      predictions: "AI Predictions",
      noAlerts: "No active alerts",
      allClear: "All clear for now",
      validUntil: "Valid until",
      issuedAt: "Issued at",
      affectedAreas: "Affected Areas",
      riskLevel: "Risk Level",
      temperature: "Temperature",
      humidity: "Humidity",
      windSpeed: "Wind Speed",
      rainfall: "Rainfall",
      visibility: "Visibility",
      low: "Low",
      moderate: "Moderate",
      high: "High",
      extreme: "Extreme",
      increasing: "Increasing",
      decreasing: "Decreasing",
      stable: "Stable",
      thunderstorm: "Thunderstorm",
      flood: "Flood",
      typhoon: "Typhoon",
      heat: "Heat Wave",
      landslide: "Landslide",
      today: "Today",
      tomorrow: "Tomorrow",
      advisory: "Weather Advisory",
      stayIndoors: "Stay indoors during heavy rainfall",
      avoidFloodAreas: "Avoid flood-prone areas",
      prepareEmergencyKit: "Prepare emergency supplies",
    },
    tl: {
      title: "Mga Babala at Hula sa Panahon",
      subtitle: "AI-powered na pagsubaybay sa panahon",
      currentAlerts: "Kasalukuyang mga Babala",
      forecast: "7-Araw na Hula",
      predictions: "AI na mga Hula",
      noAlerts: "Walang aktibong babala",
      allClear: "Ligtas sa ngayon",
      validUntil: "Hanggang sa",
      issuedAt: "Inilabas noong",
      affectedAreas: "Mga Apektadong Lugar",
      riskLevel: "Antas ng Panganib",
      temperature: "Temperatura",
      humidity: "Halumigmig",
      windSpeed: "Bilis ng Hangin",
      rainfall: "Ulan",
      visibility: "Nakikita",
      low: "Mababa",
      moderate: "Katamtaman",
      high: "Mataas",
      extreme: "Matindi",
      increasing: "Tumataas",
      decreasing: "Bumababa",
      stable: "Matatag",
      thunderstorm: "Kidlat at Kulog",
      flood: "Baha",
      typhoon: "Bagyo",
      heat: "Init",
      landslide: "Landslide",
      today: "Ngayon",
      tomorrow: "Bukas",
      advisory: "Payo sa Panahon",
      stayIndoors: "Manatili sa loob habang malakas ang ulan",
      avoidFloodAreas: "Iwasan ang mga lugar na baha",
      prepareEmergencyKit: "Maghanda ng emergency supplies",
    },
  }

  const t = translations[language]

  // Sample data
  useEffect(() => {
    const sampleAlerts: WeatherAlert[] = [
      {
        id: "1",
        type: "thunderstorm",
        severity: "moderate",
        title: "Thunderstorm Warning",
        description: "Moderate to heavy thunderstorms expected with possible flooding in low-lying areas.",
        areas: ["Metro Manila", "Rizal", "Laguna"],
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000),
        issued: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: "2",
        type: "flood",
        severity: "high",
        title: "Flood Advisory",
        description: "High risk of flooding due to continuous rainfall and high tide.",
        areas: ["Marikina", "Pasig", "Mandaluyong"],
        validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000),
        issued: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ]

    const sampleForecast: WeatherForecast[] = [
      {
        date: new Date(),
        temperature: { min: 24, max: 32 },
        humidity: 75,
        windSpeed: 15,
        rainfall: 12,
        condition: "Thunderstorms",
        icon: "⛈️",
      },
      {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        temperature: { min: 25, max: 33 },
        humidity: 70,
        windSpeed: 12,
        rainfall: 8,
        condition: "Partly Cloudy",
        icon: "⛅",
      },
      {
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        temperature: { min: 26, max: 34 },
        humidity: 65,
        windSpeed: 10,
        rainfall: 2,
        condition: "Sunny",
        icon: "☀️",
      },
      {
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        temperature: { min: 25, max: 31 },
        humidity: 80,
        windSpeed: 18,
        rainfall: 15,
        condition: "Heavy Rain",
        icon: "🌧️",
      },
      {
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        temperature: { min: 23, max: 29 },
        humidity: 85,
        windSpeed: 22,
        rainfall: 25,
        condition: "Storms",
        icon: "⛈️",
      },
      {
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        temperature: { min: 24, max: 30 },
        humidity: 78,
        windSpeed: 16,
        rainfall: 10,
        condition: "Cloudy",
        icon: "☁️",
      },
      {
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        temperature: { min: 25, max: 32 },
        humidity: 72,
        windSpeed: 14,
        rainfall: 5,
        condition: "Partly Sunny",
        icon: "🌤️",
      },
    ]

    const samplePredictions: RiskPrediction[] = [
      {
        category: "Rainfall Risk",
        risk: 75,
        trend: "increasing",
        description: "Heavy rainfall expected in the next 24-48 hours",
      },
      {
        category: "Flood Risk",
        risk: 60,
        trend: "stable",
        description: "Moderate flood risk in low-lying areas",
      },
      {
        category: "Wind Risk",
        risk: 40,
        trend: "decreasing",
        description: "Wind speeds expected to decrease",
      },
      {
        category: "Landslide Risk",
        risk: 30,
        trend: "increasing",
        description: "Increased risk due to soil saturation",
      },
    ]

    setAlerts(sampleAlerts)
    setForecast(sampleForecast)
    setRiskPredictions(samplePredictions)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "extreme":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "low":
        return t.low
      case "moderate":
        return t.moderate
      case "high":
        return t.high
      case "extreme":
        return t.extreme
      default:
        return t.moderate
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "thunderstorm":
        return Zap
      case "flood":
        return Waves
      case "typhoon":
        return Wind
      case "heat":
        return Sun
      case "landslide":
        return Mountain
      default:
        return AlertTriangle
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "text-red-600"
      case "decreasing":
        return "text-green-600"
      case "stable":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case "increasing":
        return t.increasing
      case "decreasing":
        return t.decreasing
      case "stable":
        return t.stable
      default:
        return t.stable
    }
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return t.today
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t.tomorrow
    } else {
      return date.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })
    }
  }

  const renderAlerts = () => (
    <div className="space-y-4">
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">{t.noAlerts}</h3>
            <p className="text-muted-foreground">{t.allClear}</p>
          </CardContent>
        </Card>
      ) : (
        alerts.map((alert) => {
          const IconComponent = getAlertIcon(alert.type)
          return (
            <Card key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {alert.title}
                  </CardTitle>
                  <Badge variant="secondary" className={getSeverityColor(alert.severity)}>
                    {getSeverityLabel(alert.severity)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{alert.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{t.affectedAreas}:</span>
                    <span>{alert.areas.join(", ")}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {t.issuedAt}: {alert.issued.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>
                      {t.validUntil}:{" "}
                      {alert.validUntil.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">{t.advisory}</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• {t.stayIndoors}</li>
                    <li>• {t.avoidFloodAreas}</li>
                    <li>• {t.prepareEmergencyKit}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )

  const renderForecast = () => (
    <div className="space-y-4">
      {forecast.map((day, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{day.icon}</span>
                <div>
                  <p className="font-semibold">{formatDate(day.date)}</p>
                  <p className="text-sm text-muted-foreground">{day.condition}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{day.temperature.max}°</p>
                <p className="text-sm text-muted-foreground">{day.temperature.min}°</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Droplets className="h-3 w-3 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-sm font-medium">{day.humidity}%</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Wind className="h-3 w-3 text-gray-500" />
                </div>
                <p className="text-xs text-muted-foreground">Wind</p>
                <p className="text-sm font-medium">{day.windSpeed} km/h</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CloudRain className="h-3 w-3 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground">Rain</p>
                <p className="text-sm font-medium">{day.rainfall} mm</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Thermometer className="h-3 w-3 text-red-500" />
                </div>
                <p className="text-xs text-muted-foreground">Feels like</p>
                <p className="text-sm font-medium">{day.temperature.max + 2}°</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderPredictions = () => (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            AI Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {riskPredictions.map((prediction, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{prediction.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{prediction.risk}%</span>
                  <span className={`text-xs ${getTrendColor(prediction.trend)}`}>
                    {getTrendLabel(prediction.trend)}
                  </span>
                </div>
              </div>
              <Progress value={prediction.risk} className="h-2" />
              <p className="text-xs text-muted-foreground">{prediction.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">24-Hour Outlook</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }, (_, i) => {
              const hour = new Date()
              hour.setHours(hour.getHours() + i * 4)
              const rainfall = Math.max(0, 15 - i * 2 + Math.random() * 5)

              return (
                <div key={i} className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {hour.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className="h-16 bg-muted rounded flex items-end justify-center mb-1">
                    <div
                      className="w-4 bg-blue-500 rounded-t"
                      style={{ height: `${Math.max(4, (rainfall / 20) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs font-medium">{Math.round(rainfall)}mm</p>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">Rainfall prediction for next 24 hours</p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-accent text-accent-foreground p-4 lg:p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-accent-foreground hover:bg-accent-foreground/10 transition-all duration-200 ease-out"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold font-sans">{t.title}</h1>
              <p className="text-sm opacity-90 font-body">{t.subtitle}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "tl" : "en")}
              className="text-accent-foreground hover:bg-accent-foreground/10 transition-all duration-200 ease-out"
            >
              <Languages className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md lg:max-w-4xl">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-3">
            <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg">
              <Button
                variant={selectedTab === "alerts" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTab("alerts")}
                className="flex-1 h-8 transition-all duration-200 ease-out"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {t.currentAlerts}
              </Button>
              <Button
                variant={selectedTab === "forecast" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTab("forecast")}
                className="flex-1 h-8 transition-all duration-200 ease-out"
              >
                <Cloud className="h-3 w-3 mr-1" />
                {t.forecast}
              </Button>
              <Button
                variant={selectedTab === "predictions" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTab("predictions")}
                className="flex-1 h-8 transition-all duration-200 ease-out"
              >
                <Gauge className="h-3 w-3 mr-1" />
                {t.predictions}
              </Button>
            </div>

            <div className="lg:grid lg:grid-cols-2 lg:gap-4">
              {selectedTab === "alerts" && <div className="lg:col-span-2">{renderAlerts()}</div>}
              {selectedTab === "forecast" && <div className="lg:col-span-2">{renderForecast()}</div>}
              {selectedTab === "predictions" && <div className="lg:col-span-2">{renderPredictions()}</div>}
            </div>
          </div>

          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <Card className="transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg font-sans">Weather Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body">Active Alerts</span>
                  <Badge
                    variant="secondary"
                    className={alerts.length > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                  >
                    {alerts.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body">High Risk Days</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {forecast.filter((f) => f.rainfall > 15).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body">Max Rainfall</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {Math.max(...forecast.map((f) => f.rainfall))}mm
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
