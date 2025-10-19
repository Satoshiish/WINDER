"use client"

import { Thermometer, CloudRain, Cloud } from "lucide-react"

interface WeatherIndex {
  value: number
  category: string
  color: string
  advisory: string
  typhoonLevel?: string
}

interface WeatherIndexIndicatorProps {
  heatIndex?: WeatherIndex
  floodRiskIndex?: WeatherIndex
  typhoonImpactIndex?: WeatherIndex
  compact?: boolean
}

export function WeatherIndexIndicator({
  heatIndex,
  floodRiskIndex,
  typhoonImpactIndex,
  compact = false,
}: WeatherIndexIndicatorProps) {
  if (!heatIndex && !floodRiskIndex && !typhoonImpactIndex) {
    return null
  }

  const getColorBg = (color: string) => {
    const colorMap: { [key: string]: string } = {
      green: "bg-green-500/20 border-green-500/40",
      yellow: "bg-yellow-500/20 border-yellow-500/40",
      orange: "bg-orange-500/20 border-orange-500/40",
      red: "bg-red-500/20 border-red-500/40",
      darkred: "bg-red-600/30 border-red-600/50",
      purple: "bg-purple-500/20 border-purple-500/40",
    }
    return colorMap[color] || "bg-gray-500/20 border-gray-500/40"
  }

  const getColorText = (color: string) => {
    const colorMap: { [key: string]: string } = {
      green: "text-green-400",
      yellow: "text-yellow-400",
      orange: "text-orange-400",
      red: "text-red-400",
      darkred: "text-red-300",
      purple: "text-purple-400",
    }
    return colorMap[color] || "text-gray-400"
  }

  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {heatIndex && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getColorBg(heatIndex.color)}`}>
            <Thermometer className={`h-3 w-3 ${getColorText(heatIndex.color)}`} />
            <span className="text-xs font-medium">{heatIndex.value.toFixed(0)}°C</span>
          </div>
        )}
        {floodRiskIndex && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getColorBg(floodRiskIndex.color)}`}>
            <CloudRain className={`h-3 w-3 ${getColorText(floodRiskIndex.color)}`} />
            <span className="text-xs font-medium">{floodRiskIndex.value.toFixed(0)}%</span>
          </div>
        )}
        {typhoonImpactIndex && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getColorBg(typhoonImpactIndex.color)}`}>
            <Cloud className={`h-3 w-3 ${getColorText(typhoonImpactIndex.color)}`} />
            <span className="text-xs font-medium">{typhoonImpactIndex.value.toFixed(0)}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {heatIndex && (
        <div className={`p-2 rounded-lg border ${getColorBg(heatIndex.color)}`}>
          <div className="flex items-center gap-1 mb-1">
            <Thermometer className={`h-4 w-4 ${getColorText(heatIndex.color)}`} />
            <span className="text-xs font-semibold">Heat</span>
          </div>
          <p className="text-sm font-bold">{heatIndex.value.toFixed(0)}°C</p>
          <p className={`text-xs ${getColorText(heatIndex.color)}`}>{heatIndex.category}</p>
        </div>
      )}
      {floodRiskIndex && (
        <div className={`p-2 rounded-lg border ${getColorBg(floodRiskIndex.color)}`}>
          <div className="flex items-center gap-1 mb-1">
            <CloudRain className={`h-4 w-4 ${getColorText(floodRiskIndex.color)}`} />
            <span className="text-xs font-semibold">Flood</span>
          </div>
          <p className="text-sm font-bold">{floodRiskIndex.value.toFixed(0)}%</p>
          <p className={`text-xs ${getColorText(floodRiskIndex.color)}`}>{floodRiskIndex.category}</p>
        </div>
      )}
      {typhoonImpactIndex && (
        <div className={`p-2 rounded-lg border ${getColorBg(typhoonImpactIndex.color)}`}>
          <div className="flex items-center gap-1 mb-1">
            <Cloud className={`h-4 w-4 ${getColorText(typhoonImpactIndex.color)}`} />
            <span className="text-xs font-semibold">Typhoon</span>
          </div>
          <p className="text-sm font-bold">{typhoonImpactIndex.value.toFixed(0)}</p>
          <p className={`text-xs ${getColorText(typhoonImpactIndex.color)}`}>{typhoonImpactIndex.category}</p>
        </div>
      )}
    </div>
  )
}
