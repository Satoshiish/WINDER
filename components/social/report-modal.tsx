"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  contentType: "post" | "comment"
  contentId: number
  onSubmit: (reason: string, description: string) => void
  isLoading?: boolean
}

export function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  onSubmit,
  isLoading = false,
}: ReportModalProps) {
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason, description)
      setReason("")
      setDescription("")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Report {contentType}</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a reason</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="hate_speech">Hate Speech</option>
              <option value="misinformation">Misinformation</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Additional Details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || isLoading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {isLoading ? "Reporting..." : "Report"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
