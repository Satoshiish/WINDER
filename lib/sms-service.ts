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
 * Validate Philippine phone number format
 * Updated to only accept Philippine numbers in +639XXXXXXXXX or 09XXXXXXXXX format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters for validation
  const cleaned = phoneNumber.replace(/\D/g, "")

  // Philippine numbers: 63 (country code) + 9 (mobile prefix) + 9 digits = 12 digits total
  // OR local format: 09 + 9 digits = 11 digits total

  // Check if it's international format: +639XXXXXXXXX (63 + 9 + 9 digits)
  if (phoneNumber.startsWith("+63")) {
    return cleaned === "63" + cleaned.slice(2) && cleaned.length === 12 && cleaned.startsWith("639")
  }

  // Check if it's local format: 09XXXXXXXXX (0 + 9 + 9 digits)
  if (phoneNumber.startsWith("0")) {
    return cleaned.length === 11 && cleaned.startsWith("09")
  }

  // Check if it's just digits in international format without +: 639XXXXXXXXX
  if (!phoneNumber.includes("+") && !phoneNumber.startsWith("0")) {
    return cleaned.length === 12 && cleaned.startsWith("639")
  }

  return false
}

/**
 * Format Philippine phone number to E.164 format (+639XXXXXXXXX)
 * Updated to convert both +639... and 09... formats to E.164
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "")

  // If it's local format (09...), convert to international (+639...)
  if (cleaned.startsWith("09")) {
    return "+63" + cleaned.slice(1)
  }

  // If it's already international format (639...), just add +
  if (cleaned.startsWith("639")) {
    return "+" + cleaned
  }

  // Fallback: just add + prefix
  return "+" + cleaned
}
