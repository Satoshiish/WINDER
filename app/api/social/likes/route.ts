import { type NextRequest, NextResponse } from "next/server"
import { likePost, unlikePost } from "@/lib/social-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, userId, action } = body

    if (!postId || !userId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const success = action === "like" ? await likePost(postId, userId) : await unlikePost(postId, userId)

    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to update like" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating like:", error)
    return NextResponse.json({ success: false, error: "Failed to update like" }, { status: 500 })
  }
}
