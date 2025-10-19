"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, MapPin } from "lucide-react"

interface WeatherHistoryEntry {
  id: string
  date: string
  time: string
  temperature: number
  condition: string
  description: string
  location: string
  locationName: string
  humidity: number
  windSpeed: number
  feelsLike: number
  icon: string
  timestamp: number
}

interface WeatherHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weatherHistory: WeatherHistoryEntry[]
  historyFilter: string
  locationFilter: string
  onHistoryFilterChange: (filter: string) => void
  onLocationFilterChange: (location: string) => void
  onClearHistory: () => void
  getFilteredHistory: () => WeatherHistoryEntry[]
  getUniqueLocations: () => string[]
  getWeatherIcon: (condition: string, icon: string) => React.ReactNode
  convertTemperature: (temp: number) => number
  getTemperatureUnit: () => string
  convertWindSpeed: (speed: number) => number
  getWindSpeedUnit: () => string
  isQuickActionsFlow?: boolean
  onQuickActionsReturn?: () => void
}

export function WeatherHistoryModal({
  open,
  onOpenChange,
  weatherHistory,
  historyFilter,
  locationFilter,
  onHistoryFilterChange,
  onLocationFilterChange,
  onClearHistory,
  getFilteredHistory,
  getUniqueLocations,
  getWeatherIcon,
  convertTemperature,
  getTemperatureUnit,
  convertWindSpeed,
  getWindSpeedUnit,
  isQuickActionsFlow = false,
  onQuickActionsReturn,
}: WeatherHistoryModalProps) {
  const handleClose = (open: boolean) => {
    onOpenChange(open)
    if (!open && isQuickActionsFlow && onQuickActionsReturn) {
      setTimeout(() => onQuickActionsReturn(), 100)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
                <h2 className="text-white text-lg sm:text-xl">Weather History</h2>
                <p className="text-slate-400 text-xs sm:text-sm font-normal">
                  {getFilteredHistory().length} records found
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={historyFilter}
                onChange={(e) => onHistoryFilterChange(e.target.value)}
                className="flex-1 sm:flex-none bg-slate-800/70 border border-slate-600 rounded-lg px-3 py-2 text-white
                focus:outline-none focus:ring-2 focus:ring-green-500 shadow-inner"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              {weatherHistory.length > 0 && (
                <Button
                  onClick={onClearHistory}
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
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-hide">
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
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div className="flex-shrink-0">{getWeatherIcon(entry.condition, entry.icon)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-white font-semibold text-lg">
                            {Math.round(convertTemperature(entry.temperature))}
                            {getTemperatureUnit()}
                          </h3>
                          <span className="text-slate-300 text-sm">{entry.condition}</span>
                        </div>

                        <p className="text-slate-400 text-sm mb-2">{entry.description}</p>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{entry.locationName || entry.location}</span>
                          </span>
                          <span className="whitespace-nowrap">💧 {entry.humidity}%</span>
                          <span className="whitespace-nowrap">
                            💨 {Math.round(convertWindSpeed(entry.windSpeed))} {getWindSpeedUnit()}
                          </span>
                          <span className="whitespace-nowrap">
                            🌡️ Feels like {Math.round(convertTemperature(entry.feelsLike))}
                            {getTemperatureUnit()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-slate-400 text-sm flex-shrink-0">
                      <div className="font-medium text-xs sm:text-sm">{entry.date}</div>
                      <div className="text-xs">{entry.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-16">
              <Clock className="w-16 h-16 mx-auto mb-4 text-slate-600 animate-pulse" />
              <h3 className="text-lg font-medium mb-2">No weather history available</h3>
              <p className="text-sm">
                {historyFilter === "all"
                  ? "Weather data will appear here as you use the app"
                  : `No weather data found for the selected time period`}
              </p>
              {historyFilter !== "all" && (
                <Button
                  onClick={() => onHistoryFilterChange("all")}
                  variant="outline"
                  size="sm"
                  className="mt-4 border-slate-600 text-slate-400 hover:bg-slate-700 rounded-lg"
                >
                  View All History
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
