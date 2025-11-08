/**
 * SMS Notification Service
 * Handles sending SMS notifications for weather updates, risks, and alerts
 */

interface SendSMSOptions {
  phoneNumber: string
  message: string
  type: "weather" | "risk" | "alert" | "emergency"
}

interface SMSPreferences {
  enabled: boolean
  phoneNumber: string
  weatherUpdates: boolean
  riskAlerts: boolean
  emergencyAlerts: boolean
  updateFrequency: "immediate" | "hourly" | "daily"
}

export async function sendSMS(options: SendSMSOptions): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    const response = await fetch("/api/notifications/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] SMS send failed:", data)
      return {
        success: false,
        error: data.error || "Failed to send SMS",
      }
    }

    return {
      success: true,
      messageId: data.messageId,
    }
  } catch (error) {
    console.error("[v0] SMS service error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export function getSMSPreferences(): SMSPreferences {
  try {
    const stored = localStorage.getItem("winder-sms-preferences")
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("[v0] Error reading SMS preferences:", error)
  }

  return {
    enabled: false,
    phoneNumber: "",
    weatherUpdates: true,
    riskAlerts: true,
    emergencyAlerts: true,
    updateFrequency: "immediate",
  }
}

export function saveSMSPreferences(preferences: SMSPreferences): void {
  try {
    localStorage.setItem("winder-sms-preferences", JSON.stringify(preferences))
  } catch (error) {
    console.error("[v0] Error saving SMS preferences:", error)
  }
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "")

  if (phoneNumber.startsWith("+63")) {
    return cleaned === "63" + cleaned.slice(2) && cleaned.length === 12 && cleaned.startsWith("639")
  }

  if (phoneNumber.startsWith("0")) {
    return cleaned.length === 11 && cleaned.startsWith("09")
  }

  if (!phoneNumber.includes("+") && !phoneNumber.startsWith("0")) {
    return cleaned.length === 12 && cleaned.startsWith("639")
  }

  return false
}

export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, "")

  if (cleaned.startsWith("09")) {
    return "+63" + cleaned.slice(1)
  }

  if (cleaned.startsWith("639")) {
    return "+" + cleaned
  }

  return "+" + cleaned
}
