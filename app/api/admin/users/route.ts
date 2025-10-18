import { type NextRequest, NextResponse } from "next/server"
import { addAdminUser, removeAdminUser, loadAdminUsers } from "@/lib/admin-users-db"

// GET - Load all admin users
export async function GET() {
  try {
    const users = await loadAdminUsers()
    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("Error loading admin users:", error)
    return NextResponse.json({ success: false, error: "Failed to load admin users" }, { status: 500 })
  }
}

// POST - Add new admin user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password } = body

    if (!email || !name || !password) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await addAdminUser(email, name, password)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message, user: result.user })
  } catch (error) {
    console.error("Error adding admin user:", error)
    return NextResponse.json({ success: false, error: "Failed to add admin user" }, { status: 500 })
  }
}

// DELETE - Remove admin user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const result = await removeAdminUser(userId)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    console.error("Error removing admin user:", error)
    return NextResponse.json({ success: false, error: "Failed to remove admin user" }, { status: 500 })
  }
}
