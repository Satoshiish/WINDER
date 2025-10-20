"use client"

import { MapPin, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EvacuationMap } from "@/components/evacuation-map"

interface MapViewProps {
  showEvacuationMap: boolean
  setShowEvacuationMap: (show: boolean) => void
  getWeatherMapUrl: () => string
}

export function MapView({ showEvacuationMap, setShowEvacuationMap, getWeatherMapUrl }: MapViewProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-green-600 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
              {showEvacuationMap ? (
                <AlertCircle className="w-6 h-6 text-white animate-bounce" />
              ) : (
                <MapPin className="w-6 h-6 text-white animate-bounce" />
              )}
            </div>
            <span className="text-white text-xl sm:text-2xl font-bold">
              {showEvacuationMap ? "Evacuation Map" : "Weather Map"}
            </span>
          </div>
          <Button
            onClick={() => setShowEvacuationMap(!showEvacuationMap)}
            className={`flex items-center gap-2 ${
              showEvacuationMap
                ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
            } text-white rounded-lg px-3 py-2 text-sm font-semibold shadow-lg transition hover:scale-[1.02]`}
          >
            {showEvacuationMap ? (
              <>
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Weather Map</span>
                <span className="sm:hidden">Weather</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Evacuation Map</span>
                <span className="sm:hidden">Evacuation</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {showEvacuationMap ? (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 h-full">
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
    </div>
  )
}
