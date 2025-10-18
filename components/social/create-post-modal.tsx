"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, ImageIcon, MapPin } from "lucide-react"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string, options: any) => void
  userName: string
  isLoading?: boolean
}

export function CreatePostModal({ isOpen, onClose, onSubmit, userName, isLoading = false }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [privacyLevel, setPrivacyLevel] = useState<"public" | "friends" | "private">("public")
  const [location, setLocation] = useState("")

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content, {
        privacy_level: privacyLevel,
        location_name: location || undefined,
      })
      setContent("")
      setLocation("")
      setPrivacyLevel("public")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Post</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{userName}</p>
              <div className="flex gap-2">
                <select
                  value={privacyLevel}
                  onChange={(e) => setPrivacyLevel(e.target.value as any)}
                  className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded px-2 py-1"
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>

          {/* Text area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
          />

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Add location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-600 dark:text-slate-400">
                <ImageIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isLoading ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
