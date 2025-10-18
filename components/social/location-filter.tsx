"use client"

import { useState } from "react"
import { MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LocationFilterProps {
  selectedLocation: string
  onLocationChange: (location: string) => void
  availableLocations: string[]
}

export function LocationFilter({ selectedLocation, onLocationChange, availableLocations }: LocationFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="gap-2 bg-slate-800/50 border-slate-600/30 hover:bg-slate-700/50 text-slate-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MapPin className="w-4 h-4 text-blue-400" />
        <span>{selectedLocation}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-48 bg-slate-800 border border-slate-600/30 rounded-lg shadow-lg z-10 backdrop-blur-sm">
          {availableLocations.map((location) => (
            <button
              key={location}
              onClick={() => {
                onLocationChange(location)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors ${
                selectedLocation === location ? "bg-blue-500/20 text-blue-300" : "text-slate-300"
              }`}
            >
              {location}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
