import { type NextRequest, NextResponse } from "next/server"
import { addComment } from "@/services/socialService"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, userId, userName, userEmail, content } = body

    if (!postId || !userId || !userName || !userEmail || !content) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await addComment(postId, userId, userName, userEmail, content)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, comment: result.comment })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ success: false, error: "Failed to add comment" }, { status: 500 })
  }
}
