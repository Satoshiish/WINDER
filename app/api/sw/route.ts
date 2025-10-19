import { NextResponse } from "next/server"

export async function GET() {
  const serviceWorkerContent = `
const CACHE_NAME = "winder-plus-v1"
const urlsToCache = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png"]

let notificationQueue = []
let lastNotificationTime = {}

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    }),
  )
})

self.addEventListener("push", (event) => {
  let notificationData = {
    title: "WINDER+ Alert",
    body: "Weather alert from WINDER+",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png"
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge
      }
    } catch (e) {
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  const notificationId = notificationData.title + Date.now()
  
  if (lastNotificationTime[notificationData.title] && Date.now() - lastNotificationTime[notificationData.title] < 5000) {
    console.log("[v0] Duplicate notification prevented:", notificationData.title)
    return
  }
  
  lastNotificationTime[notificationData.title] = Date.now()

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: notificationId,
    },
    actions: [
      {
        action: "explore",
        title: "View Details",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icon-192x192.png",
      },
    ],
    tag: "weather-notification",
    renotify: true,
    requireInteraction: false
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .catch(error => {
        console.error("[v0] Failed to show notification:", error)
        // Queue notification for retry
        notificationQueue.push({title: notificationData.title, options})
      })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Focus existing window if available
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus()
            }
          }
          // Open new window if no existing window
          if (clients.openWindow) {
            return clients.openWindow('/')
          }
        })
    )
  }
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "PUSH_NOTIFICATION") {
    const { title, message, id, timestamp, severity, type } = event.data

    const now = Date.now()
    if (lastNotificationTime[title] && (now - lastNotificationTime[title]) < 5000) {
      console.log("[v0] Duplicate notification prevented:", title)
      return
    }
    
    lastNotificationTime[title] = now

    const options = {
      body: message,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      tag: id || "weather-notification",
      renotify: true,
      data: { id, timestamp: now, severity, type },
      requireInteraction: false
    }

    self.registration.showNotification(title, options)
      .then(() => {
        console.log("[v0] Notification shown successfully:", title)
      })
      .catch(error => {
        console.error("[v0] Failed to show notification:", error)
        // Add to queue for retry
        notificationQueue.push({title, options})
      })
  }
})

self.addEventListener("online", () => {
  if (notificationQueue.length > 0) {
    const queue = [...notificationQueue]
    notificationQueue = []
    
    queue.forEach((notification, index) => {
      setTimeout(() => {
        self.registration.showNotification(notification.title, notification.options)
      }, index * 500)
    })
  }
})
`

  return new NextResponse(serviceWorkerContent, {
    headers: {
      "Content-Type": "application/javascript",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
