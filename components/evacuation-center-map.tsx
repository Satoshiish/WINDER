"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"

interface MapMarker {
  lat: number
  lon: number
  name: string
  type: "user" | "evacuation"
  capacity?: number
  occupancy?: number
  address?: string
}

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
const userIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzMzNjZjYyIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
})

const evacuationIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjQgMkM0IDIgMiA0IDIgMjRjMCAyMCAxOCAyMiAyMiAyMnMyMiAtMiAyMiAtMjJjMCAtMjAgLTIgLTIyIC0yMiAtMjJ6TTI0IDM0Yy02IDAgLTEwIC00IC0xMCAtMTBzNCAtMTAgMTAgLTEwczEwIDQgMTAgMTBzLTQgMTAgLTEwIDEweiIgZmlsbD0iI2VmNDQzYiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSI2IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+",
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
})

export function EvacuationCenterMap({ userLat, userLon, nearestCenter }: EvacuationCenterMapProps) {
  const mapRef = useRef<any | null>(null)

  // Use whenCreated to get map instance safely
  const handleMapCreated = (mapInstance: any) => {
    mapRef.current = mapInstance
    try {
      const bounds = L.latLngBounds([
        [userLat, userLon],
        [nearestCenter.coordinates[0], nearestCenter.coordinates[1]],
      ])
      mapInstance.fitBounds(bounds, { padding: [50, 50] })
    } catch (e) {
      // defensive
      console.warn("Error fitting map bounds:", e)
    }
  }

  const occupancyPercent = (nearestCenter.currentOccupancy / Math.max(nearestCenter.capacity, 1)) * 100

  return (
    <MapContainer
      whenCreated={handleMapCreated}
      center={[userLat, userLon]}
      zoom={13}
      style={{ height: "400px", width: "100%", borderRadius: "0.5rem" }}
      className="rounded-lg border border-slate-700"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {/* User Location Marker */}
      <Marker position={[userLat, userLon]} icon={userIcon}>
        <Popup className="bg-slate-800 border border-slate-600 rounded text-white">
          <div className="text-sm">
            <p className="font-semibold">Your Location</p>
            <p className="text-xs text-slate-300">Lat: {userLat.toFixed(5)}</p>
            <p className="text-xs text-slate-300">Lon: {userLon.toFixed(5)}</p>
          </div>
        </Popup>
      </Marker>

      {/* Nearest Evacuation Center Marker */}
      <Marker position={[nearestCenter.coordinates[0], nearestCenter.coordinates[1]]} icon={evacuationIcon}>
        <Popup className="bg-slate-800 border border-slate-600 rounded text-white">
          <div className="text-sm">
            <p className="font-semibold text-red-400">{nearestCenter.name}</p>
            <p className="text-xs text-slate-300 mt-1">{nearestCenter.address}</p>
            <p className="text-xs text-slate-300 mt-1">
              Capacity: {nearestCenter.currentOccupancy}/{nearestCenter.capacity}
            </p>
            <p className="text-xs text-slate-300">
              <span className={occupancyPercent > 80 ? "text-red-400" : "text-green-400"}>
                {occupancyPercent.toFixed(0)}% full
              </span>
            </p>
            <p className="text-xs text-blue-300 mt-1">Distance: {nearestCenter.distance.toFixed(1)} km</p>
          </div>
        </Popup>
      </Marker>

      {/* Draw a simple polyline between user and nearest center */}
      {/* import Polyline inline to avoid unused import warnings */}
      {(() => {
        try {
          const { Polyline } = require("react-leaflet")
          const positions = [
            [userLat, userLon],
            [nearestCenter.coordinates[0], nearestCenter.coordinates[1]],
          ]
          return <Polyline positions={positions} pathOptions={{ color: "#06b6d4" }} />
        } catch (e) {
          return null
        }
      })()}
    </MapContainer>
  )
}
