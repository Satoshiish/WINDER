"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Copy, Check } from "lucide-react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  postId: number
  onShare?: (message?: string) => void
}

export function ShareModal({ isOpen, onClose, postId, onShare }: ShareModalProps) {
  const [shareMessage, setShareMessage] = useState("")
  const [copied, setCopied] = useState(false)

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/social?post=${postId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    onShare?.(shareMessage)
    setShareMessage("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Share Post</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Share Message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Add a message (optional)
            </label>
            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="What do you think about this?"
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Copy Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Share Link</label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm"
              />
              <Button onClick={handleCopyLink} variant="outline" size="sm" className="gap-2 bg-transparent">
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleShare} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
