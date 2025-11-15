"use client"

import { Cloud, Droplets, Wind, Mountain, TrendingDown, TrendingUp, Minus, Zap } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { translateRiskDescription } from "@/lib/translate-weather"
import type { RiskPrediction } from "@/lib/interfaces"

interface RiskPredictionCardProps {
  risks: RiskPrediction[]
  loading?: boolean
}

export function RiskPredictionCard({ risks, loading = false }: RiskPredictionCardProps) {
  const { t } = useLanguage()

  const getRiskColor = (risk: number): string => {
    if (risk >= 70) return "text-red-400"
    if (risk >= 50) return "text-orange-400"
    if (risk >= 30) return "text-yellow-400"
    return "text-green-400"
  }

  const getRiskBorderColor = (risk: number): string => {
    if (risk >= 70) return "border-red-500"
    if (risk >= 50) return "border-orange-500"
    if (risk >= 30) return "border-yellow-500"
    return "border-green-500"
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return <TrendingUp className="w-4 h-4 text-red-400" />
    if (trend === "decreasing") return <TrendingDown className="w-4 h-4 text-green-400" />
    return <Minus className="w-4 h-4 text-slate-400" />
  }

  const getRiskIcon = (category: string) => {
    switch (category) {
      case "Rainfall Risk":
        return <Cloud className="w-6 h-6 text-blue-400" />
      case "Flood Risk":
        return <Droplets className="w-6 h-6 text-cyan-400" />
      case "Wind Risk":
        return <Wind className="w-6 h-6 text-purple-400" />
      case "Landslide Risk":
        return <Mountain className="w-6 h-6 text-yellow-400" />
      case "Earthquake Risk":
        return <Zap className="w-6 h-6 text-orange-500" />
      default:
        return null
    }
  }

  const translateRiskCategory = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      "Rainfall Risk": "risk.rainfall",
      "Flood Risk": "risk.flood",
      "Wind Risk": "risk.wind",
      "Landslide Risk": "risk.landslide",
      "Earthquake Risk": "risk.earthquake",
    }
    return t(categoryMap[category] || category)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800/20 rounded-lg p-5 border-l-4 border-slate-700 animate-pulse">
            <div className="h-7 bg-slate-700/50 rounded w-3/4 mb-4"></div>
            <div className="h-5 bg-slate-700/50 rounded w-1/2"></div>
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
          className={`bg-slate-800/20 rounded-lg p-5 border-l-4 ${getRiskBorderColor(risk.risk)} backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {getRiskIcon(risk.category)}
              <h3 className="text-base font-semibold text-white">{translateRiskCategory(risk.category)}</h3>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(risk.trend)}
              <span className={`text-2xl font-bold ${getRiskColor(risk.risk)}`}>{risk.risk}%</span>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{translateRiskDescription(risk.description, t)}</p>
        </div>
      ))}
    </div>
  )
}
