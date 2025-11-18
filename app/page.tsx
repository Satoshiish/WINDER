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
  WeatherIndicesSkeleton,
} from "@/components/skeletons/weather-skeleton"
import { RiskPredictionCard } from "@/components/risk-prediction-card"

import { useRouter } from "next/navigation" // Import useRouter
import { useAuth } from "@/hooks/use-auth" // Replace Clerk with custom auth
// import {useUser} from "@clerk/nextjs" // Import useUser
import { useLocationSharing } from "@/contexts/location-sharing-context"
import { saveEmergencyReport } from "@/services/emergencyService" // Updated import to use services directory
import { EvacuationMap } from "@/components/evacuation-map"
import { MapView } from "@/components/map-view"
import { EmergencyKitTracker } from "@/components/emergency-kit-tracker"
import { SMSSettings } from "@/components/sms-settings"
import { sendSMS } from "@/services/smsService"
import { saveWeatherCache, loadWeatherCache, isNearby } from "@/services/weatherCache"
import { LanguageSelector } from "@/components/language-selector"
import { useLanguage } from "@/contexts/language-context"
import { searchLocations, OLONGAPO_LOCATIONS } from "@/services/locationSearch"

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

// Enhanced Philippine location database
const philippineLocations: Record<string, { lat: number; lon: number; region: string; type: string }> = {
  // NCR - National Capital Region
  "Metro Manila": { lat: 14.5995, lon: 120.9842, region: "NCR", type: "region" },
  "Manila": { lat: 14.5995, lon: 120.9842, region: "NCR", type: "city" },
  "Quezon City": { lat: 14.676, lon: 121.0437, region: "NCR", type: "city" },
  "Makati": { lat: 14.5547, lon: 121.0244, region: "NCR", type: "city" },
  "Taguig": { lat: 14.5176, lon: 121.0509, region: "NCR", type: "city" },
  "Pasig": { lat: 14.5764, lon: 121.0851, region: "NCR", type: "city" },
  "Mandaluyong": { lat: 14.5836, lon: 121.0409, region: "NCR", type: "city" },
  "Pasay": { lat: 14.5378, lon: 120.9815, region: "NCR", type: "city" },
  "Parañaque": { lat: 14.4793, lon: 121.0198, region: "NCR", type: "city" },
  "Las Piñas": { lat: 14.4499, lon: 120.993, region: "NCR", type: "city" },
  "Muntinlupa": { lat: 14.3833, lon: 121.05, region: "NCR", type: "city" },
  "Marikina": { lat: 14.6507, lon: 121.1029, region: "NCR", type: "city" },
  "Caloocan": { lat: 14.7566, lon: 121.0453, region: "NCR", type: "city" },
  "Valenzuela": { lat: 14.706, lon: 120.983, region: "NCR", type: "city" },
  "Malabon": { lat: 14.6686, lon: 120.9563, region: "NCR", type: "city" },
  "Navotas": { lat: 14.6667, lon: 120.95, region: "NCR", type: "city" },
  "San Juan": { lat: 14.6042, lon: 121.03, region: "NCR", type: "city" },

  // Region I - Ilocos Region
  "Ilocos Norte": { lat: 18.1647, lon: 120.711, region: "Ilocos Region", type: "province" },
  "Laoag": { lat: 18.1978, lon: 120.5936, region: "Ilocos Region", type: "city" },
  "Ilocos Sur": { lat: 17.5707, lon: 120.3875, region: "Ilocos Region", type: "province" },
  "Vigan": { lat: 17.5747, lon: 120.3869, region: "Ilocos Region", type: "city" },
  "La Union": { lat: 16.6159, lon: 120.3199, region: "Ilocos Region", type: "province" },
  "San Fernando La Union": { lat: 16.6159, lon: 120.3199, region: "Ilocos Region", type: "city" },
  "Pangasinan": { lat: 15.8949, lon: 120.2863, region: "Ilocos Region", type: "province" },
  "Dagupan": { lat: 16.0439, lon: 120.3325, region: "Ilocos Region", type: "city" },

  // Region II - Cagayan Valley
  "Cagayan": { lat: 18.2489, lon: 121.878, region: "Cagayan Valley", type: "province" },
  "Tuguegarao": { lat: 17.6131, lon: 121.7269, region: "Cagayan Valley", type: "city" },
  "Isabela": { lat: 16.9754, lon: 121.8106, region: "Cagayan Valley", type: "province" },
  "Ilagan": { lat: 17.1486, lon: 121.8894, region: "Cagayan Valley", type: "city" },
  "Nueva Vizcaya": { lat: 16.3333, lon: 121.0333, region: "Cagayan Valley", type: "province" },
  "Bayombong": { lat: 16.4833, lon: 121.15, region: "Cagayan Valley", type: "city" },
  "Quirino": { lat: 16.2833, lon: 121.5833, region: "Cagayan Valley", type: "province" },
  "Cabarroguis": { lat: 16.5833, lon: 121.5, region: "Cagayan Valley", type: "city" },

  // Region III - Central Luzon
  "Bulacan": { lat: 14.8535, lon: 120.816, region: "Central Luzon", type: "province" },
  "Malolos": { lat: 14.8433, lon: 120.8117, region: "Central Luzon", type: "city" },
  "Pampanga": { lat: 15.0794, lon: 120.6194, region: "Central Luzon", type: "province" },
  "Angeles": { lat: 15.1449, lon: 120.5886, region: "Central Luzon", type: "city" },
  "Tarlac": { lat: 15.4751, lon: 120.5969, region: "Central Luzon", type: "province" },
  "Tarlac City": { lat: 15.4869, lon: 120.5986, region: "Central Luzon", type: "city" },
  "Nueva Ecija": { lat: 15.5784, lon: 120.9726, region: "Central Luzon", type: "province" },
  "Cabanatuan": { lat: 15.4833, lon: 120.9667, region: "Central Luzon", type: "city" },
  "Zambales": { lat: 15.3333, lon: 119.95, region: "Central Luzon", type: "province" },
  "Olongapo City": { lat: 14.8293, lon: 120.2824, region: "Central Luzon", type: "city" },
  "Bataan": { lat: 14.676, lon: 120.54, region: "Central Luzon", type: "province" },
  "Balanga": { lat: 14.676, lon: 120.54, region: "Central Luzon", type: "city" },

  // Region IV-A - CALABARZON
  "Cavite": { lat: 14.4791, lon: 120.8969, region: "CALABARZON", type: "province" },
  "Imus": { lat: 14.4297, lon: 120.9367, region: "CALABARZON", type: "city" },
  "Dasmariñas": { lat: 14.3294, lon: 120.9367, region: "CALABARZON", type: "city" },
  "Laguna": { lat: 14.17, lon: 121.3331, region: "CALABARZON", type: "province" },
  "Santa Rosa": { lat: 14.3167, lon: 121.1167, region: "CALABARZON", type: "city" },
  "Calamba": { lat: 14.2117, lon: 121.1653, region: "CALABARZON", type: "city" },
  "Batangas": { lat: 13.7565, lon: 121.0583, region: "CALABARZON", type: "province" },
  "Batangas City": { lat: 13.7565, lon: 121.0583, region: "CALABARZON", type: "city" },
  "Rizal": { lat: 14.6034, lon: 121.308, region: "CALABARZON", type: "province" },
  "Antipolo": { lat: 14.6258, lon: 121.1226, region: "CALABARZON", type: "city" },
  "Quezon": { lat: 13.9418, lon: 121.6236, region: "CALABARZON", type: "province" },
  "Lucena": { lat: 13.9418, lon: 121.6236, region: "CALABARZON", type: "city" },

  // Region IV-B - MIMAROPA
  "Mindoro Occidental": { lat: 13.0, lon: 120.9167, region: "MIMAROPA", type: "province" },
  "Mamburao": { lat: 13.2233, lon: 120.5961, region: "MIMAROPA", type: "city" },
  "Mindoro Oriental": { lat: 13.0833, lon: 121.0833, region: "MIMAROPA", type: "province" },
  "Calapan": { lat: 13.4103, lon: 121.18, region: "MIMAROPA", type: "city" },
  "Marinduque": { lat: 13.4167, lon: 121.95, region: "MIMAROPA", type: "province" },
  "Boac": { lat: 13.45, lon: 121.8333, region: "MIMAROPA", type: "city" },
  "Romblon": { lat: 12.5833, lon: 122.2667, region: "MIMAROPA", type: "province" },
  "Romblon": { lat: 12.5833, lon: 122.2667, region: "MIMAROPA", type: "city" },
  "Palawan": { lat: 9.8349, lon: 118.7384, region: "MIMAROPA", type: "province" },
  "Puerto Princesa": { lat: 9.7392, lon: 118.7353, region: "MIMAROPA", type: "city" },

  // Region V - Bicol Region
  "Albay": { lat: 13.1667, lon: 123.7333, region: "Bicol Region", type: "province" },
  "Legazpi": { lat: 13.1333, lon: 123.7333, region: "Bicol Region", type: "city" },
  "Camarines Sur": { lat: 13.6226, lon: 123.1948, region: "Bicol Region", type: "province" },
  "Naga": { lat: 13.6218, lon: 123.1948, region: "Bicol Region", type: "city" },
  "Camarines Norte": { lat: 14.1667, lon: 122.75, region: "Bicol Region", type: "province" },
  "Daet": { lat: 14.1167, lon: 122.95, region: "Bicol Region", type: "city" },
  "Sorsogon": { lat: 12.9667, lon: 124.0167, region: "Bicol Region", type: "province" },
  "Sorsogon City": { lat: 12.9714, lon: 124.0064, region: "Bicol Region", type: "city" },
  "Masbate": { lat: 12.1667, lon: 123.5833, region: "Bicol Region", type: "province" },
  "Masbate City": { lat: 12.3667, lon: 123.6167, region: "Bicol Region", type: "city" },
  "Catanduanes": { lat: 13.8333, lon: 124.25, region: "Bicol Region", type: "province" },
  "Virac": { lat: 13.5833, lon: 124.2333, region: "Bicol Region", type: "city" },

  // Region VI - Western Visayas
  "Iloilo": { lat: 10.7202, lon: 122.5621, region: "Western Visayas", type: "province" },
  "Iloilo City": { lat: 10.7202, lon: 122.5621, region: "Western Visayas", type: "city" },
  "Negros Occidental": { lat: 10.6407, lon: 122.9689, region: "Western Visayas", type: "province" },
  "Bacolod": { lat: 10.6765, lon: 122.9509, region: "Western Visayas", type: "city" },
  "Capiz": { lat: 11.5833, lon: 122.75, region: "Western Visayas", type: "province" },
  "Roxas": { lat: 11.5853, lon: 122.7511, region: "Western Visayas", type: "city" },
  "Aklan": { lat: 11.6667, lon: 122.3333, region: "Western Visayas", type: "province" },
  "Kalibo": { lat: 11.7167, lon: 122.3667, region: "Western Visayas", type: "city" },
  "Antique": { lat: 11.1667, lon: 122.0833, region: "Western Visayas", type: "province" },
  "San Jose": { lat: 10.75, lon: 121.95, region: "Western Visayas", type: "city" },
  "Guimaras": { lat: 10.5667, lon: 122.5833, region: "Western Visayas", type: "province" },
  "Jordan": { lat: 10.6, lon: 122.6, region: "Western Visayas", type: "city" },

  // Region VII - Central Visayas
  "Cebu": { lat: 10.3157, lon: 123.8854, region: "Central Visayas", type: "province" },
  "Cebu City": { lat: 10.3157, lon: 123.8854, region: "Central Visayas", type: "city" },
  "Bohol": { lat: 9.8499, lon: 124.1435, region: "Central Visayas", type: "province" },
  "Tagbilaran": { lat: 9.6475, lon: 123.8556, region: "Central Visayas", type: "city" },
  "Negros Oriental": { lat: 9.3344, lon: 123.3018, region: "Central Visayas", type: "province" },
  "Dumaguete": { lat: 9.3103, lon: 123.3081, region: "Central Visayas", type: "city" },
  "Siquijor": { lat: 9.2, lon: 123.5167, region: "Central Visayas", type: "province" },
  "Siquijor": { lat: 9.2, lon: 123.5167, region: "Central Visayas", type: "city" },

  // Region VIII - Eastern Visayas
  "Leyte": { lat: 11.25, lon: 124.75, region: "Eastern Visayas", type: "province" },
  "Tacloban": { lat: 11.2433, lon: 124.9772, region: "Eastern Visayas", type: "city" },
  "Samar": { lat: 12.0, lon: 125.0, region: "Eastern Visayas", type: "province" },
  "Catbalogan": { lat: 11.7753, lon: 124.8861, region: "Eastern Visayas", type: "city" },
  "Eastern Samar": { lat: 11.5, lon: 125.5, region: "Eastern Visayas", type: "province" },
  "Borongan": { lat: 11.6077, lon: 125.4312, region: "Eastern Visayas", type: "city" },
  "Northern Samar": { lat: 12.3333, lon: 124.6667, region: "Eastern Visayas", type: "province" },
  "Catarman": { lat: 12.45, lon: 124.65, region: "Eastern Visayas", type: "city" },
  "Southern Leyte": { lat: 10.3333, lon: 125.0833, region: "Eastern Visayas", type: "province" },
  "Maasin": { lat: 10.1333, lon: 124.8333, region: "Eastern Visayas", type: "city" },
  "Biliran": { lat: 11.5833, lon: 124.4667, region: "Eastern Visayas", type: "province" },
  "Naval": { lat: 11.5833, lon: 124.45, region: "Eastern Visayas", type: "city" },

  // Region IX - Zamboanga Peninsula
  "Zamboanga del Norte": { lat: 8.5, lon: 123.5, region: "Zamboanga Peninsula", type: "province" },
  "Dipolog": { lat: 8.5886, lon: 123.3409, region: "Zamboanga Peninsula", type: "city" },
  "Zamboanga del Sur": { lat: 7.8333, lon: 123.5, region: "Zamboanga Peninsula", type: "province" },
  "Pagadian": { lat: 7.8257, lon: 123.4366, region: "Zamboanga Peninsula", type: "city" },
  "Zamboanga Sibugay": { lat: 7.8333, lon: 122.75, region: "Zamboanga Peninsula", type: "province" },
  "Ipil": { lat: 7.7833, lon: 122.5833, region: "Zamboanga Peninsula", type: "city" },
  "Zamboanga City": { lat: 6.9214, lon: 122.079, region: "Zamboanga Peninsula", type: "city" },

  // Region X - Northern Mindanao
  "Bukidnon": { lat: 8.0, lon: 125.0, region: "Northern Mindanao", type: "province" },
  "Malaybalay": { lat: 8.1458, lon: 125.1278, region: "Northern Mindanao", type: "city" },
  "Misamis Oriental": { lat: 8.5, lon: 124.75, region: "Northern Mindanao", type: "province" },
  "Cagayan de Oro": { lat: 8.4542, lon: 124.6319, region: "Northern Mindanao", type: "city" },
  "Misamis Occidental": { lat: 8.5, lon: 123.75, region: "Northern Mindanao", type: "province" },
  "Oroquieta": { lat: 8.4833, lon: 123.8, region: "Northern Mindanao", type: "city" },
  "Lanao del Norte": { lat: 8.0, lon: 124.0, region: "Northern Mindanao", type: "province" },
  "Iligan": { lat: 8.2289, lon: 124.24, region: "Northern Mindanao", type: "city" },
  "Camiguin": { lat: 9.1667, lon: 124.7167, region: "Northern Mindanao", type: "province" },
  "Mambajao": { lat: 9.25, lon: 124.7167, region: "Northern Mindanao", type: "city" },

  // Region XI - Davao Region
  "Davao del Norte": { lat: 7.45, lon: 125.75, region: "Davao Region", type: "province" },
  "Tagum": { lat: 7.4478, lon: 125.8078, region: "Davao Region", type: "city" },
  "Davao del Sur": { lat: 6.75, lon: 125.35, region: "Davao Region", type: "province" },
  "Digos": { lat: 6.75, lon: 125.35, region: "Davao Region", type: "city" },
  "Davao Oriental": { lat: 7.0, lon: 126.1667, region: "Davao Region", type: "province" },
  "Mati": { lat: 6.95, lon: 126.2167, region: "Davao Region", type: "city" },
  "Davao de Oro": { lat: 7.5, lon: 126.0, region: "Davao Region", type: "province" },
  "Nabunturan": { lat: 7.6, lon: 126.0, region: "Davao Region", type: "city" },
  "Davao Occidental": { lat: 6.5, lon: 125.5, region: "Davao Region", type: "province" },
  "Malita": { lat: 6.4, lon: 125.6, region: "Davao Region", type: "city" },
  "Davao City": { lat: 7.1907, lon: 125.4553, region: "Davao Region", type: "city" },

  // Region XII - SOCCSKSARGEN
  "South Cotabato": { lat: 6.3333, lon: 124.8333, region: "SOCCSKSARGEN", type: "province" },
  "Koronadal": { lat: 6.5031, lon: 124.8469, region: "SOCCSKSARGEN", type: "city" },
  "North Cotabato": { lat: 7.2167, lon: 124.25, region: "SOCCSKSARGEN", type: "province" },
  "Kidapawan": { lat: 7.0083, lon: 125.0894, region: "SOCCSKSARGEN", type: "city" },
  "Sultan Kudarat": { lat: 6.5, lon: 124.3333, region: "SOCCSKSARGEN", type: "province" },
  "Isulan": { lat: 6.6333, lon: 124.6, region: "SOCCSKSARGEN", type: "city" },
  "Sarangani": { lat: 5.8667, lon: 125.2833, region: "SOCCSKSARGEN", type: "province" },
  "Alabel": { lat: 5.8833, lon: 125.2833, region: "SOCCSKSARGEN", type: "city" },
  "General Santos": { lat: 6.1164, lon: 125.1716, region: "SOCCSKSARGEN", type: "city" },

  // Region XIII - Caraga
  "Agusan del Norte": { lat: 9.1667, lon: 125.75, region: "Caraga", type: "province" },
  "Butuan": { lat: 8.9492, lon: 125.5436, region: "Caraga", type: "city" },
  "Agusan del Sur": { lat: 8.5, lon: 125.75, region: "Caraga", type: "province" },
  "Prosperidad": { lat: 8.6, lon: 125.9, region: "Caraga", type: "city" },
  "Surigao del Norte": { lat: 9.75, lon: 125.75, region: "Caraga", type: "province" },
  "Surigao City": { lat: 9.7833, lon: 125.4833, region: "Caraga", type: "city" },
  "Surigao del Sur": { lat: 8.75, lon: 126.1667, region: "Caraga", type: "province" },
  "Tandag": { lat: 9.0789, lon: 126.1986, region: "Caraga", type: "city" },
  "Dinagat Islands": { lat: 10.1667, lon: 125.5833, region: "Caraga", type: "province" },
  "San Jose": { lat: 10.0, lon: 125.5833, region: "Caraga", type: "city" },

  // BARMM - Bangsamoro Autonomous Region
  "Maguindanao del Norte": { lat: 7.1333, lon: 124.25, region: "BARMM", type: "province" },
  "Datu Odin Sinsuat": { lat: 7.1833, lon: 124.2167, region: "BARMM", type: "city" },
  "Maguindanao del Sur": { lat: 6.9, lon: 124.4, region: "BARMM", type: "province" },
  "Buluan": { lat: 6.7167, lon: 124.7833, region: "BARMM", type: "city" },
  "Lanao del Sur": { lat: 7.8333, lon: 124.3333, region: "BARMM", type: "province" },
  "Marawi": { lat: 8.0, lon: 124.3, region: "BARMM", type: "city" },
  "Basilan": { lat: 6.5, lon: 122.0833, region: "BARMM", type: "province" },
  "Isabela City": { lat: 6.7, lon: 121.9667, region: "BARMM", type: "city" },
  "Sulu": { lat: 6.0, lon: 121.0, region: "BARMM", type: "province" },
  "Jolo": { lat: 6.05, lon: 121.0, region: "BARMM", type: "city" },
  "Tawi-Tawi": { lat: 5.2, lon: 120.0833, region: "BARMM", type: "province" },
  "Bongao": { lat: 5.0333, lon: 119.7667, region: "BARMM", type: "city" },

  // Cordillera Administrative Region (CAR)
  "Benguet": { lat: 16.3993, lon: 120.601, region: "CAR", type: "province" },
  "Baguio": { lat: 16.4023, lon: 120.596, region: "CAR", type: "city" },
  "Mountain Province": { lat: 17.0833, lon: 121.1667, region: "CAR", type: "province" },
  "Bontoc": { lat: 17.0833, lon: 120.9667, region: "CAR", type: "city" },
  "Ifugao": { lat: 16.8333, lon: 121.1667, region: "CAR", type: "province" },
  "Lagawe": { lat: 16.8, lon: 121.1, region: "CAR", type: "city" },
  "Kalinga": { lat: 17.5, lon: 121.5, region: "CAR", type: "province" },
  "Tabuk": { lat: 17.45, lon: 121.4583, region: "CAR", type: "city" },
  "Apayao": { lat: 18.0, lon: 121.0, region: "CAR", type: "province" },
  "Kabugao": { lat: 18.0167, lon: 121.1833, region: "CAR", type: "city" },
  "Abra": { lat: 17.5833, lon: 120.75, region: "CAR", type: "province" },
  "Bangued": { lat: 17.6, lon: 120.6167, region: "CAR", type: "city" }
};

export default function Home() {
  const { toast } = useToast()
  const router = useRouter() // Initialize useRouter
  const { user } = useAuth() // Use custom auth instead of Clerk
  // const {user} = useUser() // Get user object
  const { addSharedLocation } = useLocationSharing()
  const { t, language } = useLanguage()

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
  const updateRecentSearches = useCallback((location: string) => {
  if (!location.trim()) return;
  
  setRecentSearches(prev => {
    // Remove duplicates and limit to 10 items
    const filtered = prev.filter(item => item !== location);
    const updated = [location, ...filtered].slice(0, 10);
    
    // Save to localStorage
    try {
      localStorage.setItem("winder-recent-searches", JSON.stringify(updated));
    } catch (error) {
      console.error("[v0] Error saving recent searches:", error);
    }
    
    return updated;
  });
}, []);

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

  const [emergencyLocationSearch, setEmergencyLocationSearch] = useState("")
  const [emergencyShowLocationDropdown, setEmergencyShowLocationDropdown] = useState(false)
  const [emergencyFilteredLocations, setEmergencyFilteredLocations] = useState(OLONGAPO_LOCATIONS)
  const [emergencySelectedLocation, setEmergencySelectedLocation] = useState<{
    name: string
    lat: number
    lng: number
  } | null>(null)

  const [smsPreferences, setSmsPreferences] = useState<any>(null)

  const locationBounds = {
    // Central Luzon - Priority 1 for Olongapo
    olongapo: {
      minLat: 14.78,
      maxLat: 14.9,
      minLon: 120.24,
      maxLon: 120.35,
      priority: 1,
    },
    zambales: {
      minLat: 14.5,
      maxLat: 16.0,
      minLon: 119.7,
      maxLon: 120.5,
      priority: 2,
    },
    bataan: {
      minLat: 14.4,
      maxLat: 14.9,
      minLon: 120.35,
      maxLon: 120.7,
      priority: 2,
    },
    pampanga: {
      minLat: 14.8,
      maxLat: 15.4,
      minLon: 120.4,
      maxLon: 120.9,
      priority: 3,
    },
    bulacan: {
      minLat: 14.6,
      maxLat: 15.1,
      minLon: 120.7,
      maxLon: 121.2,
      priority: 3,
    },

    // NCR - Metro Manila
    manila: {
      minLat: 14.4,
      maxLat: 14.8,
      minLon: 120.9,
      maxLon: 121.2,
      priority: 2,
    },

    // Northern Luzon
    ilocosNorte: {
      minLat: 17.9,
      maxLat: 18.6,
      minLon: 120.4,
      maxLon: 121.0,
      priority: 3,
    },
    ilocosSur: {
      minLat: 17.0,
      maxLat: 17.8,
      minLon: 120.2,
      maxLon: 120.7,
      priority: 3,
    },
    laUnion: {
      minLat: 16.3,
      maxLat: 16.9,
      minLon: 120.1,
      maxLon: 120.6,
      priority: 3,
    },
    cagayan: {
      minLat: 17.9,
      maxLat: 18.6,
      minLon: 121.3,
      maxLon: 122.3,
      priority: 3,
    },
    isabela: {
      minLat: 16.5,
      maxLat: 17.5,
      minLon: 121.4,
      maxLon: 122.2,
      priority: 3,
    },
    benguet: {
      minLat: 16.1,
      maxLat: 16.7,
      minLon: 120.4,
      maxLon: 121.0,
      priority: 3,
    },

    // Southern Luzon
    batangas: {
      minLat: 13.5,
      maxLat: 14.2,
      minLon: 120.7,
      maxLon: 121.5,
      priority: 3,
    },
    cavite: {
      minLat: 14.1,
      maxLat: 14.5,
      minLon: 120.6,
      maxLon: 121.1,
      priority: 3,
    },
    laguna: {
      minLat: 14.0,
      maxLat: 14.5,
      minLon: 121.0,
      maxLon: 121.7,
      priority: 3,
    },
    rizal: {
      minLat: 14.4,
      maxLat: 14.8,
      minLon: 121.0,
      maxLon: 121.5,
      priority: 3,
    },
    quezon: {
      minLat: 13.5,
      maxLat: 14.6,
      minLon: 121.3,
      maxLon: 122.5,
      priority: 3,
    },
    palawan: {
      minLat: 7.5,
      maxLat: 12.0,
      minLon: 117.5,
      maxLon: 119.5,
      priority: 3,
    },

    // Bicol Region
    albay: {
      minLat: 12.9,
      maxLat: 13.5,
      minLon: 123.4,
      maxLon: 124.0,
      priority: 3,
    },
    camarinesSur: {
      minLat: 13.3,
      maxLat: 14.0,
      minLon: 122.8,
      maxLon: 123.6,
      priority: 3,
    },
    sorsogon: {
      minLat: 12.5,
      maxLat: 13.2,
      minLon: 123.7,
      maxLon: 124.3,
      priority: 3,
    },
    masbate: {
      minLat: 11.8,
      maxLat: 12.6,
      minLon: 123.2,
      maxLon: 123.9,
      priority: 3,
    },

    // Visayas - Western
    iloilo: {
      minLat: 10.4,
      maxLat: 11.3,
      minLon: 122.2,
      maxLon: 123.1,
      priority: 3,
    },
    capiz: {
      minLat: 11.2,
      maxLat: 11.9,
      minLon: 122.4,
      maxLon: 123.1,
      priority: 3,
    },
    negrosOccidental: {
      minLat: 9.7,
      maxLat: 11.0,
      minLon: 122.5,
      maxLon: 123.3,
      priority: 3,
    },

    // Visayas - Central
    cebu: {
      minLat: 9.5,
      maxLat: 11.3,
      minLon: 123.2,
      maxLon: 124.1,
      priority: 2,
    },
    bohol: {
      minLat: 9.5,
      maxLat: 10.2,
      minLon: 123.7,
      maxLon: 124.6,
      priority: 3,
    },

    // Visayas - Eastern
    leyte: {
      minLat: 10.3,
      maxLat: 11.7,
      minLon: 124.3,
      maxLon: 125.3,
      priority: 3,
    },
    samar: {
      minLat: 11.5,
      maxLat: 12.5,
      minLon: 124.6,
      maxLon: 125.4,
      priority: 3,
    },
    easternSamar: {
      minLat: 10.9,
      maxLat: 12.0,
      minLon: 125.2,
      maxLon: 126.0,
      priority: 3,
    },
    southernLeyte: {
      minLat: 9.9,
      maxLat: 10.6,
      minLon: 124.7,
      maxLon: 125.4,
      priority: 3,
    },

    // Mindanao - Western
    zamboangaDelNorte: {
      minLat: 7.8,
      maxLat: 9.0,
      minLon: 122.7,
      maxLon: 123.7,
      priority: 3,
    },
    zamboangaDelSur: {
      minLat: 7.2,
      maxLat: 8.4,
      minLon: 122.8,
      maxLon: 123.7,
      priority: 3,
    },
    zamboangaSibugay: {
      minLat: 7.4,
      maxLat: 8.2,
      minLon: 122.3,
      maxLon: 123.2,
      priority: 3,
    },
    zamboangaCity: {
      minLat: 6.7,
      maxLat: 7.2,
      minLon: 121.8,
      maxLon: 122.4,
      priority: 2,
    },

    // Mindanao - Northern
    bukidnon: {
      minLat: 7.5,
      maxLat: 8.5,
      minLon: 124.5,
      maxLon: 125.5,
      priority: 3,
    },
    misamisOccidental: {
      minLat: 7.9,
      maxLat: 8.7,
      minLon: 123.5,
      maxLon: 124.1,
      priority: 3,
    },
    misamisOriental: {
      minLat: 8.2,
      maxLat: 9.2,
      minLon: 124.3,
      maxLon: 125.3,
      priority: 3,
    },

    // Mindanao - Southern
    davaoDelNorte: {
      minLat: 7.1,
      maxLat: 7.9,
      minLon: 125.4,
      maxLon: 126.2,
      priority: 3,
    },
    davaoDelSur: {
      minLat: 6.3,
      maxLat: 7.2,
      minLon: 125.0,
      maxLon: 125.8,
      priority: 3,
    },
    davaoOriental: {
      minLat: 6.4,
      maxLat: 7.6,
      minLon: 125.8,
      maxLon: 126.7,
      priority: 3,
    },
    davaoCity: {
      minLat: 6.9,
      maxLat: 7.5,
      minLon: 125.2,
      maxLon: 125.8,
      priority: 2,
    },
    cotabato: {
      minLat: 6.8,
      maxLat: 7.7,
      minLon: 124.0,
      maxLon: 125.3,
      priority: 3,
    },
    southCotabato: {
      minLat: 6.0,
      maxLat: 6.8,
      minLon: 124.4,
      maxLon: 125.5,
      priority: 3,
    },

    // Mindanao - Caraga
    agusan: {
      minLat: 8.5,
      maxLat: 9.5,
      minLon: 125.4,
      maxLon: 126.2,
      priority: 3,
    },
    surigaoDelNorte: {
      minLat: 9.3,
      maxLat: 10.2,
      minLon: 125.2,
      maxLon: 126.2,
      priority: 3,
    },
    surigaoDelSur: {
      minLat: 8.3,
      maxLat: 9.5,
      minLon: 125.8,
      maxLon: 126.6,
      priority: 3,
    },

    // Mindanao - BARMM
    lanaoDelSur: {
      minLat: 7.5,
      maxLat: 8.2,
      minLon: 124.0,
      maxLon: 124.8,
      priority: 3,
    },
    lanaoDelNorte: {
      minLat: 7.7,
      maxLat: 8.4,
      minLon: 123.7,
      maxLon: 124.5,
      priority: 3,
    },
    maguindanao: {
      minLat: 6.7,
      maxLat: 7.5,
      minLon: 124.0,
      maxLon: 124.9,
      priority: 3,
    },
    basilan: {
      minLat: 6.3,
      maxLat: 6.8,
      minLon: 121.8,
      maxLon: 122.3,
      priority: 3,
    },
  }
  // </CHANGE>

  const generateSmartSuggestions = useCallback(async () => {
  const allLocations = Object.keys(philippineLocations);
  const suggestions: Array<{
    name: string;
    temperature: number;
    condition: string;
    icon: string;
    reason: string;
    score: number;
  }> = [];

  // Get current time for context-aware suggestions
  const now = new Date();
  const currentHour = now.getHours();
  const isWeekend = [0, 6].includes(now.getDay());
  const currentMonth = now.getMonth();

  // Priority locations based on various factors
  const priorityLocations = allLocations
    .map(location => {
      const data = philippineLocations[location];
      let score = 0;
      let reason = "";

      // Factor 1: Recent searches
      const recentIndex = recentSearches.indexOf(location);
      if (recentIndex !== -1) {
        score += 50 - recentIndex * 8;
        reason = recentIndex === 0 ? "Last searched" : "Recently searched";
      }

      // Factor 2: Geographic proximity to current location
      if (currentLocationName && location !== currentLocationName) {
        const proximityBonus = getProximityScore(currentLocationName, location);
        score += proximityBonus;
        if (proximityBonus > 20) reason = reason || "Nearby location";
      }

      // Factor 3: Time-based suggestions
      if (currentHour >= 5 && currentHour <= 9) {
        // Morning: suggest cooler destinations
        if (["Baguio", "Tagaytay", "Sagada", "Banaue"].includes(location)) {
          score += 25;
          if (!reason) reason = "Perfect morning destination";
        }
      } else if (currentHour >= 16 && currentHour <= 19) {
        // Evening: suggest sunset/view destinations
        if (["Boracay", "Palawan", "La Union", "Siargao"].includes(location)) {
          score += 25;
          if (!reason) reason = "Beautiful sunset views";
        }
      }

      // Factor 4: Seasonal recommendations
      const seasonalBonus = getSeasonalScore(location, currentMonth);
      score += seasonalBonus;
      if (seasonalBonus > 15) reason = reason || "Perfect season";

      // Factor 5: Weekend vs weekday preferences
      if (isWeekend) {
        // Weekend: suggest tourist destinations
        if (["Boracay", "Palawan", "Cebu", "Bohol", "Baguio", "Tagaytay"].includes(location)) {
          score += 20;
          if (!reason) reason = "Great weekend getaway";
        }
      } else {
        // Weekday: suggest business/commercial centers
        if (["Makati", "Taguig", "Pasig", "Mandaluyong", "Cebu City", "Davao City"].includes(location)) {
          score += 15;
          if (!reason) reason = "Business center";
        }
      }

      // Factor 6: Type preference (cities over provinces)
      if (data.type === "city") {
        score += 10;
      }

      // Factor 7: Major tourist destinations bonus
      const majorDestinations = ["Boracay", "Palawan", "Cebu", "Bohol", "Baguio", "Vigan", "Siargao"];
      if (majorDestinations.includes(location)) {
        score += 15;
        if (!reason) reason = "Popular destination";
      }

      return { name: location, score, reason: reason || "Recommended location" };
    })
    .filter(location => location.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6); // Get top 6 by score

  // Fetch weather data for top locations
  for (const location of priorityLocations) {
    try {
      const coordinates = {
        lat: philippineLocations[location.name].lat,
        lon: philippineLocations[location.name].lon
      };

      const response = await fetch(`/api/weather/current?lat=${coordinates.lat}&lon=${coordinates.lon}`);
      
      if (response.ok) {
        const weatherData = await response.json();
        
        suggestions.push({
          name: location.name,
          temperature: weatherData.temperature,
          condition: weatherData.condition,
          icon: weatherData.icon || getWeatherIconCode(weatherData.condition),
          reason: location.reason,
          score: location.score,
        });
      } else {
        // Fallback to generated weather data if API fails
        const fallbackWeather = generateRealisticWeather(location.name, currentMonth);
        suggestions.push({
          name: location.name,
          temperature: fallbackWeather.temperature,
          condition: fallbackWeather.condition,
          icon: fallbackWeather.icon,
          reason: location.reason,
          score: location.score,
        });
      }
    } catch (error) {
      console.error(`[v0] Error fetching weather for ${location.name}:`, error);
      // Fallback to generated weather data
      const fallbackWeather = generateRealisticWeather(location.name, currentMonth);
      suggestions.push({
        name: location.name,
        temperature: fallbackWeather.temperature,
        condition: fallbackWeather.condition,
        icon: fallbackWeather.icon,
        reason: location.reason,
        score: location.score,
      });
    }
  }

  // Ensure we have at least 3 suggestions
  if (suggestions.length < 3) {
    const fallbackLocations = ["Manila", "Cebu City", "Davao City", "Baguio", "Boracay"];
    for (const locationName of fallbackLocations) {
      if (!suggestions.find(s => s.name === locationName) && suggestions.length < 6) {
        const fallbackWeather = generateRealisticWeather(locationName, currentMonth);
        suggestions.push({
          name: locationName,
          temperature: fallbackWeather.temperature,
          condition: fallbackWeather.condition,
          icon: fallbackWeather.icon,
          reason: "Popular destination",
          score: 30,
        });
      }
    }
  }

  setSuggestedLocations(suggestions.sort((a, b) => b.score - a.score));
}, [recentSearches, currentLocationName]);

// Helper functions for the smart suggestions
const getProximityScore = (currentLocation: string, targetLocation: string): number => {
  const proximityMap: { [key: string]: string[] } = {
    // NCR proximity
    "Manila": ["Quezon City", "Makati", "Taguig", "Pasig", "Mandaluyong", "Pasay", "Parañaque"],
    "Quezon City": ["Manila", "Makati", "Pasig", "Mandaluyong", "Marikina", "Caloocan"],
    "Makati": ["Manila", "Taguig", "Pasay", "Mandaluyong", "Pasig"],
    
    // Central Luzon proximity
    "Olongapo": ["Subic", "Angeles", "San Fernando Pampanga", "Balanga"],
    "Angeles": ["San Fernando Pampanga", "Olongapo", "Tarlac City"],
    
    // Visayas proximity
    "Cebu City": ["Mandaue", "Lapu-Lapu", "Talisay", "Mactan"],
    "Bacolod": ["Silay", "Talisay", "Bago"],
    
    // Mindanao proximity
    "Davao City": ["Tagum", "Digos", "Panabo"],
  };

  const currentProximity = proximityMap[currentLocation] || [];
  return currentProximity.includes(targetLocation) ? 25 : 0;
};

const getSeasonalScore = (location: string, month: number): number => {
  // Dry season (Nov-Apr): months 10-3 (0-indexed: 10,11,0,1,2,3)
  const isDrySeason = month >= 10 || month <= 3;
  
  // Beach destinations score higher in dry season
  const beachDestinations = ["Boracay", "Palawan", "Puerto Princesa", "El Nido", "Coron", "La Union", "Siargao"];
  if (isDrySeason && beachDestinations.includes(location)) {
    return 20;
  }
  
  // Mountain destinations score higher in rainy season
  const mountainDestinations = ["Baguio", "Sagada", "Banaue", "Tagaytay"];
  if (!isDrySeason && mountainDestinations.includes(location)) {
    return 15;
  }
  
  return 0;
};

const generateRealisticWeather = (location: string, month: number) => {
  const weatherPatterns: { [key: string]: any } = {
    // Cool destinations
    "Baguio": { baseTemp: 18, variation: 5, sunnyChance: 0.4, rainChance: 0.4 },
    "Tagaytay": { baseTemp: 22, variation: 4, sunnyChance: 0.5, rainChance: 0.3 },
    "Sagada": { baseTemp: 16, variation: 6, sunnyChance: 0.3, rainChance: 0.5 },
    
    // Beach destinations
    "Boracay": { baseTemp: 28, variation: 3, sunnyChance: 0.7, rainChance: 0.2 },
    "Palawan": { baseTemp: 29, variation: 3, sunnyChance: 0.6, rainChance: 0.3 },
    "Puerto Princesa": { baseTemp: 28, variation: 3, sunnyChance: 0.6, rainChance: 0.3 },
    
    // Urban areas
    "Manila": { baseTemp: 30, variation: 4, sunnyChance: 0.5, rainChance: 0.3 },
    "Cebu City": { baseTemp: 29, variation: 3, sunnyChance: 0.6, rainChance: 0.25 },
    "Davao City": { baseTemp: 31, variation: 3, sunnyChance: 0.65, rainChance: 0.2 },
    
    // Default pattern
    "default": { baseTemp: 28, variation: 4, sunnyChance: 0.6, rainChance: 0.25 }
  };

  const pattern = weatherPatterns[location] || weatherPatterns.default;
  
  // Adjust for season
  const isDrySeason = month >= 10 || month <= 3;
  const seasonalAdjustment = isDrySeason ? 
    { temp: +1, sunny: +0.1, rain: -0.1 } : 
    { temp: -1, sunny: -0.1, rain: +0.1 };
  
  const temp = Math.round(pattern.baseTemp + seasonalAdjustment.temp + (Math.random() - 0.5) * pattern.variation);
  const sunnyChance = Math.max(0.1, Math.min(0.9, pattern.sunnyChance + seasonalAdjustment.sunny));
  const rainChance = Math.max(0.1, Math.min(0.9, pattern.rainChance + seasonalAdjustment.rain));

  const rand = Math.random();
  let condition = "clear";
  let icon = "01d";

  if (rand < rainChance) {
    condition = Math.random() < 0.3 ? "thunderstorm" : "rain";
    icon = condition === "thunderstorm" ? "11d" : "10d";
  } else if (rand < rainChance + 0.2) {
    condition = "clouds";
    icon = "03d";
  } else if (rand < rainChance + 0.2 + sunnyChance) {
    condition = "clear";
    icon = "01d";
  } else {
    condition = "clouds";
    icon = "02d";
  }

  return {
    temperature: temp,
    condition: condition,
    icon: icon,
  };
};

const getWeatherIconCode = (condition: string): string => {
  const iconMap: { [key: string]: string } = {
    "clear": "01d",
    "clouds": "03d",
    "rain": "10d",
    "drizzle": "09d",
    "thunderstorm": "11d",
    "snow": "13d",
    "mist": "50d"
  };
  
  return iconMap[condition.toLowerCase()] || "01d";
};

  useEffect(() => {
    // Dynamically import to avoid server-side rendering issues if the service is client-only
    const initializeSmsPreferences = async () => {
      try {
        const smsService = await import("@/services/smsService")
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

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "winder-sms-preferences") {
        console.log("[v0] SMS preferences updated in storage, reloading...")
        initializeSmsPreferences()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
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
    addNotification("Permission Error", `Failed to enable push notifications: ${(error as Error).message}`, "error")
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
    // If caller didn't provide weatherData, try to enrich from cached weather
    if (!weatherData) {
      try {
        const cached = loadWeatherCache()
        if (cached && cached.data) {
          weatherData = cached.data
          message = `${message} (cached: ${new Date(cached.timestamp).toLocaleString()})`
        }
      } catch (e) {
        // ignore cache errors
      }
    }
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

    // Merged SMS logic into addNotification function
    if (smsPreferences?.enabled && smsPreferences?.phoneNumber) {
      const smsType = type === "warning" ? "alert" : type === "error" ? "alert" : "weather"
      const shouldSendSMS =
        (smsType === "alert" && smsPreferences.riskAlerts) || (smsType === "weather" && smsPreferences.weatherUpdates)

      if (shouldSendSMS) {
        console.log("[v0] Sending SMS notification:", title)
        console.log(
          "[v0] SMS Details - Phone:",
          smsPreferences.phoneNumber,
          "Enabled:",
          smsPreferences.enabled,
          "Type:",
          smsType,
        )
        sendSMS({
          phoneNumber: smsPreferences.phoneNumber,
          message: `${title}: ${enhancedMessage}`,
          type: smsType,
        })
          .then((result) => {
            if (result.success) {
              console.log("[v0] SMS sent successfully with ID:", result.messageId)
            } else {
              console.error("[v0] SMS failed:", result.error)
            }
          })
          .catch((error) => {
            console.error("[v0] Failed to send SMS:", error)
          })
      } else {
        console.log(
          "[v0] SMS not sent - shouldSendSMS:",
          shouldSendSMS,
          "smsType:",
          smsType,
          "riskAlerts:",
          smsPreferences.riskAlerts,
          "weatherUpdates:",
          smsPreferences.weatherUpdates,
        )
      }
    } else {
      console.log(
        "[v0] SMS preferences check failed - enabled:",
        smsPreferences?.enabled,
        "phoneNumber:",
        smsPreferences?.phoneNumber,
      )
    }
    // </CHANGE> End of merged SMS logic
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

          // FIX: undeclared variable reverseGeocode
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
              if (!isCancelled) {
                setCurrentWeather(weatherData)
                try {
                  saveWeatherCache(weatherData, latitude, longitude)
                } catch (e) {
                  console.error("[v0] Failed to save weather cache:", e)
                }
              }
            } catch (error) {
              console.error("[v0] Weather API error:", error)
              if (!isCancelled) {
                // Try to load cached weather when fetch fails
                const cached = loadWeatherCache()
                if (cached && (isNearby(cached.lat, cached.lon, latitude, longitude) || navigator.onLine === false)) {
                  setCurrentWeather(cached.data)
                  addNotification(
                    "Offline Weather",
                    `Unable to fetch live weather — showing cached data from ${new Date(cached.timestamp).toLocaleString()}`,
                    "info",
                  )
                } else {
                  addNotification("Weather Error", "Failed to fetch current weather data", "error")
                }
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

  // Define a list of locations with their coordinates and a radius for proximity checks
  // This list should be comprehensive for Olongapo City and surrounding areas.
  const locations = [
    // NCR
    { name: "Metro Manila", lat: 14.5995, lon: 120.9842, radius: 0.5 },
    { name: "Manila", lat: 14.5995, lon: 120.9842, radius: 0.35 },
    { name: "Quezon City", lat: 14.676, lon: 121.0437, radius: 0.35 },
    { name: "Caloocan City", lat: 14.7566, lon: 121.0453, radius: 0.35 },
    { name: "Makati City", lat: 14.5547, lon: 121.0244, radius: 0.35 },
    { name: "Pasig City", lat: 14.5764, lon: 121.0851, radius: 0.35 },
    { name: "Taguig City", lat: 14.5176, lon: 121.0509, radius: 0.35 },
    { name: "Parañaque City", lat: 14.4793, lon: 121.0198, radius: 0.35 },
    { name: "Las Piñas City", lat: 14.4499, lon: 120.9983, radius: 0.35 },
    { name: "Muntinlupa City", lat: 14.3833, lon: 121.05, radius: 0.35 },
    { name: "Marikina City", lat: 14.6507, lon: 121.1029, radius: 0.35 },
    { name: "Valenzuela City", lat: 14.706, lon: 120.983, radius: 0.35 },
    { name: "San Juan City", lat: 14.6042, lon: 121.03, radius: 0.25 },
    { name: "Mandaluyong City", lat: 14.5836, lon: 121.0409, radius: 0.25 },
    { name: "Pasay City", lat: 14.5378, lon: 120.9815, radius: 0.35 },
    { name: "Malabon City", lat: 14.6686, lon: 120.9563, radius: 0.35 },
    { name: "Navotas City", lat: 14.6667, lon: 120.95, radius: 0.35 },

    // Luzon - Central Luzon
    { name: "Pampanga", lat: 15.0794, lon: 120.6194, radius: 0.5 },
    { name: "San Fernando City", lat: 15.0336, lon: 120.6844, radius: 0.35 },
    { name: "Angeles City", lat: 15.1449, lon: 120.5886, radius: 0.35 },

    { name: "Zambales", lat: 15.3333, lon: 119.95, radius: 0.7 },
    { name: "Olongapo City", lat: 14.8365, lon: 120.2957, radius: 0.6 }, // Increased radius with priority system
    { name: "Iba", lat: 15.3276, lon: 119.9783, radius: 0.35 },

    { name: "Bataan", lat: 14.676, lon: 120.54, radius: 0.5 },
    { name: "Balanga City", lat: 14.676, lon: 120.54, radius: 0.35 },

    { name: "Bulacan", lat: 14.8535, lon: 120.816, radius: 0.5 },
    { name: "Malolos City", lat: 14.8433, lon: 120.8117, radius: 0.35 },
    { name: "Meycauayan City", lat: 14.7333, lon: 120.9667, radius: 0.35 },
    { name: "San Jose del Monte City", lat: 14.8139, lon: 121.0453, radius: 0.35 },

    // Luzon - Northern
    { name: "Ilocos Norte", lat: 18.1647, lon: 120.711, radius: 0.5 },
    { name: "Laoag City", lat: 18.1978, lon: 120.5936, radius: 0.35 },

    { name: "Ilocos Sur", lat: 17.5707, lon: 120.3875, radius: 0.5 },
    { name: "Vigan City", lat: 17.5747, lon: 120.3869, radius: 0.35 },

    { name: "La Union", lat: 16.6159, lon: 120.3199, radius: 0.5 },
    { name: "San Fernando City (La Union)", lat: 16.6159, lon: 120.3199, radius: 0.35 },

    { name: "Cagayan", lat: 18.2489, lon: 121.878, radius: 0.5 },
    { name: "Tuguegarao City", lat: 17.6131, lon: 121.7269, radius: 0.35 },

    { name: "Isabela", lat: 16.9754, lon: 121.8106, radius: 0.5 },
    { name: "Ilagan City", lat: 17.1486, lon: 121.8894, radius: 0.35 },

    { name: "Kalinga", lat: 17.5, lon: 121.5, radius: 0.5 },
    { name: "Tabuk City", lat: 17.45, lon: 121.4583, radius: 0.35 },

    { name: "Benguet", lat: 16.3993, lon: 120.601, radius: 0.5 },
    { name: "Baguio City", lat: 16.4023, lon: 120.596, radius: 0.35 },
    { name: "Sagada", lat: 17.0756, lon: 120.9081, radius: 0.35 },

    // Luzon - Southern
    { name: "Batangas", lat: 13.7565, lon: 121.0583, radius: 0.5 },
    { name: "Batangas City", lat: 13.7565, lon: 121.0583, radius: 0.35 },

    { name: "Cavite", lat: 14.4791, lon: 120.8969, radius: 0.5 },
    { name: "Trece Martires City", lat: 14.2806, lon: 120.8664, radius: 0.35 },
    { name: "Tagaytay City", lat: 14.0976, lon: 120.9406, radius: 0.35 },

    { name: "Laguna", lat: 14.17, lon: 121.3331, radius: 0.5 },
    { name: "Calamba City", lat: 14.2117, lon: 121.1653, radius: 0.35 },
    { name: "San Pablo City", lat: 14.0667, lon: 121.325, radius: 0.35 },

    { name: "Rizal", lat: 14.6034, lon: 121.308, radius: 0.5 },
    { name: "Antipolo City", lat: 14.6258, lon: 121.1226, radius: 0.35 },

    { name: "Quezon Province", lat: 13.9418, lon: 121.6236, radius: 0.5 },
    { name: "Lucena City", lat: 13.9418, lon: 121.6236, radius: 0.35 },

    { name: "Oriental Mindoro", lat: 13.0833, lon: 121.0833, radius: 0.5 },
    { name: "Calapan City", lat: 13.4103, lon: 121.18, radius: 0.35 },

    { name: "Palawan", lat: 9.8349, lon: 118.7384, radius: 0.5 },
    { name: "Puerto Princesa City", lat: 9.7392, lon: 118.7353, radius: 0.35 },

    { name: "Albay", lat: 13.1667, lon: 123.7333, radius: 0.5 },
    { name: "Legazpi City", lat: 13.1333, lon: 123.7333, radius: 0.35 },

    { name: "Camarines Sur", lat: 13.6226, lon: 123.1948, radius: 0.5 },
    { name: "Naga City", lat: 13.6218, lon: 123.1948, radius: 0.35 },

    { name: "Masbate", lat: 12.1667, lon: 123.5833, radius: 0.5 },
    { name: "Masbate City", lat: 12.3667, lon: 123.6167, radius: 0.35 },

    { name: "Sorsogon", lat: 12.9667, lon: 124.0167, radius: 0.5 },
    { name: "Sorsogon City", lat: 12.9714, lon: 124.0064, radius: 0.35 },

    // Visayas
    { name: "Capiz", lat: 11.5833, lon: 122.75, radius: 0.5 },
    { name: "Roxas City", lat: 11.5853, lon: 122.7511, radius: 0.35 },

    { name: "Iloilo", lat: 10.7202, lon: 122.5621, radius: 0.5 },
    { name: "Iloilo City", lat: 10.7202, lon: 122.5621, radius: 0.35 },

    { name: "Negros Occidental", lat: 10.6407, lon: 122.9689, radius: 0.5 },
    { name: "Bacolod City", lat: 10.6765, lon: 122.9509, radius: 0.35 },

    { name: "Bohol", lat: 9.8499, lon: 124.1435, radius: 0.5 },
    { name: "Tagbilaran City", lat: 9.6475, lon: 123.8556, radius: 0.35 },

    { name: "Cebu", lat: 10.3157, lon: 123.8854, radius: 0.6 },
    { name: "Cebu City", lat: 10.3157, lon: 123.8854, radius: 0.4 },
    { name: "Lapu-Lapu City", lat: 10.3102, lon: 123.9494, radius: 0.35 },
    { name: "Mandaue City", lat: 10.3236, lon: 123.9226, radius: 0.35 },
    { name: "Toledo City", lat: 10.3772, lon: 123.6386, radius: 0.35 },
    { name: "Carcar City", lat: 10.115, lon: 123.6403, radius: 0.35 },
    { name: "Danao City", lat: 10.5281, lon: 124.0272, radius: 0.35 },
    { name: "Talisay City (Cebu)", lat: 10.2447, lon: 123.8494, radius: 0.35 },

    { name: "Eastern Samar", lat: 11.5, lon: 125.5, radius: 0.5 },
    { name: "Borongan City", lat: 11.6077, lon: 125.4312, radius: 0.35 },

    { name: "Leyte", lat: 11.25, lon: 124.75, radius: 0.5 },
    { name: "Tacloban City", lat: 11.2433, lon: 124.9772, radius: 0.35 },
    { name: "Ormoc City", lat: 11.0064, lon: 124.6075, radius: 0.35 },
    { name: "Baybay City", lat: 10.6781, lon: 124.8, radius: 0.35 },

    { name: "Samar", lat: 12.0, lon: 125.0, radius: 0.5 },
    { name: "Catbalogan City", lat: 11.7753, lon: 124.8861, radius: 0.35 },

    { name: "Southern Leyte", lat: 10.3333, lon: 125.0833, radius: 0.5 },
    { name: "Maasin City", lat: 10.1333, lon: 124.8333, radius: 0.35 },

    // Mindanao
    { name: "Zamboanga del Norte", lat: 8.5, lon: 123.5, radius: 0.5 },
    { name: "Dipolog City", lat: 8.5886, lon: 123.3409, radius: 0.35 },

    { name: "Zamboanga del Sur", lat: 7.8333, lon: 123.5, radius: 0.5 },
    { name: "Pagadian City", lat: 7.8257, lon: 123.4366, radius: 0.35 },

    { name: "Zamboanga Sibugay", lat: 7.8333, lon: 122.75, radius: 0.5 },
    { name: "Zamboanga City", lat: 6.9214, lon: 122.079, radius: 0.35 },

    { name: "Bukidnon", lat: 8.0, lon: 125.0, radius: 0.5 },
    { name: "Malaybalay City", lat: 8.1458, lon: 125.1278, radius: 0.35 },
    { name: "Valencia City", lat: 7.9, lon: 125.0833, radius: 0.35 },

    { name: "Misamis Occidental", lat: 8.5, lon: 123.75, radius: 0.5 },
    { name: "Oroquieta City", lat: 8.4833, lon: 123.8, radius: 0.35 },
    { name: "Ozamiz City", lat: 8.1462, lon: 123.8444, radius: 0.35 },
    { name: "Tangub City", lat: 8.0672, lon: 123.75, radius: 0.35 },

    { name: "Misamis Oriental", lat: 8.5, lon: 124.75, radius: 0.5 },
    { name: "Cagayan de Oro City", lat: 8.4542, lon: 124.6319, radius: 0.35 },
    { name: "Gingoog City", lat: 8.8333, lon: 125.0833, radius: 0.35 },

    { name: "Davao del Norte", lat: 7.45, lon: 125.75, radius: 0.5 },
    { name: "Tagum City", lat: 7.4478, lon: 125.8078, radius: 0.35 },

    { name: "Davao del Sur", lat: 6.75, lon: 125.35, radius: 0.5 },
    { name: "Digos City", lat: 6.75, lon: 125.35, radius: 0.35 },
    { name: "Davao City", lat: 7.1907, lon: 125.4553, radius: 0.35 },

    { name: "Davao Oriental", lat: 7.0, lon: 126.1667, radius: 0.5 },
    { name: "Mati City", lat: 6.95, lon: 126.2167, radius: 0.35 },

    { name: "Cotabato", lat: 7.2167, lon: 124.25, radius: 0.5 },
    { name: "Kidapawan City", lat: 7.0083, lon: 125.0894, radius: 0.35 },

    { name: "South Cotabato", lat: 6.3333, lon: 124.8333, radius: 0.5 },
    { name: "Koronadal City", lat: 6.5031, lon: 124.8469, radius: 0.35 },
    { name: "General Santos City", lat: 6.1164, lon: 125.1716, radius: 0.35 },

    { name: "Agusan del Norte", lat: 9.1667, lon: 125.75, radius: 0.5 },
    { name: "Butuan City", lat: 8.9492, lon: 125.5436, radius: 0.35 },

    { name: "Surigao del Norte", lat: 9.75, lon: 125.75, radius: 0.5 },
    { name: "Surigao City", lat: 9.7833, lon: 125.4833, radius: 0.35 },

    { name: "Surigao del Sur", lat: 8.75, lon: 126.1667, radius: 0.5 },
    { name: "Tandag City", lat: 9.0789, lon: 126.1986, radius: 0.35 },

    { name: "Basilan", lat: 6.5, lon: 122.0833, radius: 0.5 },
    { name: "Isabela City", lat: 6.7, lon: 121.9667, radius: 0.35 },

    { name: "Lanao del Sur", lat: 7.8333, lon: 124.3333, radius: 0.5 },
    { name: "Marawi City", lat: 8.0, lon: 124.3, radius: 0.35 },

    { name: "Lanao del Norte", lat: 8.0, lon: 124.0, radius: 0.5 },
    { name: "Iligan City", lat: 8.2289, lon: 124.24, radius: 0.35 },

    { name: "Maguindanao", lat: 7.05, lon: 124.45, radius: 0.5 },
    { name: "Cotabato City", lat: 7.2236, lon: 124.2464, radius: 0.35 },

    { name: "Sultan Kudarat", lat: 6.5, lon: 124.3333, radius: 0.5 },
    { name: "Tacurong City", lat: 6.6925, lon: 124.6764, radius: 0.35 },
  ]

  const olongapoBounds = {
    minLat: 14.7,
    maxLat: 14.9,
    minLon: 120.2,
    maxLon: 120.4,
  }

  const reverseGeocode = (lat: number, lon: number): string => {
  // Simple implementation - you can enhance this with a proper geocoding service
  const regionChecks: Array<{ name: string; key: keyof typeof locationBounds; cityName: string }> = [
    // Priority 1 - Olongapo (highest priority due to GPS accuracy issues)
    { name: "olongapo", key: "olongapo", cityName: "Olongapo City" },

    // Priority 2 - Major cities
    { name: "cebu", key: "cebu", cityName: "Cebu" },
    { name: "davaoCity", key: "davaoCity", cityName: "Davao City" },
    { name: "manila", key: "manila", cityName: "Metro Manila" },
    { name: "zamboangaCity", key: "zamboangaCity", cityName: "Zamboanga City" },

    // Priority 3 - Central Luzon
    { name: "zambales", key: "zambales", cityName: "Zambales" },
    { name: "bataan", key: "bataan", cityName: "Bataan" },
    { name: "pampanga", key: "pampanga", cityName: "Pampanga" },
    { name: "bulacan", key: "bulacan", cityName: "Bulacan" },

    // Northern Luzon
    { name: "ilocosNorte", key: "ilocosNorte", cityName: "Ilocos Norte" },
    { name: "ilocosSur", key: "ilocosSur", cityName: "Ilocos Sur" },
    { name: "laUnion", key: "laUnion", cityName: "La Union" },
    { name: "cagayan", key: "cagayan", cityName: "Cagayan" },
    { name: "isabela", key: "isabela", cityName: "Isabela" },
    { name: "benguet", key: "benguet", cityName: "Benguet" },

    // Southern Luzon
    { name: "batangas", key: "batangas", cityName: "Batangas" },
    { name: "cavite", key: "cavite", cityName: "Cavite" },
    { name: "laguna", key: "laguna", cityName: "Laguna" },
    { name: "rizal", key: "rizal", cityName: "Rizal" },
    { name: "quezon", key: "quezon", cityName: "Quezon Province" },
    { name: "palawan", key: "palawan", cityName: "Palawan" },

    // Bicol
    { name: "albay", key: "albay", cityName: "Albay" },
    { name: "camarinesSur", key: "camarinesSur", cityName: "Camarines Sur" },
    { name: "sorsogon", key: "sorsogon", cityName: "Sorsogon" },
    { name: "masbate", key: "masbate", cityName: "Masbate" },

    // Visayas
    { name: "iloilo", key: "iloilo", cityName: "Iloilo" },
    { name: "capiz", key: "capiz", cityName: "Capiz" },
    { name: "negrosOccidental", key: "negrosOccidental", cityName: "Negros Occidental" },
    { name: "bohol", key: "bohol", cityName: "Bohol" },
    { name: "leyte", key: "leyte", cityName: "Leyte" },
    { name: "samar", key: "samar", cityName: "Samar" },
    { name: "easternSamar", key: "easternSamar", cityName: "Eastern Samar" },
    { name: "southernLeyte", key: "southernLeyte", cityName: "Southern Leyte" },

    // Mindanao
    { name: "zamboangaDelNorte", key: "zamboangaDelNorte", cityName: "Zamboanga del Norte" },
    { name: "zamboangaDelSur", key: "zamboangaDelSur", cityName: "Zamboanga del Sur" },
    { name: "zamboangaSibugay", key: "zamboangaSibugay", cityName: "Zamboanga Sibugay" },
    { name: "bukidnon", key: "bukidnon", cityName: "Bukidnon" },
    { name: "misamisOccidental", key: "misamisOccidental", cityName: "Misamis Occidental" },
    { name: "misamisOriental", key: "misamisOriental", cityName: "Misamis Oriental" },
    { name: "davaoDelNorte", key: "davaoDelNorte", cityName: "Davao del Norte" },
    { name: "davaoDelSur", key: "davaoDelSur", cityName: "Davao del Sur" },
    { name: "davaoOriental", key: "davaoOriental", cityName: "Davao Oriental" },
    { name: "cotabato", key: "cotabato", cityName: "Cotabato" },
    { name: "southCotabato", key: "southCotabato", cityName: "South Cotabato" },
    { name: "agusan", key: "agusan", cityName: "Agusan del Norte" },
    { name: "surigaoDelNorte", key: "surigaoDelNorte", cityName: "Surigao del Norte" },
    { name: "surigaoDelSur", key: "surigaoDelSur", cityName: "Surigao del Sur" },
    { name: "lanaoDelSur", key: "lanaoDelSur", cityName: "Lanao del Sur" },
    { name: "lanaoDelNorte", key: "lanaoDelNorte", cityName: "Lanao del Norte" },
    { name: "maguindanao", key: "maguindanao", cityName: "Maguindanao" },
    { name: "basilan", key: "basilan", cityName: "Basilan" },
  ]

  // Check which regions contain the coordinates
  const matchingRegions = regionChecks.filter((region) => {
    const bounds = locationBounds[region.key]
    return lat >= bounds.minLat && lat <= bounds.maxLat && lon >= bounds.minLon && lon <= bounds.maxLon
  })

  // Find all locations within their radius, sorted by distance
  const candidateLocations = locations
    .map((location) => ({
      ...location,
      distance: Math.sqrt(Math.pow(lat - location.lat, 2) + Math.pow(lon - location.lon, 2)),
    }))
    .filter((loc) => loc.distance <= loc.radius)
    .sort((a, b) => a.distance - b.distance)

  // Priority system: If coordinates fall within a priority 1 region (Olongapo)
  if (matchingRegions.length > 0) {
    const priority1Region = matchingRegions.find((r) => locationBounds[r.key].priority === 1)
    if (priority1Region) {
      // Try to find the specific city within this region
      const cityMatch = candidateLocations.find(
        (loc) => loc.name.includes("Olongapo") || loc.name.includes(priority1Region.cityName),
      )
      if (cityMatch) {
        return cityMatch.name
      }
      // Extended threshold check for Olongapo
      const olongapoLocation = locations.find((loc) => loc.name === "Olongapo City")
      if (olongapoLocation) {
        const distanceToOlongapo = Math.sqrt(
          Math.pow(lat - olongapoLocation.lat, 2) + Math.pow(lon - olongapoLocation.lon, 2),
        )
        if (distanceToOlongapo < 0.7) {
          return "Olongapo City"
        }
      }
    }
  }

  // If we found specific city matches, prefer cities over provinces
  if (candidateLocations.length > 0) {
    // Prefer cities (those with "City" in the name) over provinces
    const cityMatch = candidateLocations.find((loc) => loc.name.includes("City"))
    if (cityMatch) {
      return cityMatch.name
    }
    // Otherwise return closest match
    return candidateLocations[0].name
  }

  // Regional fallback based on bounds - use the highest priority matching region
  if (matchingRegions.length > 0) {
    const sortedByPriority = matchingRegions.sort(
      (a, b) => locationBounds[a.key].priority - locationBounds[b.key].priority,
    )
    return sortedByPriority[0].cityName
  }

  // Default to "Philippines" if no specific location is found
  return "Philippines"
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
        const locationName = reverseGeocode(latitude, longitude) // FIX: undeclared variable reverseGeocode

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
              const locationName = reverseGeocode(latitude, longitude) // FIX: undeclared variable reverseGeocode
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
          // FIX: undeclared variable checkWeatherChanges
          compareWeatherConditions(previousWeatherData, weatherData)
        }

        setPreviousWeatherData(weatherData)

        if (!isMonitoring) {
          setCurrentWeather(weatherData)
          try {
            saveWeatherCache(weatherData, lat, lon)
          } catch (e) {
            console.error("[v0] Failed to save weather cache (monitoring):", e)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching weather for monitoring:", error)
      // Try to fallback to cache when network fails
      try {
        const cached = loadWeatherCache()
        if (cached && isNearby(cached.lat, cached.lon, lat, lon)) {
          setCurrentWeather(cached.data)
          addNotification(
            "Offline Weather",
            `Unable to fetch live weather — showing cached data from ${new Date(cached.timestamp).toLocaleString()}`,
            "info",
          )
        }
      } catch (e) {
        console.error("[v0] Error loading cached weather during monitoring fallback:", e)
      }
    }
  }

  const compareWeatherConditions = (oldWeather: WeatherData, newWeather: WeatherData) => {
  const tempChange = Math.abs(newWeather.temperature - oldWeather.temperature)
  const windSpeedChange = Math.abs(newWeather.windSpeed - oldWeather.windSpeed)
  const humidityChange = Math.abs(newWeather.humidity - oldWeather.humidity)

  if (tempChange >= 3) {
    const direction = newWeather.temperature > oldWeather.temperature ? "increased" : "decreased"
    addNotification(
      `Temperature ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
      `Temperature has ${direction} by ${tempChange.toFixed(1)}°C`,
      direction === "increased" && tempChange >= 5 ? "warning" : "info",
      newWeather,
    )
  }

  if (oldWeather.condition !== newWeather.condition) {
    const getWeatherEmoji = (condition: string) => {
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
      `${getWeatherEmoji(oldWeather.condition)} ${oldWeather.condition} → ${getWeatherEmoji(newWeather.condition)} ${newWeather.condition}`,
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
  // </CHANGE>

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
  const searchTerm = locationName || searchLocation;

  if (!searchTerm || typeof searchTerm !== "string" || !searchTerm.trim()) {
    addNotification("Invalid Search", "Please enter a valid location name", "error");
    return;
  }

  const trimmedLocation = searchTerm.trim();
  setSearchLoading(true);
  setSearchWeather(null);
  setSearchError("");

  console.log("[v0] Searching for location:", trimmedLocation);

  try {
    // Find location in our enhanced database
    const locationData = philippineLocations[trimmedLocation];
    
    if (!locationData) {
      // Try fuzzy matching
      const normalizedSearch = trimmedLocation.toLowerCase();
      const foundLocation = Object.keys(philippineLocations).find(key => 
        key.toLowerCase().includes(normalizedSearch) || 
        normalizedSearch.includes(key.toLowerCase())
      );
      
      if (!foundLocation) {
        throw new Error(`Location "${trimmedLocation}" not found in our database`);
      }
      
      // Use the found location
      const coordinates = {
        lat: philippineLocations[foundLocation].lat,
        lon: philippineLocations[foundLocation].lon
      };
      console.log("[v0] Found coordinates for", foundLocation, coordinates);
      
      await fetchWeatherData(coordinates.lat, coordinates.lon, foundLocation);
      setSelectedLocationName(foundLocation);
      updateRecentSearches(foundLocation);
    } else {
      // Exact match found
      const coordinates = { lat: locationData.lat, lon: locationData.lon };
      console.log("[v0] Found exact coordinates for", trimmedLocation, coordinates);
      
      await fetchWeatherData(coordinates.lat, coordinates.lon, trimmedLocation);
      setSelectedLocationName(trimmedLocation);
      updateRecentSearches(trimmedLocation);
    }

  } catch (error) {
    console.error("[v0] Location search failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch weather data";
    addNotification("Search Failed", errorMessage, "error");

    setSearchWeather(null);
    setSelectedLocationName("");
  } finally {
    setSearchLoading(false);
  }
};

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
        locationName = reverseGeocode(coords[0], coords[1]) // FIX: undeclared variable reverseGeocode
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
        const locationName = reverseGeocode(latitude, longitude) // FIX: undeclared variable reverseGeocode

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
    if (!emergencyFormData.senderName.trim() || !emergencyFormData.senderPhone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and phone number for emergency services",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    if (!emergencySelectedLocation) {
      toast({
        title: "Location Required",
        description: "Please select a location in Olongapo City",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    // Show loading toast
    toast({
      title: "Sending Report",
      description: "Sending emergency report...",
      variant: "default",
      duration: 3000,
    })

    const { lat, lng } = emergencySelectedLocation
    const locationName = emergencySelectedLocation.name

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
      location: { lat, lng },
      address: locationName,
      contactNumber: emergencyFormData.senderPhone,
      peopleCount: emergencyFormData.peopleCount,
      additionalInfo: description,
      status: "pending" as const,
      priority,
      assignedTo: undefined,
      responseTime: undefined,
      notes: [],
      deviceInfo,
      accuracy: 10, // Fixed accuracy since we're using predefined locations
    }

    try {
      const result = await saveEmergencyReport(emergencyReportData)
      if (result.success) {
        console.log("[v0] Emergency report saved to database successfully:", result.id)

        // Show detailed success toast
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
        setEmergencySelectedLocation(null)
        setEmergencyLocationSearch("")
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
        const locationName = reverseGeocode(latitude, longitude) // FIX: undeclared variable reverseGeocode

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
    updateRecentSearches(location.name) // FIX: undeclared variable updateRecentSearches
    setTimeout(() => handleLocationSearch(location.name), 100)
  }

  useEffect(() => {
    setEmergencyFilteredLocations(searchLocations(emergencyLocationSearch))
  }, [emergencyLocationSearch])

  const handleSelectEmergencyLocation = (location: { name: string; lat: number; lng: number }) => {
    setEmergencySelectedLocation(location)
    setEmergencyLocationSearch(location.name)
    setEmergencyShowLocationDropdown(false)
  }

  const renderEmergencyForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
        <input
          type="text"
          value={emergencyFormData.senderName}
          onChange={(e) => setEmergencyFormData({ ...emergencyFormData, senderName: e.target.value })}
          placeholder="Your full name"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number *</label>
        <input
          type="tel"
          value={emergencyFormData.senderPhone}
          onChange={(e) => setEmergencyFormData({ ...emergencyFormData, senderPhone: e.target.value })}
          placeholder="Your contact number"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <Label htmlFor="emergencyLocation" className="text-slate-300 text-sm font-medium">
          Location *
        </Label>
        <div className="relative mt-1">
          <Input
            id="emergencyLocation"
            type="text"
            placeholder="Search barangay..."
            value={emergencyLocationSearch}
            onChange={(e) => {
              setEmergencyLocationSearch(e.target.value)
              const filtered = searchLocations(e.target.value)
              setEmergencyFilteredLocations(filtered)
              setEmergencyShowLocationDropdown(true)
            }}
            onFocus={() => setEmergencyShowLocationDropdown(true)}
            className="w-full bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
          />
          {emergencySelectedLocation && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-green-400 font-medium">
              ✓
            </div>
          )}
        </div>

        {emergencyShowLocationDropdown && emergencyFilteredLocations.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`
              #emergencyLocationDropdown::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div id="emergencyLocationDropdown" className="w-full">
              {emergencyFilteredLocations.map((location) => (
                <button
                  key={location.name}
                  onClick={() => {
                    setEmergencySelectedLocation(location)
                    setEmergencyLocationSearch(location.name)
                    setEmergencyShowLocationDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 text-sm border-b border-slate-700/50 last:border-b-0 transition"
                >
                  {location.name}, Olongapo City
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Emergency Type *</label>
        <select
          value={emergencyFormData.emergencyType}
          onChange={(e) => setEmergencyFormData({ ...emergencyFormData, emergencyType: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Select emergency type</option>
          <option value="medical">Medical Emergency</option>
          <option value="fire">Fire</option>
          <option value="accident">Accident</option>
          <option value="crime">Crime</option>
          <option value="natural-disaster">Natural Disaster</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">People Affected</label>
        <input
          type="number"
          min="1"
          value={emergencyFormData.peopleCount}
          onChange={(e) =>
            setEmergencyFormData({ ...emergencyFormData, peopleCount: Number.parseInt(e.target.value) || 1 })
          }
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
        <textarea
          value={emergencyFormData.description}
          onChange={(e) => setEmergencyFormData({ ...emergencyFormData, description: e.target.value })}
          placeholder="Describe the emergency situation..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => handleEmergencyReport(emergencyFormData.emergencyType, emergencyFormData.description)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          Send Emergency Report
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowEmergencyForm(false)
            setEmergencySelectedLocation(null)
            setEmergencyLocationSearch("")
          }}
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Button>
      </div>
    </div>
  )

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

  const handleSearchInputChange = (value: string) => {
  setSearchLocation(value);
  
  // Clear existing timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  if (value.trim().length > 0) {
    const timer = setTimeout(() => {
      const allLocations = Object.keys(philippineLocations);
      const filtered = allLocations
        .filter((location) => {
          const searchTerm = value.toLowerCase();
          const locationLower = location.toLowerCase();

          return (
            locationLower.includes(searchTerm) ||
            locationLower.startsWith(searchTerm) ||
            location.split(" ").some((word) => word.toLowerCase().startsWith(searchTerm)) ||
            // Search by region
            philippineLocations[location].region.toLowerCase().includes(searchTerm) ||
            // Search by type
            philippineLocations[location].type.toLowerCase().includes(searchTerm)
          );
        })
        .sort((a, b) => {
          const searchTerm = value.toLowerCase();
          const aLower = a.toLowerCase();
          const bLower = b.toLowerCase();

          // Exact match first
          if (aLower === searchTerm) return -1;
          if (bLower === searchTerm) return 1;
          
          // Starts with search term
          if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
          if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm)) return 1;
          
          // City matches before provinces
          if (philippineLocations[a].type === "city" && philippineLocations[b].type !== "city") return -1;
          if (philippineLocations[b].type === "city" && philippineLocations[a].type !== "city") return 1;
          
          // Shorter names first
          return a.length - b.length;
        })
        .slice(0, 8); // Limit to 8 suggestions

      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    }, 300); // 300ms debounce

    setSearchDebounceTimer(timer);
  } else {
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  }
};

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
                  <span className="text-[11px] font-medium">{t("nav.dashboard")}</span>
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
                  <span className="text-[11px] font-medium">{t("nav.search")}</span>
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
                  <span className="text-[11px] font-medium">{t("nav.map")}</span>
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
                  <span className="text-[11px] font-medium">{t("nav.social")}</span>
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
                  <span className="text-[11px] font-medium">{t("nav.quick")}</span>
                </button>

                {/* SOS */}
                <button
                  className="flex flex-col items-center justify-center py-3 px-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                  onClick={() => setEmergencyModalOpen(true)}
                >
                  <Phone className="h-5 w-5 mb-1" />
                  <span className="text-[11px] font-medium">{t("nav.sos")}</span>
                </button>
              </div>
            </div>

            {/* Mobile Top Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-800/95 backdrop-blur-md border-b border-slate-700/50">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                    <img 
                      src="/Winder+_Black-BG.png" 
                      alt="Winder+ Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-blue-400 mb-1">WINDER+</h1>
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
            <div className="fixed inset-x-0 top-0 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur-md border-b border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                  {t("search.title")}
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
                {/* Update search placeholder */}
                <input
                  type="text"
                  placeholder={t("search.placeholder")}
                  value={searchLocation}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLocationSearch(searchLocation)}
                  className={`w-full px-4 py-3 text-base bg-slate-700/50 border border-slate-600/50 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 ${
                    searchLoading ? "text-white/50 placeholder-white/40" : "text-white placeholder-slate-400"
                  }`}
                />
                {/* Update search button */}
                <Button
                  onClick={() => handleLocationSearch(searchLocation)}
                  disabled={searchLoading || !searchLocation.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg shadow-lg shadow-blue-500/25"
                >
                  {searchLoading ? <SearchSkeleton /> : <Search className="w-4 h-4" />}
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
                    {t("search.currentLocation")}
                  </>
                )}
              </Button>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-3">
                  <h3 className=" mt-2 text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    {t("search.recent")}
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
              <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                <img
                  src="/Winder+_Black-BG.png"
                  alt="Winder+ Logo"
                  className="w-10 h-10 object-contain"
                />
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
              {/* Update navigation button titles */}
              <button
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  activeView === "dashboard"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                }`}
                onClick={() => setActiveView("dashboard")}
                title={t("nav.dashboard")}
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
                title={t("nav.map")}
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
                title={t("nav.alerts")}
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
                title={t("nav.social")}
              >
                <Users className="h-5 w-5" />
              </button>
              {/* ... existing emergency/settings buttons ... */}
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 border border-red-500/20"
                onClick={() => setEmergencyModalOpen(true)}
                title={t("nav.sos")}
              >
                <Phone className="h-5 w-5" />
              </button>
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/30 transition-all duration-200"
                onClick={() => setSettingsModalOpen(true)}
                title={t("nav.settings")}
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
                {t("search.title")}
              </h2>
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-3 border border-slate-600/30 backdrop-blur-sm">
                <div className="relative">
                  {/* Update search placeholder */}
                  <input
                    type="text"
                    placeholder={t("search.placeholder")}
                    value={searchLocation}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLocationSearch(searchLocation)}
                    className={`w-full px-4 py-3 text-base bg-slate-700/50 border border-slate-600/50 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 ${
                      searchLoading ? "text-white/50 placeholder-white/40" : "text-white placeholder-slate-400"
                    }`}
                  />

                  {/* Update search button */}
                  <Button
                    onClick={() => handleLocationSearch(searchLocation)}
                    disabled={searchLoading || !searchLocation.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg shadow-lg shadow-blue-500/25"
                  >
                    {searchLoading ? <SearchSkeleton /> : <Search className="w-4 h-4" />}
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
                      {t("search.currentLocation")}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              {/* Update Quick Actions section */}
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                {t("quick.actions")}
              </h2>
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-3 border border-slate-600/30 backdrop-blur-sm">
                <div className="space-y-2">
                  {/* Update quick action buttons */}
                  <button
                    onClick={() => setEmergencyKitModalOpen(true)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Package className="h-4 w-4 text-blue-400" />
                    {t("quick.emergencyKit")}
                  </button>
                  <button
                    onClick={() => setLocationSharingModalOpen(true)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    {t("quick.reportEmergency")}
                  </button>
                  <button
                    onClick={() => setWeatherHistoryModalOpen(true)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4 text-green-400" />
                    {t("quick.weatherHistory")}
                  </button>
                  {/* Admin Access Button */}
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4 text-blue-400" />
                    {t("quick.adminAccess")}
                  </button>
                  {/* Volunteer Access Button */}
                  <button
                    onClick={() => router.push("/volunteer-login")}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Users className="h-4 w-4 text-green-400" />
                    {t("quick.volunteerAccess")}
                  </button>
                  {/* Responder Access Button */}
                  <button
                    onClick={() => router.push("/responder-login")}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4 text-orange-400" />
                    {t("quick.responderAccess")}
                  </button>
                </div>
              </div>
            </div>

            {/* Suggested Locations */}
            <div className="space-y-3">
              {/* Update Suggested Locations section */}
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                {t("suggested.locations")}
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
                  {t("search.recent")}
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
                              {/* Update weather display labels */}
                              <p className="text-sm text-slate-300">
                                {t("weather.feelsLike")} {convertTemperature(displayWeather.feelsLike).toFixed(1)}
                                {getTemperatureUnit()}
                              </p>
                            </div>
                            <div className="text-right">
                              {/* Update weather display labels */}
                              <p className="text-sm text-slate-300">
                                {t("weather.humidity")}: {displayWeather.humidity}%
                              </p>
                              {/* Update weather display labels */}
                              <p className="text-sm text-slate-300">
                                {t("weather.windSpeed")}: {convertWindSpeed(displayWeather.windSpeed).toFixed(1)}
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
                  {/* Update Weather Forecast section */}
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    {t("weather.forecast")}
                  </h2>
                  <ForecastSkeleton />
                </div>
              ) : forecast.length > 0 ? (
                <div className="space-y-3">
                  {/* Update Weather Forecast section */}
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    {t("weather.forecast")}
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

              {/* Risk Predictions */}
              {loading || searchLoading ? (
                <div className="space-y-3">
                  {/* Update Risk Predictions section */}
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    {t("weather.risks")}
                  </h2>
                  <RiskPredictionCard loading={true} risks={[]} />
                </div>
              ) : riskPredictions.length > 0 ? (
                <div className="space-y-3">
                  {/* Update Risk Predictions section */}
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    {t("weather.risks")}
                  </h2>
                  <RiskPredictionCard risks={riskPredictions} />
                </div>
              ) : null}

              {/* Weather Indices */}
              {loading || searchLoading ? (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    {t("weather.indices")}
                  </h2>
                  <WeatherIndicesSkeleton />
                </div>
              ) : null}

              {!loading && !searchLoading && weatherIndices && (
                <div className="space-y-3">
                  {/* Update Weather Indices section */}
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                    {t("weather.indices")}
                  </h2>
                  {/* Update the Weather Indices display section to show UV Index instead of Flood Risk */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Heat Index */}
                    <div
                      className={`bg-gradient-to-r from-red-600/30 to-red-500/30 rounded-xl p-5 border border-red-500/40 shadow-lg transition-all duration-200`}
                    >
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-red-400" /> {t("weather.heatIndex")}
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
                        <Sun className="w-5 h-5 text-yellow-400" /> {t("weather.uvIndex")}
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
                        <Wind className="w-5 h-5 text-purple-400" /> {t("weather.typhoonImpact")}
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
                {/* Update alerts modal title */}
                <span className="text-white">{showEvacuationMap ? t("map.evacuation") : t("map.weather")}</span>
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
                <span className="text-white">{t("emergency.title")}</span>
              </DialogTitle>
            </DialogHeader>

            {/* Buttons */}
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Call 911 */}
              <div className="space-y-1">
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
                  {t("emergency.call911")}
                </Button>
                <p className="text-sm text-slate-400 ml-1 mt-2">National emergency hotline</p>
              </div>

              {/* Call 143 */}
              <div className="space-y-1">
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
                  {t("emergency.call143")}
                </Button>
                <p className="text-sm text-slate-400 ml-1 mt-2">Philippine Red Cross hotline</p>
              </div>

              {/* Call 117 */}
              <div className="space-y-1">
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
                  {t("emergency.call117")}
                </Button>
                <p className="text-sm text-slate-400 ml-1 mt-2">Police and public safety hotline</p>
              </div>
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
                {/* Update alerts modal title */}
                <span className="text-white">{t("alerts.title")}</span>
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
                          {/* Update alert details */}
                          <p>
                            <span className="font-medium text-slate-200">{t("alerts.affectedAreas")}:</span>{" "}
                            {alert.areas.join(", ")}
                          </p>
                          <p>
                            <span className="font-medium text-slate-200">{t("alerts.validUntil")}:</span>{" "}
                            {formatDate(alert.validUntil)}
                          </p>
                          {alert.issued && (
                            <p>
                              <span className="font-medium text-slate-200">{t("alerts.issued")}:</span>{" "}
                              {formatDate(alert.issued)}
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
                  {/* Update no alerts message */}
                  <p className="text-slate-400 text-lg">{t("alerts.noAlerts")}</p>
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
                <span className="text-white">{t("settings.title")}</span>
              </DialogTitle>
            </DialogHeader>

            {/* Scrollable Content */}
            <div
              className="flex-1 overflow-y-auto py-6 px-5 sm:px-6 space-y-8
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <LanguageSelector />

              {/* Temperature Unit */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                  {t("settings.temperature")}
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
                      {unit === "celsius" ? t("settings.temperature.celsius") : t("settings.temperature.fahrenheit")}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Wind Speed Unit */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                  {t("settings.wind")}
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
                      {unit === "kmh"
                        ? t("settings.wind.kmh")
                        : unit === "mph"
                          ? t("settings.wind.mph")
                          : t("settings.wind.ms")}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Location Services */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                  {t("settings.location")}
                </h3>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-slate-300">{t("settings.location.desc")}</span>
                  <Button
                    size="sm"
                    onClick={() => setLocationServicesEnabled(!locationServicesEnabled)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      locationServicesEnabled
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                        : "bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 border border-slate-700/60"
                    }`}
                  >
                    {locationServicesEnabled ? t("settings.enabled") : t("settings.disabled")}
                  </Button>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                  {t("settings.notifications")}
                </h3>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-slate-300">{t("settings.notifications.desc")}</span>
                  <Button
                    size="sm"
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      notificationsEnabled
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                        : "bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 border border-slate-700/60"
                    }`}
                  >
                    {notificationsEnabled ? t("settings.enabled") : t("settings.disabled")}
                  </Button>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                  {t("settings.push")}
                </h3>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-slate-300">{t("settings.push.desc")}</span>
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
                    {pushNotificationsEnabled ? t("settings.enabled") : t("settings.disabled")}
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
                    <h2 className="text-white text-lg sm:text-xl">{t("history.title")}</h2>
                    <p className="text-slate-400 text-xs sm:text-sm font-normal">
                      {getFilteredHistory().length} {t("history.recordsFound")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                    className="flex-1 sm:flex-none bg-slate-800/70 border border-slate-600 rounded-lg px-3 py-2 text-white
                    focus:outline-none focus:ring-2 focus:ring-green-500 shadow-inner text-sm"
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
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-1">{getWeatherIcon(entry.condition, entry.icon)}</div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-white font-semibold text-lg whitespace-nowrap">
                                {Math.round(convertTemperature(entry.temperature))}
                                {getTemperatureUnit()}
                              </h3>
                              <span className="text-slate-300 text-sm truncate">{entry.condition}</span>
                            </div>

                            <p className="text-slate-400 text-sm mb-2 truncate">{entry.description}</p>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1 min-w-0 flex-1 sm:flex-initial">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{entry.locationName || entry.location}</span>
                              </span>
                              <span className="whitespace-nowrap flex-shrink-0">💧 {entry.humidity}%</span>
                              <span className="whitespace-nowrap flex-shrink-0">
                                💨 {Math.round(convertWindSpeed(entry.windSpeed))} {getWindSpeedUnit()}
                              </span>
                              <span className="whitespace-nowrap flex-shrink-0">
                                🌡️ {Math.round(convertTemperature(entry.feelsLike))}
                                {getTemperatureUnit()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right text-slate-400 text-sm flex-shrink-0">
                          <div className="font-medium text-xs sm:text-sm whitespace-nowrap">{entry.date}</div>
                          <div className="text-xs whitespace-nowrap">{entry.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-16">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-slate-600 animate-pulse" />
                  <h3 className="text-lg font-medium mb-2">{t("history.noDataTitle")}</h3>
                  <p className="text-sm">
                    {historyFilter === "all" ? t("history.noDataDescAll") : t("history.noDataDescFiltered")}
                  </p>
                  {historyFilter !== "all" && (
                    <Button
                      onClick={() => setHistoryFilter("all")}
                      variant="outline"
                      size="sm"
                      className="mt-4 border-slate-600 text-slate-400 hover:bg-slate-700 rounded-lg"
                    >
                      {t("history.viewAll")}
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
            border border-slate-700/60 rounded-2xl shadow-2xl
            p-0 overflow-hidden animate-fadeInScale"
          >
            {/* Header */}
            <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b border-slate-700/50">
              <DialogTitle className="flex items-center gap-2 sm:gap-4 text-lg sm:text-2xl font-bold">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-red-600 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
                </div>
                <span>{t("reportEmergency.title")}</span>
              </DialogTitle>
            </DialogHeader>

            {/* Privacy / Transparency Notice */}
            <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-700/50 bg-slate-900/30">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-300 leading-relaxed">
                  <strong>Privacy Notice:</strong> Your real-time location will be automatically sent to responders to
                  help them reach you faster and more accurately.
                </p>
              </div>
            </div>

            <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto scrollbar-hide max-h-[60vh] sm:max-h-[70vh]">
              {showEmergencyForm ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="senderName" className="text-slate-300 text-sm font-medium">
                      {t("reportEmergency.fullName")} *
                    </Label>
                    <Input
                      id="senderName"
                      type="text"
                      placeholder={t("reportEmergency.fullNamePlaceholder")}
                      value={emergencyFormData.senderName}
                      onChange={(e) => setEmergencyFormData((prev) => ({ ...prev, senderName: e.target.value }))}
                      className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="senderPhone" className="text-slate-300 text-sm font-medium">
                      {t("reportEmergency.phoneNumber")} *
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

                  <div className="relative">
                    <Label htmlFor="emergencyLocation" className="text-slate-300 text-sm font-medium">
                      Location *
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="emergencyLocation"
                        type="text"
                        placeholder="Search barangay..."
                        value={emergencyLocationSearch}
                        onChange={(e) => {
                          setEmergencyLocationSearch(e.target.value)
                          const filtered = searchLocations(e.target.value)
                          setEmergencyFilteredLocations(filtered)
                          setEmergencyShowLocationDropdown(true)
                        }}
                        onFocus={() => setEmergencyShowLocationDropdown(true)}
                        className="w-full bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                      />
                      {emergencySelectedLocation && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-green-400 font-medium">
                          ✓
                        </div>
                      )}
                    </div>

                    {emergencyShowLocationDropdown && emergencyFilteredLocations.length > 0 && (
                      <div
                        className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                      >
                        <style>{`
                          #emergencyLocationDropdown::-webkit-scrollbar {
                            display: none;
                          }
                        `}</style>
                        <div id="emergencyLocationDropdown" className="w-full">
                          {emergencyFilteredLocations.map((location) => (
                            <button
                              key={location.name}
                              onClick={() => {
                                setEmergencySelectedLocation(location)
                                setEmergencyLocationSearch(location.name)
                                setEmergencyShowLocationDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 text-sm border-b border-slate-700/50 last:border-b-0 transition"
                            >
                              {location.name}, Olongapo City
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="peopleCount" className="text-slate-300 text-sm font-medium">
                      {t("reportEmergency.peopleAffected")}
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
                      <strong>{t("reportEmergency.typeLabel")}:</strong>{" "}
                      {emergencyFormData.emergencyType.charAt(0).toUpperCase() +
                        emergencyFormData.emergencyType.slice(1)}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">{emergencyFormData.description}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowEmergencyForm(false)}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      {t("common.back")}
                    </Button>
                    <Button
                      onClick={() =>
                        handleEmergencyReport(emergencyFormData.emergencyType, emergencyFormData.description)
                      }
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white"
                      disabled={
                        !emergencyFormData.senderName.trim() ||
                        !emergencyFormData.senderPhone.trim() ||
                        !emergencySelectedLocation
                      }
                    >
                      {t("reportEmergency.sendReportButton")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-300 leading-relaxed text-center text-xs sm:text-sm md:text-base">
                    {t("reportEmergency.selectTypePrompt")}
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
                        <div className="font-semibold text-xs sm:text-sm md:text-base">{t("emergency.medical")}</div>
                        <div className="text-xs opacity-90">{t("emergency.medicalDesc")}</div>
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
                        <div className="font-semibold text-xs sm:text-sm md:text-base">{t("emergency.fire")}</div>
                        <div className="text-xs opacity-90">{t("emergency.fireDesc")}</div>
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
                        <div className="font-semibold text-xs sm:text-sm md:text-base">{t("emergency.crime")}</div>
                        <div className="text-xs opacity-90">{t("emergency.crimeDesc")}</div>
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
                        <div className="font-semibold text-xs sm:text-sm md:text-base">{t("emergency.disaster")}</div>
                        <div className="text-xs opacity-90">{t("emergency.disasterDesc")}</div>
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
                        <div className="font-semibold text-xs sm:text-sm md:text-base">{t("emergency.accident")}</div>
                        <div className="text-xs opacity-90">{t("emergency.accidentDesc")}</div>
                      </div>
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-slate-700/50">
                    <p className="text-slate-400 text-sm text-center mb-3">{t("emergency.contactDirectly")}</p>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500
                        text-white rounded-xl py-3 font-semibold shadow-lg transition hover:scale-[1.02]"
                        onClick={() => window.open("tel:911", "_self")}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t("emergency.call911Button")}
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500
                        text-white rounded-xl py-3 font-semibold shadow-lg transition hover:scale-[1.02]"
                        onClick={() => window.open("tel:143", "_self")}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t("emergency.call143Button")}
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
                <span>{t("quick.actions")}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 p-3 sm:p-4 md:p-6 space-y-1.5 sm:space-y-2 md:space-y-3 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto scrollbar-hide">
              <p className="text-slate-300 leading-relaxed text-center text-xs sm:text-sm md:text-base mb-3 sm:mb-4">
                {t("quick.actions.prompt")}
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
                    <div className="font-semibold text-xs sm:text-sm md:text-base">{t("quick.emergencyKit")}</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">{t("quick.emergencyKitDesc")}</div>
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
                    <div className="font-semibold text-xs sm:text-sm md:text-base">{t("quick.reportEmergency")}</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">{t("quick.reportEmergencyDesc")}</div>
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
                    <div className="font-semibold text-xs sm:text-sm md:text-base">{t("quick.weatherHistory")}</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">{t("quick.weatherHistoryDesc")}</div>
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
                    <div className="font-semibold text-xs sm:text-sm md:text-base">{t("quick.adminAccess")}</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">{t("quick.adminAccessDesc")}</div>
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
                    <div className="font-semibold text-xs sm:text-sm md:text-base">{t("quick.volunteerAccess")}</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">{t("quick.volunteerAccessDesc")}</div>
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
                    <div className="font-semibold text-xs sm:text-sm md:text-base">{t("quick.responderAccess")}</div>
                    <div className="text-xs opacity-90 truncate hidden sm:block">{t("quick.responderAccessDesc")}</div>
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
