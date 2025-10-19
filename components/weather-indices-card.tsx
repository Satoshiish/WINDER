"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Sun, Wind, Thermometer } from "lucide-react"

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
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weather Indices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading indices...</div>
        </CardContent>
      </Card>
    )
  }

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      green: "bg-green-50 border-green-200 text-green-900",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
      orange: "bg-orange-50 border-orange-200 text-orange-900",
      red: "bg-red-50 border-red-200 text-red-900",
      darkred: "bg-red-100 border-red-300 text-red-950",
      purple: "bg-purple-50 border-purple-200 text-purple-900",
    }
    return colorMap[color] || "bg-gray-50 border-gray-200 text-gray-900"
  }

  const getBadgeVariant = (color: string) => {
    const variantMap: { [key: string]: any } = {
      green: "outline",
      yellow: "secondary",
      orange: "secondary",
      red: "destructive",
      darkred: "destructive",
      purple: "destructive",
    }
    return variantMap[color] || "outline"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Weather Indices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Heat Index */}
        {heatIndex && (
          <div className={`p-4 rounded-lg border ${getColorClass(heatIndex.color)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                <span className="font-semibold">Heat Index</span>
              </div>
              <Badge variant={getBadgeVariant(heatIndex.color)}>{heatIndex.value}</Badge>
            </div>
            <p className="text-sm font-medium mb-1">{heatIndex.category}</p>
            <p className="text-sm">{heatIndex.advisory}</p>
          </div>
        )}

        {uvIndex && (
          <div className={`p-4 rounded-lg border ${getColorClass(uvIndex.color)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                <span className="font-semibold">UV Index</span>
              </div>
              <Badge variant={getBadgeVariant(uvIndex.color)}>{uvIndex.value.toFixed(1)}</Badge>
            </div>
            <p className="text-sm font-medium mb-1">{uvIndex.category}</p>
            <p className="text-sm">{uvIndex.advisory}</p>
          </div>
        )}

        {/* Typhoon Impact Index */}
        {typhoonImpactIndex && (
          <div className={`p-4 rounded-lg border ${getColorClass(typhoonImpactIndex.color)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wind className="h-5 w-5" />
                <span className="font-semibold">Typhoon Impact</span>
              </div>
              <Badge variant={getBadgeVariant(typhoonImpactIndex.color)}>{typhoonImpactIndex.value}</Badge>
            </div>
            <p className="text-sm font-medium mb-1">
              {typhoonImpactIndex.category}
              {typhoonImpactIndex.typhoonLevel && ` - ${typhoonImpactIndex.typhoonLevel}`}
            </p>
            <p className="text-sm">{typhoonImpactIndex.advisory}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
