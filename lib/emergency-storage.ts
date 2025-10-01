export interface EmergencyReport {
  id: string
  userId: string
  userName: string
  userEmail: string
  emergencyType: string
  location: { lat: number; lng: number }
  address: string
  contactNumber: string
  peopleCount: number
  additionalInfo: string
  timestamp: Date | string
  status: "pending" | "in-progress" | "resolved" | "cancelled"
  priority: "critical" | "high" | "medium" | "low"
  assignedTo: string | null
  responseTime: Date | string | null
  notes: Array<{
    id: number
    author: string
    content: string
    timestamp: Date | string
  }>
  deviceInfo: string
  accuracy: number
  deletedAt: Date | string | null
}

const STORAGE_KEY = "winder-emergency-reports"
const RETENTION_DAYS = 30 // One month retention period
const DELETION_GRACE_PERIOD_HOURS = 24 // 24-hour grace period before permanent deletion

/**
 * Clean up reports older than the retention period
 */
export function cleanupOldReports(reports: EmergencyReport[]): EmergencyReport[] {
  const now = new Date()
  const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000

  console.log(`[v0] Starting cleanup check for reports older than ${RETENTION_DAYS} days`)

  const filteredReports = reports.filter((report) => {
    const reportDate = new Date(report.timestamp)
    const ageMs = now.getTime() - reportDate.getTime()
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000))
    const shouldKeep = ageMs < retentionMs

    if (!shouldKeep) {
      console.log(`[v0] Removing report ${report.id} - Age: ${ageDays} days (exceeds ${RETENTION_DAYS} day limit)`)
    }

    return shouldKeep
  })

  console.log(`[v0] Cleanup complete: Kept ${filteredReports.length} of ${reports.length} reports`)

  return filteredReports
}

/**
 * Clean up reports that have been marked for deletion and passed the grace period
 */
export function cleanupDeletedReports(reports: EmergencyReport[]): EmergencyReport[] {
  const now = new Date()
  const gracePeriodMs = DELETION_GRACE_PERIOD_HOURS * 60 * 60 * 1000

  console.log(`[v0] Starting cleanup check for deleted reports past ${DELETION_GRACE_PERIOD_HOURS}-hour grace period`)

  const filteredReports = reports.filter((report) => {
    if (!report.deletedAt) {
      return true // Keep reports not marked for deletion
    }

    const deletedDate = new Date(report.deletedAt)
    const timeSinceDeletion = now.getTime() - deletedDate.getTime()
    const shouldKeep = timeSinceDeletion < gracePeriodMs

    if (!shouldKeep) {
      const hoursAgo = Math.floor(timeSinceDeletion / (60 * 60 * 1000))
      console.log(
        `[v0] Permanently removing report ${report.id} - Deleted ${hoursAgo} hours ago (exceeds ${DELETION_GRACE_PERIOD_HOURS}-hour grace period)`,
      )
    }

    return shouldKeep
  })

  console.log(
    `[v0] Deletion cleanup complete: Kept ${filteredReports.length} of ${reports.length} reports (permanently removed ${reports.length - filteredReports.length})`,
  )

  return filteredReports
}

/**
 * Load emergency reports from localStorage with automatic cleanup
 */
export function loadEmergencyReports(): EmergencyReport[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      console.error("[v0] localStorage is not available")
      return []
    }

    const rawData = localStorage.getItem(STORAGE_KEY)
    if (!rawData) {
      console.log("[v0] No emergency reports found in storage")
      return []
    }

    const storedReports = JSON.parse(rawData) as EmergencyReport[]
    console.log(`[v0] Loaded ${storedReports.length} reports from storage`)

    let cleanedReports = cleanupDeletedReports(storedReports)

    // Clean up old reports automatically
    cleanedReports = cleanupOldReports(cleanedReports)

    // If reports were cleaned up, save the cleaned version
    if (cleanedReports.length !== storedReports.length) {
      console.log(
        `[v0] Auto-cleanup removed ${storedReports.length - cleanedReports.length} reports (old reports + permanently deleted)`,
      )
      saveEmergencyReports(cleanedReports)
    }

    // Sort by timestamp (newest first)
    cleanedReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return cleanedReports
  } catch (error) {
    console.error("[v0] Error loading emergency reports:", error)
    return []
  }
}

/**
 * Save emergency reports to localStorage
 */
export function saveEmergencyReports(reports: EmergencyReport[]): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      console.error("[v0] localStorage is not available for saving")
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))

    // Dispatch custom event for real-time updates
    window.dispatchEvent(
      new CustomEvent("emergency-reports-updated", {
        detail: { count: reports.length },
      }),
    )
  } catch (error) {
    console.error("[v0] Error saving emergency reports:", error)
  }
}

/**
 * Add a new emergency report
 */
export function addEmergencyReport(report: EmergencyReport): void {
  const existingReports = loadEmergencyReports()
  const updatedReports = [report, ...existingReports].slice(0, 100) // Keep last 100 reports
  saveEmergencyReports(updatedReports)
}

/**
 * Update an existing emergency report
 */
export function updateEmergencyReport(reportId: string, updates: Partial<EmergencyReport>): void {
  const reports = loadEmergencyReports()
  const updatedReports = reports.map((report) => (report.id === reportId ? { ...report, ...updates } : report))
  saveEmergencyReports(updatedReports)
}

/**
 * Mark a report for deletion (24-hour grace period before permanent removal)
 */
export function deleteEmergencyReport(reportId: string): void {
  const reports = loadEmergencyReports()
  const updatedReports = reports.map((report) =>
    report.id === reportId ? { ...report, deletedAt: new Date().toISOString() } : report,
  )
  saveEmergencyReports(updatedReports)
  console.log(`[v0] Marked emergency report for deletion: ${reportId} (24-hour grace period)`)
}

/**
 * Undo deletion of a report (restore from deletion queue)
 */
export function undoDeleteEmergencyReport(reportId: string): void {
  const reports = loadEmergencyReports()
  const updatedReports = reports.map((report) => (report.id === reportId ? { ...report, deletedAt: null } : report))
  saveEmergencyReports(updatedReports)
  console.log(`[v0] Restored emergency report from deletion: ${reportId}`)
}

/**
 * Get statistics about emergency reports
 */
export function getEmergencyStats() {
  const reports = loadEmergencyReports()
  const activeReports = reports.filter((r) => !r.deletedAt)

  return {
    total: activeReports.length,
    pending: activeReports.filter((r) => r.status === "pending").length,
    inProgress: activeReports.filter((r) => r.status === "in-progress").length,
    resolved: activeReports.filter((r) => r.status === "resolved").length,
    critical: activeReports.filter((r) => r.priority === "critical").length,
    oldestReport: activeReports.length > 0 ? new Date(activeReports[activeReports.length - 1].timestamp) : null,
    newestReport: activeReports.length > 0 ? new Date(activeReports[0].timestamp) : null,
    markedForDeletion: reports.filter((r) => r.deletedAt).length,
  }
}
