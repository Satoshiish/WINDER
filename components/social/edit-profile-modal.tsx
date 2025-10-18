"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: {
    bio?: string
    location?: string
    website_url?: string
  }
  onSave: (profile: any) => void
  isLoading?: boolean
}

export function EditProfileModal({ isOpen, onClose, profile, onSave, isLoading = false }: EditProfileModalProps) {
  const [bio, setBio] = useState(profile.bio || "")
  const [location, setLocation] = useState(profile.location || "")
  const [website, setWebsite] = useState(profile.website_url || "")

  const handleSave = () => {
    onSave({
      bio: bio || undefined,
      location: location || undefined,
      website_url: website || undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Profile</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              maxLength={160}
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{bio.length}/160</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</label>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Your location"
              className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Website</label>
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
