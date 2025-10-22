import { type NextRequest, NextResponse } from "next/server"

const CLICKSEND_API_USERNAME = process.env.CLICKSEND_API_USERNAME
const CLICKSEND_API_KEY = process.env.CLICKSEND_API_KEY

interface SMSPayload {
  phoneNumber: string
  message: string
  type: "weather" | "risk" | "alert" | "emergency"
}

export async function POST(request: NextRequest) {
  try {
    if (!CLICKSEND_API_USERNAME || !CLICKSEND_API_KEY) {
      console.error("[v0] ClickSend configuration missing")
      return NextResponse.json({ error: "ClickSend configuration missing" }, { status: 500 })
    }

    const body: SMSPayload = await request.json()
    const { phoneNumber, message, type } = body

    console.log("[v0] SMS Request - Phone:", phoneNumber, "Type:", type)

    // Validate phone number format
    if (!phoneNumber || !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\D/g, ""))) {
      console.error("[v0] Invalid phone number format:", phoneNumber)
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      console.error("[v0] Empty message")
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    let formattedPhone = phoneNumber
    if (!phoneNumber.startsWith("+")) {
      // Remove all non-digits and add + prefix
      const cleaned = phoneNumber.replace(/\D/g, "")
      formattedPhone = "+" + cleaned
    }

    console.log("[v0] Formatted phone number:", formattedPhone)
    console.log("[v0] Message preview:", message.substring(0, 50) + "...")

    const clicksendUrl = "https://rest.clicksend.com/v3/sms/send"

    const payload = {
      messages: [
        {
          to: formattedPhone,
          body: message,
        },
      ],
    }

    const authHeader = `Basic ${Buffer.from(`${CLICKSEND_API_USERNAME}:${CLICKSEND_API_KEY}`).toString("base64")}`

    console.log("[v0] Sending SMS to ClickSend API...")

    const response = await fetch(clicksendUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] ClickSend API error:", data)
      return NextResponse.json({ error: data.message || "Failed to send SMS" }, { status: response.status })
    }

    console.log("[v0] SMS sent successfully via ClickSend")
    console.log("[v0] Response data:", data)

    return NextResponse.json(
      {
        success: true,
        messageId: data.data?.messages?.[0]?.message_id || "unknown",
        type,
        status: "sent",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] SMS sending error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
