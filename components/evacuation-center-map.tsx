"use client"

import { useEffect, useRef, useState } from "react"
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
  const [isValidDistance, setIsValidDistance] = useState(true)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      // Validate distance
      const validDistance = !!(nearestCenter.distance && isFinite(nearestCenter.distance) && nearestCenter.distance > 0)
      setIsValidDistance(validDistance)

      // Initialize map
      const map = L.map(mapRef.current).setView([userLat, userLon], 13)

      // Add OpenStreetMap tiles with better styling
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 5,
      }).addTo(map)

      // Add user location marker
      const userMarker = L.marker([userLat, userLon], {
        icon: getUserIcon(),
      })
        .bindPopup(
          `<div style="color: white; font-size: 13px; font-family: sans-serif;">` +
            `<p style="font-weight: bold; margin: 0 0 6px 0;">📍 Your Location</p>` +
            `<p style="margin: 4px 0;">Lat: <strong>${userLat.toFixed(5)}</strong></p>` +
            `<p style="margin: 4px 0;">Lon: <strong>${userLon.toFixed(5)}</strong></p>` +
            `</div>`,
        )
        .openPopup()
        .addTo(map)

      // Add evacuation center marker
      const occupancyPercent = (nearestCenter.currentOccupancy / nearestCenter.capacity) * 100
      const occupancyColor = occupancyPercent > 80 ? "#ef4433" : occupancyPercent > 50 ? "#eab308" : "#22c55e"
      const distanceDisplay = validDistance ? `${nearestCenter.distance.toFixed(1)} km` : "N/A"
      
      const centerMarker = L.marker([nearestCenter.coordinates[0], nearestCenter.coordinates[1]], {
        icon: getEvacuationIcon(),
      })
        .bindPopup(
          `<div style="color: white; font-size: 13px; font-family: sans-serif; max-width: 200px;">` +
            `<p style="font-weight: bold; color: #ef4433; margin: 0 0 8px 0;">🏛️ ${nearestCenter.name}</p>` +
            `<p style="margin: 4px 0; color: #e5e7eb;">${nearestCenter.address}</p>` +
            `<div style="border-top: 1px solid #4b5563; margin: 8px 0; padding-top: 8px;">` +
            `<p style="margin: 4px 0;">Capacity: <strong>${nearestCenter.currentOccupancy}/${nearestCenter.capacity}</strong></p>` +
            `<p style="margin: 4px 0; color: ${occupancyColor};">` +
            `Occupancy: <strong>${occupancyPercent.toFixed(0)}%</strong></p>` +
            `<p style="margin: 4px 0; color: #60a5fa;">Distance: <strong>${distanceDisplay}</strong></p>` +
            `</div></div>`,
        )
        .openPopup()
        .addTo(map)

      // Draw a line between user and evacuation center
      if (validDistance) {
        const polyline = L.polyline(
          [
            [userLat, userLon],
            [nearestCenter.coordinates[0], nearestCenter.coordinates[1]],
          ],
          {
            color: "#3b82f6",
            weight: 3,
            opacity: 0.7,
            dashArray: "5, 10",
          },
        ).addTo(map)

        // Add distance label at midpoint
        const midLat = (userLat + nearestCenter.coordinates[0]) / 2
        const midLon = (userLon + nearestCenter.coordinates[1]) / 2
        const distanceLabel = L.marker([midLat, midLon], {
          icon: L.divIcon({
            html: `<div style="background: rgba(30, 41, 59, 0.95); color: #60a5fa; padding: 4px 8px; border-radius: 4px; border: 2px solid #3b82f6; font-size: 12px; font-weight: bold; white-space: nowrap;">↔ ${nearestCenter.distance.toFixed(1)} km</div>`,
            iconSize: undefined,
            className: "distance-label",
          }),
        }).addTo(map)
      }

      // Fit bounds to show both markers
      const bounds = L.latLngBounds(
        [userLat, userLon] as L.LatLngExpression,
        [nearestCenter.coordinates[0], nearestCenter.coordinates[1]] as L.LatLngExpression,
      )
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
