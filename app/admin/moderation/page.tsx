"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import { Button } from "@/components/ui/button"
import { ModerationReportCard } from "@/components/social/moderation-report-card"
import { getModerationReports, updateModerationStatus, getModerationStats } from "@/lib/moderation-db"
import { ArrowLeft, AlertCircle } from "lucide-react"

interface ModerationReport {
  id: number
  content_type: "post" | "comment"
  reason: string
  description?: string
  status: "pending" | "reviewed" | "approved" | "rejected" | "removed"
  created_at: string
}

interface Stats {
  total: number
  pending: number
  reviewed: number
  approved: number
  rejected: number
  removed: number
}

export default function ModerationPage() {
  const { user, hasRole } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0,
    removed: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("pending")

  useEffect(() => {
    if (!hasRole("admin")) {
      router.push("/login")
      return
    }
    loadData()
  }, [filterStatus, hasRole, router])

  const loadData = async () => {
    setIsLoading(true)
    const fetchedReports = await getModerationReports(filterStatus || undefined)
    const fetchedStats = await getModerationStats()
    setReports(fetchedReports)
    setStats(fetchedStats)
    setIsLoading(false)
  }

  const handleApprove = async (reportId: number) => {
    if (!user) return

    const success = await updateModerationStatus(reportId, "approved", Number.parseInt(user.id))
    if (success) {
      loadData()
    }
  }

  const handleReject = async (reportId: number) => {
    if (!user) return

    const success = await updateModerationStatus(reportId, "rejected", Number.parseInt(user.id))
    if (success) {
      loadData()
    }
  }

  const handleRemove = async (reportId: number) => {
    if (!user) return

    const success = await updateModerationStatus(reportId, "removed", Number.parseInt(user.id))
    if (success) {
      loadData()
    }
  }

  return (
    <RouteGuard requireAuth requireRole="admin" loginPath="/login" fallbackPath="/admin">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Content Moderation</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Reports</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">Reviewed</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.reviewed}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.approved}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-700 dark:text-red-400 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">{stats.rejected}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-700 dark:text-gray-400 mb-1">Removed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">{stats.removed}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6">
            {["pending", "reviewed", "approved", "rejected", "removed"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={filterStatus === status ? "bg-blue-500 text-white" : "bg-transparent"}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          {/* Reports List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No reports found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ModerationReportCard
                  key={report.id}
                  report={report}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  )
}
