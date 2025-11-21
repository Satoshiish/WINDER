"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface EvacuationCenterMapProps {
  userLat: number
  userLon: number
  nearestCenter: {
    name: string
    coordinates: [number, number]
    address: string
    capacity: number
    currentOccupancy: number
    distance: number
  }
}

// Custom icons
const getUserIcon = () =>
  L.icon({
    iconUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzMzNjZjYyIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })

const getEvacuationIcon = () =>
  L.icon({
    iconUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjQgMkM0IDIgMiA0IDIgMjRjMCAyMCAxOCAyMiAyMiAyMnMyMiAtMiAyMiAtMjJjMCAtMjAgLTIgLTIyIC0yMiAtMjJ6TTI0IDM0Yy02IDAgLTEwIC00IC0xMCAtMTBzNCAtMTAgMTAgLTEwczEwIDQgMTAgMTBzLTQgMTAgLTEwIDEweiIgZmlsbD0iI2VmNDQzYiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSI2IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+",
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  })

export function EvacuationCenterMap({ userLat, userLon, nearestCenter }: EvacuationCenterMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      // Initialize map
      const map = L.map(mapRef.current).setView([userLat, userLon], 13)

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add user location marker
      const userMarker = L.marker([userLat, userLon], {
        icon: getUserIcon(),
      })
        .bindPopup(
          `<div style="color: white; font-size: 12px;">` +
            `<p style="font-weight: bold;">Your Location</p>` +
            `<p>Lat: ${userLat.toFixed(5)}</p>` +
            `<p>Lon: ${userLon.toFixed(5)}</p>` +
            `</div>`,
        )
        .addTo(map)

      // Add evacuation center marker
      const occupancyPercent = (nearestCenter.currentOccupancy / nearestCenter.capacity) * 100
      const centerMarker = L.marker([nearestCenter.coordinates[0], nearestCenter.coordinates[1]], {
        icon: getEvacuationIcon(),
      })
        .bindPopup(
          `<div style="color: white; font-size: 12px;">` +
            `<p style="font-weight: bold; color: #ef4433;">${nearestCenter.name}</p>` +
            `<p style="margin-top: 4px;">${nearestCenter.address}</p>` +
            `<p style="margin-top: 4px;">Capacity: ${nearestCenter.currentOccupancy}/${nearestCenter.capacity}</p>` +
            `<p style="color: ${occupancyPercent > 80 ? "#ef4433" : "#22c55e"};">` +
            `${occupancyPercent.toFixed(0)}% full</p>` +
            `<p style="margin-top: 4px; color: #60a5fa;">Distance: ${nearestCenter.distance.toFixed(1)} km</p>` +
            `</div>`,
        )
        .addTo(map)

      // Fit bounds to show both markers
      const bounds = L.latLngBounds([[userLat, userLon]], [[nearestCenter.coordinates[0], nearestCenter.coordinates[1]]])
      map.fitBounds(bounds, { padding: [50, 50] })

      mapInstanceRef.current = map

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      }
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }, [userLat, userLon, nearestCenter])

  return (
    <div
      ref={mapRef}
      style={{
        height: "400px",
        width: "100%",
        borderRadius: "0.5rem",
      }}
      className="rounded-lg border border-slate-700"
    />
  )
}
