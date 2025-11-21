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
    if (typeof window !== "undefined" && !navigator.onLine) {
      // Offline: queue the SMS for later
      queueSMS(options)
      return { success: false, error: "Queued (offline)" }
    }

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
      // Queue failed send for retry
      queueSMS(options)
      return {
        success: false,
        error: data.error || "Failed to send SMS (queued)",
      }
    }

    return {
      success: true,
      messageId: data.messageId,
    }
  } catch (error) {
    console.error("[v0] SMS service error:", error)
    // On network error, queue for later
    try {
      queueSMS(options)
    } catch (e) {
      console.error("[v0] Failed to queue SMS after error:", e)
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Queue management for offline/resilient SMS sending
const SMS_QUEUE_KEY = "winder-sms-queue"

function getQueuedSMS(): SendSMSOptions[] {
  try {
    const raw = localStorage.getItem(SMS_QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SendSMSOptions[]
  } catch (error) {
    console.error("[v0] Error reading SMS queue:", error)
    return []
  }
}

function setQueuedSMS(queue: SendSMSOptions[]) {
  try {
    localStorage.setItem(SMS_QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error("[v0] Error saving SMS queue:", error)
  }
}

export function queueSMS(options: SendSMSOptions) {
  try {
    const queue = getQueuedSMS()
    queue.push(options)
    setQueuedSMS(queue)
    console.log("[v0] SMS queued. Queue length:", queue.length)
  } catch (error) {
    console.error("[v0] Error queueing SMS:", error)
  }
}

export async function retryQueuedSMS(): Promise<void> {
  try {
    const queue = getQueuedSMS()
    if (queue.length === 0) return

    console.log("[v0] Retrying queued SMS messages:", queue.length)

    const remaining: SendSMSOptions[] = []

    for (const item of queue) {
      try {
        const res = await sendSMS(item)
        if (!res.success) {
          // keep for retry
          remaining.push(item)
        } else {
          console.log("[v0] Queued SMS sent successfully", res.messageId)
        }
      } catch (error) {
        console.error("[v0] Error retrying queued SMS:", error)
        remaining.push(item)
      }
    }

    setQueuedSMS(remaining)
    console.log("[v0] SMS retry complete. Remaining in queue:", remaining.length)
  } catch (error) {
    console.error("[v0] Error during queued SMS retry:", error)
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
