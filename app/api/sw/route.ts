import { NextResponse } from "next/server"

export async function GET() {
  const serviceWorkerContent = `
const CACHE_NAME = "winder-plus-v1"
const urlsToCache = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png"]

let notificationQueue = []

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

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: Math.random().toString(36).substr(2, 9),
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
        console.error("Failed to show notification:", error)
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
    const { title, message, id, timestamp } = event.data

    // Prevent duplicate notifications within 3 seconds
    const now = Date.now()
    if (timestamp && (now - timestamp) > 10000) {
      console.log("Notification too old, skipping")
      return
    }

    const options = {
      body: message,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      tag: id || "weather-notification",
      renotify: true,
      data: { id, timestamp: now },
      requireInteraction: false
    }

    self.registration.showNotification(title, options)
      .then(() => {
        console.log("Notification shown successfully")
      })
      .catch(error => {
        console.error("Failed to show notification:", error)
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
