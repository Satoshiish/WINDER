import { type NextRequest, NextResponse } from "next/server"
import { createModerationReport } from "@/lib/moderation-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentType, contentId, reportedById, reason, description } = body

    if (!contentType || !contentId || !reportedById || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await createModerationReport(contentType, contentId, reportedById, reason, description)

    if (!result.success) {
      return NextResponse.json({ success: false, error: "Failed to create report" }, { status: 400 })
    }

    return NextResponse.json({ success: true, report: result.report })
  } catch (error) {
    console.error("Error creating moderation report:", error)
    return NextResponse.json({ success: false, error: "Failed to create report" }, { status: 500 })
  }
}
