"use client"

import { MapPin } from "lucide-react"
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
      <div className="flex-shrink-0 p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="space-y-3">
          {/* Title with accent line */}
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {showEvacuationMap ? "Evacuation Map" : "Weather Map"}
            </h1>
          </div>

          {/* Location selector */}
          <div className="flex items-center gap-2 pl-4">
            <MapPin className="w-4 h-4 text-blue-400" />
            <Button
              onClick={() => setShowEvacuationMap(!showEvacuationMap)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium shadow-md transition"
            >
              {showEvacuationMap ? (
                <>
                  <span className="hidden sm:inline">Weather Map</span>
                  <span className="sm:hidden">Weather</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Evacuation Map</span>
                  <span className="sm:hidden">Evacuation</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 overflow-y-auto">
        {showEvacuationMap ? (
          // Evacuation Map - No extra styling needed as it handles its own
          <div className="h-full">
            <EvacuationMap />
          </div>
        ) : (
          // Weather Map - Keep the existing styling
          <div className="p-4 sm:p-6 h-full">
            <iframe
              src={getWeatherMapUrl()}
              className="w-full h-full rounded-2xl border border-slate-700 shadow-inner hover:shadow-lg transition-all duration-300"
              title="Weather Map"
            />
          </div>
        )}
      </div>
    </div>
  )
}