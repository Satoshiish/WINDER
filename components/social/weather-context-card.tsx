"use client"

import { Cloud, Droplets, Wind, AlertTriangle, MapPin } from "lucide-react"

interface WeatherContextCardProps {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  riskLevel: "low" | "medium" | "high"
}

export function WeatherContextCard({
  location,
  temperature,
  condition,
  humidity,
  windSpeed,
  riskLevel,
}: WeatherContextCardProps) {
  const getRiskColor = () => {
    switch (riskLevel) {
      case "high":
        return "from-red-500/20 to-orange-500/20 border-red-500/30"
      case "medium":
        return "from-yellow-500/20 to-amber-500/20 border-yellow-500/30"
      default:
        return "from-green-500/20 to-emerald-500/20 border-green-500/30"
    }
  }

  const getRiskBadgeColor = () => {
    switch (riskLevel) {
      case "high":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      default:
        return "bg-green-500/20 text-green-300 border-green-500/30"
    }
  }

  return (
    <div className={`bg-gradient-to-r ${getRiskColor()} rounded-lg border p-4 backdrop-blur-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-300">{location}</span>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium border ${getRiskBadgeColor()}`}>
          {riskLevel.toUpperCase()} RISK
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="flex flex-col items-center">
          <Cloud className="w-5 h-5 text-blue-400 mb-1" />
          <span className="text-lg font-bold text-white">{temperature}°C</span>
          <span className="text-xs text-slate-400">{condition}</span>
        </div>
        <div className="flex flex-col items-center">
          <Droplets className="w-5 h-5 text-cyan-400 mb-1" />
          <span className="text-lg font-bold text-white">{humidity}%</span>
          <span className="text-xs text-slate-400">Humidity</span>
        </div>
        <div className="flex flex-col items-center">
          <Wind className="w-5 h-5 text-blue-300 mb-1" />
          <span className="text-lg font-bold text-white">{windSpeed}</span>
          <span className="text-xs text-slate-400">km/h</span>
        </div>
        <div className="flex flex-col items-center">
          <AlertTriangle className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-xs text-slate-300 text-center">Stay Safe</span>
        </div>
      </div>
    </div>
  )
}
