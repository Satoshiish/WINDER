import { type NextRequest, NextResponse } from "next/server"

const PHILSMS_API_TOKEN = process.env.PHILSMS_API_TOKEN
const PHILSMS_API_URL = process.env.PHILSMS_API_URL || "https://app.philsms.com/api/v3/sms/send"
const PHILSMS_SENDER_ID = process.env.PHILSMS_SENDER_ID || "WINDERPLUS"

interface SMSPayload {
  phoneNumber: string
  message: string
  type: "weather" | "risk" | "alert" | "emergency"
}

export async function POST(request: NextRequest) {
  try {
    if (!PHILSMS_API_TOKEN) {
      console.error("[PhilSMS] Missing API token")
      return NextResponse.json({ error: "Missing API token" }, { status: 500 })
    }

    const body: SMSPayload = await request.json()
    const { phoneNumber, message, type } = body

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return NextResponse.json({ error: "Invalid Philippine phone number" }, { status: 400 })
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)

    const payload = {
      sender_id: PHILSMS_SENDER_ID,
      recipients: [formattedPhone],
      message,
    }

    console.log("[PhilSMS] Sending message to", formattedPhone)

    const response = await fetch(PHILSMS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PHILSMS_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const data = await response.json()
    console.log("[PhilSMS] Response:", data)

    if (data.error) {
      console.error("[PhilSMS] API error:", data)
      return NextResponse.json({ error: data.error }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, type, data },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[PhilSMS] Internal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function validatePhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "")
  return (
    (cleaned.startsWith("639") && cleaned.length === 12) ||
    (cleaned.startsWith("09") && cleaned.length === 11)
  )
}

function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, "")
  if (cleaned.startsWith("09")) return "+63" + cleaned.slice(1)
  if (cleaned.startsWith("639")) return "+" + cleaned
  return "+63" + cleaned
}
