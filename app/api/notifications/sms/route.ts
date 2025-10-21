import { type NextRequest, NextResponse } from "next/server"

// Twilio configuration - will use environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

interface SMSPayload {
  phoneNumber: string
  message: string
  type: "weather" | "risk" | "alert" | "emergency"
}

export async function POST(request: NextRequest) {
  try {
    // Verify environment variables are set
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return NextResponse.json({ error: "Twilio configuration missing" }, { status: 500 })
    }

    const body: SMSPayload = await request.json()
    const { phoneNumber, message, type } = body

    // Validate phone number format
    if (!phoneNumber || !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\D/g, ""))) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    // Format phone number to E.164 format if needed
    let formattedPhone = phoneNumber
    if (!phoneNumber.startsWith("+")) {
      formattedPhone = "+" + phoneNumber.replace(/\D/g, "")
    }

    // Create Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const params = new URLSearchParams()
    params.append("From", TWILIO_PHONE_NUMBER)
    params.append("To", formattedPhone)
    params.append("Body", message)

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Twilio API error:", data)
      return NextResponse.json({ error: data.message || "Failed to send SMS" }, { status: response.status })
    }

    return NextResponse.json(
      {
        success: true,
        messageId: data.sid,
        type,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] SMS sending error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
