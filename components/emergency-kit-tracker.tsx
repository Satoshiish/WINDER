"use client"

import { useState, useEffect } from "react"
import { Package, CheckCircle2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface KitItem {
  id: string
  name: string
  status: "stocked" | "check-soon" | "needs-update"
  lastChecked: number // timestamp
  notes?: string
}

interface PreparednesItem {
  id: string
  label: string
  completed: boolean
}

interface EmergencyKitData {
  items: KitItem[]
  preparedness: PreparednesItem[]
}

const DEFAULT_ITEMS: KitItem[] = [
  {
    id: "water",
    name: "Water (1 gallon per person/day)",
    status: "stocked",
    lastChecked: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: "food",
    name: "Non-perishable food (3-day supply)",
    status: "check-soon",
    lastChecked: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "first-aid",
    name: "First aid kit & medications",
    status: "stocked",
    lastChecked: Date.now() - 21 * 24 * 60 * 60 * 1000,
  },
  {
    id: "flashlight",
    name: "Flashlights & batteries",
    status: "needs-update",
    lastChecked: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
  {
    id: "documents",
    name: "Important documents & cash",
    status: "stocked",
    lastChecked: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
]

const DEFAULT_PREPAREDNESS: PreparednesItem[] = [
  { id: "contacts", label: "Emergency contact list prepared", completed: true },
  { id: "evacuation", label: "Family evacuation plan created", completed: false },
  { id: "documents", label: "Important documents backed up", completed: false },
  { id: "safe-room", label: "Safe room identified", completed: false },
]

const getTimeAgo = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`
  return `${months} month${months > 1 ? "s" : ""} ago`
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "stocked":
      return "bg-green-500/20 text-green-300"
    case "check-soon":
      return "bg-yellow-500/20 text-yellow-300"
    case "needs-update":
      return "bg-red-500/20 text-red-300"
    default:
      return "bg-slate-500/20 text-slate-300"
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "stocked":
      return "✓ Stocked"
    case "check-soon":
      return "⚠ Check soon"
    case "needs-update":
      return "✗ Needs update"
    default:
      return "Unknown"
  }
}

export function EmergencyKitTracker({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [data, setData] = useState<EmergencyKitData>({
    items: DEFAULT_ITEMS,
    preparedness: DEFAULT_PREPAREDNESS,
  })

  useEffect(() => {
    const stored = localStorage.getItem("emergency-kit-data")
    if (stored) {
      try {
        setData(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to load emergency kit data:", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("emergency-kit-data", JSON.stringify(data))
  }, [data])

  const updateItemStatus = (itemId: string, newStatus: "stocked" | "check-soon" | "needs-update") => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, status: newStatus, lastChecked: Date.now() } : item,
      ),
    }))
  }

  const togglePreparedness = (id: string) => {
    setData((prev) => ({
      ...prev,
      preparedness: prev.preparedness.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    }))
  }

  const resetAllData = () => {
    if (confirm("Are you sure you want to reset all emergency kit data?")) {
      setData({
        items: DEFAULT_ITEMS,
        preparedness: DEFAULT_PREPAREDNESS,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-700/60 text-white max-w-lg w-[92vw] max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeInScale">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 p-6 border-b border-slate-700/50">
          <DialogTitle className="flex items-center gap-4 text-xl sm:text-2xl font-bold">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            Emergency Kit Tracker
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto scrollbar-hide">
          <p className="text-slate-300 leading-relaxed">
            Track your emergency preparedness and maintain your emergency kit inventory. Updates are saved to this
            device.
          </p>

          {/* Preparedness Checklist */}
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Preparedness Checklist
            </h3>

            <div className="space-y-2">
              {data.preparedness.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-slate-800/40 backdrop-blur rounded-lg border border-slate-700/50 hover:border-blue-500/50 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => togglePreparedness(item.id)}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className={`text-sm ${item.completed ? "text-slate-400 line-through" : "text-slate-300"}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Emergency Kit Inventory */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Emergency Kit Inventory
            </h3>

            <div className="space-y-2">
              {data.items.map((item) => (
                <div key={item.id} className="bg-slate-800/40 backdrop-blur rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">{item.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">Last checked: {getTimeAgo(item.lastChecked)}</div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateItemStatus(item.id, "stocked")}
                      className={`text-xs px-2 py-1 rounded transition ${
                        item.status === "stocked"
                          ? "bg-green-500/30 text-green-300 border border-green-500/50"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                      }`}
                    >
                      ✓ Stocked
                    </button>
                    <button
                      onClick={() => updateItemStatus(item.id, "check-soon")}
                      className={`text-xs px-2 py-1 rounded transition ${
                        item.status === "check-soon"
                          ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                      }`}
                    >
                      ⚠ Check soon
                    </button>
                    <button
                      onClick={() => updateItemStatus(item.id, "needs-update")}
                      className={`text-xs px-2 py-1 rounded transition ${
                        item.status === "needs-update"
                          ? "bg-red-500/30 text-red-300 border border-red-500/50"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                      }`}
                    >
                      ✗ Needs update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reminder Section */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              💡 <strong>Tip:</strong> Review your emergency kit every 6 months and update items as needed. Check
              expiration dates on food and medications regularly.
            </p>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetAllData}
            className="w-full text-xs px-3 py-2 rounded bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 transition"
          >
            Reset to defaults
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
