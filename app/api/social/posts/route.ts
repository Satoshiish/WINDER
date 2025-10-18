import { type NextRequest, NextResponse } from "next/server"
import { createSocialPost } from "@/lib/social-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userName, userEmail, content, options } = body

    if (!userId || !userName || !userEmail || !content) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await createSocialPost(userId, userName, userEmail, content, options)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, post: result.post })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 })
  }
}
