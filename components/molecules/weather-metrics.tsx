"use client"

import React from "react"
import Metric from "@/components/atoms/metric"
import { Droplets, Wind, Eye } from "lucide-react"
import type { WeatherData } from "@/lib/interfaces"

interface WeatherMetricsProps {
  humidity: number
  windSpeed: number
  visibility?: number
}

export function WeatherMetrics({ humidity, windSpeed, visibility = 0 }: WeatherMetricsProps) {
  return (
    <div className="text-right space-y-1">
      <div className="flex items-center justify-end gap-4">
        <Metric icon={<Droplets className="h-4 w-4" />} label="Humidity" value={`${humidity}%`} />
        <Metric icon={<Wind className="h-4 w-4" />} label="Wind" value={`${windSpeed} km/h`} />
        <Metric icon={<Eye className="h-4 w-4" />} label="Visibility" value={`${visibility} km`} />
      </div>
    </div>
  )
}

export default WeatherMetrics
