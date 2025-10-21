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

/**
 * Send SMS notification via API
 */
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

/**
 * Get SMS preferences from localStorage
 */
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

/**
 * Save SMS preferences to localStorage
 */
export function saveSMSPreferences(preferences: SMSPreferences): void {
  try {
    localStorage.setItem("winder-sms-preferences", JSON.stringify(preferences))
  } catch (error) {
    console.error("[v0] Error saving SMS preferences:", error)
  }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // E.164 format validation: +1234567890 or variations
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phoneNumber.replace(/\D/g, ""))
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return "+1" + cleaned // Assume US number
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return "+" + cleaned
  }
  return "+" + cleaned
}
