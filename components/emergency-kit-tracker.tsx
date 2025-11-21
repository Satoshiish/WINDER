"use client"

import { useState, useEffect } from "react"
import { Package, CheckCircle2, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface KitItem {
  id: string
  name: string
  status: "stocked" | "check-soon" | "needs-update"
  lastChecked: number // timestamp
  notes?: string
  description?: string
  quantity?: string
  tips?: string[]
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
    name: "Water",
    status: "needs-update",
    lastChecked: Date.now() - 14 * 24 * 60 * 60 * 1000,
    description: "Essential for drinking, cooking, and sanitation",
    quantity: "1 gallon per person per day for at least 3 days (minimum)",
    tips: [
      "Store in food-grade containers",
      "Keep in a cool, dark place",
      "Replace stored water every 6 months",
      "For a family of 4: store at least 12 gallons",
      "Consider bottled water for portability during evacuation",
    ],
  },
  {
    id: "food",
    name: "Non-perishable Food",
    status: "needs-update",
    lastChecked: Date.now() - 30 * 24 * 60 * 60 * 1000,
    description: "Sustenance that doesn't require cooking or refrigeration",
    quantity: "3-day supply per person (minimum)",
    tips: [
      "Choose foods you actually eat",
      "Include canned fruits, vegetables, and proteins",
      "Add crackers, granola bars, peanut butter, and nuts",
      "Don't forget pet food if applicable",
      "Check expiration dates every 6 months",
      "Include comfort foods for morale",
    ],
  },
  {
    id: "first-aid",
    name: "First Aid Kit & Medications",
    status: "needs-update",
    lastChecked: Date.now() - 21 * 24 * 60 * 60 * 1000,
    description: "Medical supplies for treating injuries and illnesses",
    quantity: "Complete first aid supplies + 7-day supply of prescription medications",
    tips: [
      "Include bandages, gauze, antiseptic, and pain relievers",
      "Add tweezers, scissors, and elastic bandages",
      "Keep prescription medications in original bottles",
      "Include a list of allergies and medication doses",
      "Check expiration dates every 6 months",
      "Include antihistamines for allergies",
      "Add hydrocortisone cream and antibiotic ointment",
    ],
  },
  {
    id: "flashlight",
    name: "Flashlights & Batteries",
    status: "needs-update",
    lastChecked: Date.now() - 60 * 24 * 60 * 60 * 1000,
    description: "Critical for visibility during power outages",
    quantity: "Flashlights (1-2 per person) + extra batteries for 2+ weeks",
    tips: [
      "Use LED flashlights - they're more efficient",
      "Store batteries in a cool, dry place",
      "Replace batteries annually or after use",
      "Include glow sticks as backup",
      "Consider a hand-crank flashlight (no batteries needed)",
      "Test flashlights monthly",
    ],
  },
  {
    id: "documents",
    name: "Important Documents & Cash",
    status: "needs-update",
    lastChecked: Date.now() - 7 * 24 * 60 * 60 * 1000,
    description: "Essential documents and emergency cash for evacuation",
    quantity: "Copies of all documents + ₱2,000-5,000 in cash",
    tips: [
      "Keep in waterproof, portable container",
      "Include birth certificates, insurance policies, IDs",
      "Store credit card numbers and bank contacts separately",
      "Make digital copies on cloud storage",
      "Keep cash in small bills",
      "Include list of emergency contacts with phone numbers",
    ],
  },
  {
    id: "communication",
    name: "Communication Tools",
    status: "needs-update",
    lastChecked: Date.now() - 45 * 24 * 60 * 60 * 1000,
    description: "Stay connected and informed during emergencies",
    quantity: "2-way radios, mobile phone chargers, portable power bank",
    tips: [
      "Include a battery-powered or hand-crank radio",
      "Keep phone chargers and power banks with full batteries",
      "Consider a solar phone charger",
      "Store contact numbers written on paper",
      "Test radios monthly",
      "Keep backup chargers for multiple devices",
    ],
  },
  {
    id: "shelter",
    name: "Shelter & Bedding",
    status: "needs-update",
    lastChecked: Date.now() - 90 * 24 * 60 * 60 * 1000,
    description: "Protection from weather and elements",
    quantity: "Tent, tarps, sleeping bags, or blankets",
    tips: [
      "Include lightweight tent or emergency shelter",
      "Add heavy-duty tarps and duct tape",
      "Store sleeping bags or extra blankets",
      "Include emergency bivy sacks for portability",
      "Keep plastic sheeting for windbreaks",
      "Test tent setup annually",
    ],
  },
  {
    id: "clothing",
    name: "Weather-Appropriate Clothing",
    status: "needs-update",
    lastChecked: Date.now() - 30 * 24 * 60 * 60 * 1000,
    description: "Protection from weather conditions",
    quantity: "Complete change of clothes per person + sturdy shoes",
    tips: [
      "Include rain gear and warm layers",
      "Store sturdy, comfortable walking shoes",
      "Add work gloves for cleanup",
      "Include hats and masks for dust/debris",
      "Keep in waterproof bag",
      "Refresh annually with seasonal changes",
    ],
  },
  {
    id: "hygiene",
    name: "Personal Hygiene & Sanitation",
    status: "needs-update",
    lastChecked: Date.now() - 45 * 24 * 60 * 60 * 1000,
    description: "Maintain health and prevent disease",
    quantity: "3-day supply of essential hygiene items",
    tips: [
      "Include soap, toothbrush, toothpaste, and toilet paper",
      "Add wet wipes, hand sanitizer, and tissues",
      "Include feminine hygiene products",
      "Add trash bags for waste disposal",
      "Include disinfectant wipes",
      "Store in waterproof bags",
    ],
  },
  {
    id: "tools",
    name: "Tools & Equipment",
    status: "needs-update",
    lastChecked: Date.now() - 60 * 24 * 60 * 60 * 1000,
    description: "For rescue, repair, and emergency situations",
    quantity: "Multi-tool, knife, pry bar, rope, and basic tools",
    tips: [
      "Include a sturdy multi-tool",
      "Add rope or paracord (50+ feet)",
      "Include a crowbar for extraction",
      "Add a shovel for clearing debris",
      "Keep duct tape and plastic sheeting",
      "Include work gloves and safety glasses",
      "Test tools annually for functionality",
    ],
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showGuide, setShowGuide] = useState(false)

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

  const toggleExpandedItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
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
      <DialogContent className="bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-700/60 text-white max-w-2xl w-[92vw] max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeInScale">
        <DialogHeader className="shrink-0 p-6 border-b border-slate-700/50 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-4 text-xl sm:text-2xl font-bold">
            <div className="w-12 h-12 bg-linear-to-tr from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            Emergency Kit Tracker
          </DialogTitle>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-3 py-1 text-sm bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition flex items-center gap-2"
          >
            <Info className="w-4 h-4" />
            {showGuide ? "Tracker" : "Guide"}
          </button>
        </DialogHeader>

        <div className="flex-1 p-6 space-y-5 overflow-y-auto scrollbar-hide">
          {!showGuide ? (
            <>
              {/* Tracker View */}
              <p className="text-slate-300 leading-relaxed text-sm">
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
                    <div key={item.id} className="bg-slate-800/40 backdrop-blur rounded-lg border border-slate-700/50">
                      <div
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition rounded-t-lg"
                        onClick={() => toggleExpandedItem(item.id)}
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-300">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                          {expandedItems.has(item.id) ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {expandedItems.has(item.id) && (
                        <div className="p-3 border-t border-slate-700/50 bg-slate-800/20 space-y-3 rounded-b-lg">
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Description</p>
                            <p className="text-sm text-slate-300">{item.description}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Recommended Quantity</p>
                            <p className="text-sm text-slate-300">{item.quantity}</p>
                          </div>

                          {item.tips && item.tips.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Tips</p>
                              <ul className="space-y-1">
                                {item.tips.map((tip, idx) => (
                                  <li key={idx} className="text-sm text-slate-400 flex gap-2">
                                    <span className="text-blue-400 shrink-0">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="pt-2">
                            <p className="text-xs text-slate-500 mb-2">Last checked: {getTimeAgo(item.lastChecked)}</p>
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
                        </div>
                      )}
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

              <button
                onClick={resetAllData}
                className="w-full text-xs px-3 py-2 rounded bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 transition"
              >
                Reset to defaults
              </button>
            </>
          ) : (
            <>
              {/* Guide View */}
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-300">
                    📋 This guide provides detailed information about each emergency kit item, recommended quantities,
                    and helpful tips for preparation.
                  </p>
                </div>

                {data.items.map((item) => (
                  <div key={item.id} className="bg-slate-800/40 backdrop-blur rounded-lg border border-slate-700/50 p-4">
                    <div className="mb-3">
                      <h3 className="text-base font-semibold text-blue-400">{item.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                    </div>

                    <div className="mb-3 p-3 bg-slate-900/50 rounded border border-slate-700/30">
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Recommended Quantity</p>
                      <p className="text-sm text-slate-200">{item.quantity}</p>
                    </div>

                    {item.tips && item.tips.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Key Tips & Guidelines</p>
                        <ul className="space-y-2">
                          {item.tips.map((tip, idx) => (
                            <li key={idx} className="text-sm text-slate-300 flex gap-2">
                              <span className="text-green-400 shrink-0 font-bold">✓</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-yellow-300 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    General Emergency Preparedness Tips
                  </h3>
                  <ul className="space-y-2">
                    <li className="text-sm text-yellow-200 flex gap-2">
                      <span className="shrink-0">•</span>
                      <span>Review and update your kit every 6 months or after every emergency</span>
                    </li>
                    <li className="text-sm text-yellow-200 flex gap-2">
                      <span className="shrink-0">•</span>
                      <span>Keep your emergency kit in an accessible, known location</span>
                    </li>
                    <li className="text-sm text-yellow-200 flex gap-2">
                      <span className="shrink-0">•</span>
                      <span>Make sure all household members know where the kit is stored</span>
                    </li>
                    <li className="text-sm text-yellow-200 flex gap-2">
                      <span className="shrink-0">•</span>
                      <span>Check expiration dates quarterly on medications and food items</span>
                    </li>
                    <li className="text-sm text-yellow-200 flex gap-2">
                      <span className="shrink-0">•</span>
                      <span>Have multiple kits: home, car, and work/school</span>
                    </li>
                    <li className="text-sm text-yellow-200 flex gap-2">
                      <span className="shrink-0">•</span>
                      <span>Keep important documents in waterproof, portable containers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
