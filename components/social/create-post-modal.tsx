"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, MapPin, ChevronDown } from "lucide-react"
import { searchLocations, getLocationByName, OLONGAPO_LOCATIONS } from "@/lib/location-search"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string, options: any) => void
  isLoading?: boolean
}

export function CreatePostModal({ isOpen, onClose, onSubmit, isLoading = false }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [location, setLocation] = useState("")
  const [address, setAddress] = useState("")
  const [postType, setPostType] = useState<"post" | "donation">("post")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [locationSearch, setLocationSearch] = useState("")
  const [filteredLocations, setFilteredLocations] = useState(OLONGAPO_LOCATIONS)

  useEffect(() => {
    if (isOpen) {
      setLocationSearch("")
      setFilteredLocations(OLONGAPO_LOCATIONS)
    }
  }, [isOpen])

  useEffect(() => {
    setFilteredLocations(searchLocations(locationSearch))
  }, [locationSearch])

  const handleSelectLocation = (locationName: string) => {
    const selectedLocation = getLocationByName(locationName)
    if (selectedLocation) {
      setLocation(locationName)
      setLatitude(selectedLocation.lat)
      setLongitude(selectedLocation.lng)
      setLocationSearch("")
      setShowLocationDropdown(false)
    }
  }

  const handleSubmit = () => {
    if (content.trim() && location) {
      onSubmit(content, {
        location_name: location || undefined,
        address: address || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        post_type: postType,
      })
      setContent("")
      setLocation("")
      setAddress("")
      setPostType("post")
      setLatitude(null)
      setLongitude(null)
      setLocationSearch("")
    }
  }

  const handleClose = () => {
    setContent("")
    setLocation("")
    setAddress("")
    setPostType("post")
    setLatitude(null)
    setLongitude(null)
    setLocationSearch("")
    setShowLocationDropdown(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border/50 rounded-lg max-w-md w-full shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
            <h2 className="text-lg font-semibold text-foreground">Share Your Thoughts</h2>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setPostType("post")}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                postType === "post"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Post
            </button>
            <button
              onClick={() => setPostType("donation")}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                postType === "donation" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Donation
            </button>
          </div>

          {/* Text area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === "donation"
                ? "What donation are you offering? (Anonymous)"
                : "What's on your mind? (Anonymous)"
            }
            className="w-full p-3 bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={4}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location</label>

            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Search location in Olongapo..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onFocus={() => setShowLocationDropdown(true)}
                    className="flex-1 bg-muted/50 border-border/50 text-foreground placeholder-muted-foreground pr-8"
                  />
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Dropdown */}
              {showLocationDropdown && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <style>{`
                    div[style*="scrollbarWidth"] {
                      -webkit-scrollbar: none;
                    }
                    div[style*="scrollbarWidth"]::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => handleSelectLocation(loc.name)}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors text-sm text-foreground border-b border-border/20 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>{loc.name}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No locations found</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected location display */}
            {location && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/30 rounded-lg">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{location}</span>
              </div>
            )}

            {/* Manual address input */}
            <Input
              type="text"
              placeholder="Add address (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 bg-muted/50 border-border/50 text-foreground placeholder-muted-foreground"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || !location || isLoading}
              className={
                postType === "donation"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }
            >
              {isLoading ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
