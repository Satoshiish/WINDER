"use client"

import { Sun, Wind, Thermometer } from "lucide-react"

interface WeatherIndex {
  value: number
  category: string
  color: string
  advisory: string
  typhoonLevel?: string
}

interface WeatherIndicesCardProps {
  heatIndex?: WeatherIndex
  uvIndex?: WeatherIndex
  typhoonImpactIndex?: WeatherIndex
  loading?: boolean
}

export function WeatherIndicesCard({
  heatIndex,
  uvIndex,
  typhoonImpactIndex,
  loading = false,
}: WeatherIndicesCardProps) {
  const getCardBgColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      green: "bg-green-950/60 border-green-700/50",
      yellow: "bg-yellow-950/60 border-yellow-700/50",
      orange: "bg-orange-950/60 border-orange-700/50",
      red: "bg-red-950/60 border-red-700/50",
      darkred: "bg-red-950/70 border-red-700/60",
      purple: "bg-purple-950/70 border-purple-700/60",
    }
    return colorMap[color] || "bg-slate-900/60 border-slate-700/50"
  }

  const getTextColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      green: "text-green-300",
      yellow: "text-yellow-300",
      orange: "text-orange-300",
      red: "text-red-300",
      darkred: "text-red-300",
      purple: "text-purple-300",
    }
    return colorMap[color] || "text-slate-300"
  }

  const getValueColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      green: "text-green-400",
      yellow: "text-yellow-400",
      orange: "text-orange-400",
      red: "text-red-400",
      darkred: "text-red-400",
      purple: "text-purple-400",
    }
    return colorMap[color] || "text-slate-400"
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900/40 rounded-lg p-6 border border-slate-700/50 animate-pulse">
            <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-4"></div>
            <div className="h-10 bg-slate-700/50 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Heat Index */}
      {heatIndex && (
        <div
          className={`rounded-lg p-6 border ${getCardBgColor(heatIndex.color)} backdrop-blur-sm transition-all duration-300 hover:shadow-lg`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Thermometer className="h-6 w-6 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Heat Index</h3>
          </div>
          <p className={`text-4xl font-bold ${getValueColor(heatIndex.color)} mb-2`}>{heatIndex.value.toFixed(1)}°C</p>
          <p className={`text-sm font-medium ${getTextColor(heatIndex.color)} mb-2`}>{heatIndex.category}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{heatIndex.advisory}</p>
        </div>
      )}

      {/* UV Index */}
      {uvIndex && (
        <div
          className={`rounded-lg p-6 border ${getCardBgColor(uvIndex.color)} backdrop-blur-sm transition-all duration-300 hover:shadow-lg`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Sun className="h-6 w-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">UV Index</h3>
          </div>
          <p className={`text-4xl font-bold ${getValueColor(uvIndex.color)} mb-2`}>{uvIndex.value.toFixed(1)}</p>
          <p className={`text-sm font-medium ${getTextColor(uvIndex.color)} mb-2`}>{uvIndex.category}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{uvIndex.advisory}</p>
        </div>
      )}

      {/* Typhoon Impact Index */}
      {typhoonImpactIndex && (
        <div
          className={`rounded-lg p-6 border ${getCardBgColor(typhoonImpactIndex.color)} backdrop-blur-sm transition-all duration-300 hover:shadow-lg`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Wind className="h-6 w-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Typhoon Impact</h3>
          </div>
          <p className={`text-4xl font-bold ${getValueColor(typhoonImpactIndex.color)} mb-2`}>
            {typhoonImpactIndex.value.toFixed(1)}
          </p>
          <p className={`text-sm font-medium ${getTextColor(typhoonImpactIndex.color)} mb-2`}>
            {typhoonImpactIndex.category}
            {typhoonImpactIndex.typhoonLevel && ` - ${typhoonImpactIndex.typhoonLevel}`}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">{typhoonImpactIndex.advisory}</p>
        </div>
      )}
    </div>
  )
}
