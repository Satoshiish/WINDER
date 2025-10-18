"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flag, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ModerationReportCardProps {
  report: {
    id: number
    content_type: "post" | "comment"
    reason: string
    description?: string
    status: "pending" | "reviewed" | "approved" | "rejected" | "removed"
    created_at: string
  }
  onApprove?: (reportId: number) => void
  onReject?: (reportId: number) => void
  onRemove?: (reportId: number) => void
}

export function ModerationReportCard({ report, onApprove, onReject, onRemove }: ModerationReportCardProps) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    removed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {report.content_type === "post" ? "Post Report" : "Comment Report"}
              </h3>
              <Badge className={statusColors[report.status]}>{report.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason:</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{report.reason}</p>
      </div>

      {/* Description */}
      {report.description && (
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Details:</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{report.description}</p>
        </div>
      )}

      {/* Actions */}
      {report.status === "pending" && (
        <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 bg-transparent"
            onClick={() => onReject?.(report.id)}
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 bg-transparent"
            onClick={() => onApprove?.(report.id)}
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
            onClick={() => onRemove?.(report.id)}
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </Button>
        </div>
      )}
    </div>
  )
}
