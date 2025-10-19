import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { lat, lon, subscription } = await request.json()

    if (!lat || !lon) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
    }

    const alertsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/weather/alerts?lat=${lat}&lon=${lon}`,
    )

    if (!alertsResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
    }

    const alertsData = await alertsResponse.json()
    const alerts = alertsData.alerts || []

    if (alerts.length > 0) {
      const notificationPromises = alerts.map((alert: any) => {
        const notificationPayload = {
          title: alert.title,
          message: alert.description,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          data: {
            alertId: alert.id,
            severity: alert.severity,
            type: alert.type,
            areas: alert.areas,
            validUntil: alert.validUntil,
          },
        }

        // If subscription is provided, send via push service
        if (subscription) {
          return sendPushNotification(subscription, notificationPayload)
        }

        return Promise.resolve()
      })

      await Promise.all(notificationPromises)
    }

    return NextResponse.json({
      success: true,
      alertsCount: alerts.length,
      alerts: alerts,
    })
  } catch (error) {
    console.error("Notification API error:", error)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}

async function sendPushNotification(subscription: any, payload: any) {
  try {
    // This would typically send to a push service like Firebase Cloud Messaging
    // For now, we'll just log it as the service worker will handle the notification
    console.log("[v0] Push notification prepared:", payload)
    return Promise.resolve()
  } catch (error) {
    console.error("Failed to send push notification:", error)
    return Promise.reject(error)
  }
}
