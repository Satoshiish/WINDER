"use client"

import { Cloud, Droplets, Wind, Mountain, TrendingDown, TrendingUp } from "lucide-react"

interface RiskPrediction {
  category: string
  risk: number
  trend: "increasing" | "decreasing" | "stable"
  description: string
}

interface RiskPredictionCardProps {
  risks: RiskPrediction[]
  loading?: boolean
}

export function RiskPredictionCard({ risks, loading = false }: RiskPredictionCardProps) {
  const getRiskColor = (risk: number): string => {
    if (risk >= 70) return "text-red-400"
    if (risk >= 50) return "text-orange-400"
    if (risk >= 30) return "text-yellow-400"
    return "text-green-400"
  }

  const getRiskBgColor = (risk: number): string => {
    if (risk >= 70) return "from-red-600/20 to-red-500/10"
    if (risk >= 50) return "from-orange-600/20 to-orange-500/10"
    if (risk >= 30) return "from-yellow-600/20 to-yellow-500/10"
    return "from-green-600/20 to-green-500/10"
  }

  const getRiskBorderColor = (risk: number): string => {
    if (risk >= 70) return "border-red-500/40"
    if (risk >= 50) return "border-orange-500/40"
    if (risk >= 30) return "border-yellow-500/40"
    return "border-green-500/40"
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return <TrendingUp className="w-4 h-4 text-red-400" />
    if (trend === "decreasing") return <TrendingDown className="w-4 h-4 text-green-400" />
    return <div className="w-4 h-4 text-gray-400">−</div>
  }

  const getRiskIcon = (category: string) => {
    switch (category) {
      case "Rainfall Risk":
        return <Cloud className="w-5 h-5 text-blue-400" />
      case "Flood Risk":
        return <Droplets className="w-5 h-5 text-cyan-400" />
      case "Wind Risk":
        return <Wind className="w-5 h-5 text-purple-400" />
      case "Landslide Risk":
        return <Mountain className="w-5 h-5 text-amber-400" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/30 animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {risks.map((risk) => (
        <div
          key={risk.category}
          className={`bg-gradient-to-r ${getRiskBgColor(risk.risk)} rounded-xl p-4 border ${getRiskBorderColor(risk.risk)} backdrop-blur-sm transition-all duration-200 hover:shadow-lg`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {getRiskIcon(risk.category)}
              <h3 className="text-lg font-semibold text-white">{risk.category}</h3>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(risk.trend)}
              <span className={`text-2xl font-bold ${getRiskColor(risk.risk)}`}>{risk.risk}%</span>
            </div>
          </div>
          <p className="text-sm text-slate-300">{risk.description}</p>
        </div>
      ))}
    </div>
  )
}
