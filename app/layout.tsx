import type React from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Inter } from "next/font/google"
import { Manrope } from "next/font/google"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WeatherProvider } from "@/contexts/weather-context"
import { UserPreferencesProvider } from "@/contexts/user-preferences-context"
import { LocationSharingProvider } from "@/contexts/location-sharing-context"
import { LanguageProvider } from "@/contexts/language-context"
import { AuthProvider } from "@/hooks/use-auth"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "WINDER+ - Weather, Index (Heat), Natural Disasters & Emergency Response",
  description: "Stay prepared, stay safe. Emergency weather alerts and rescue requests for the Philippines.",
  generator: "WINDER+",
  manifest: "/manifest.json",
  keywords: ["weather", "emergency", "rescue", "philippines", "disaster", "preparedness"],
  authors: [{ name: "WINDER+" }],
  creator: "WINDER+",
  publisher: "WINDER+",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://weather-hub-ph.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WINDER+ - Weather, Index (Heat), Natural Disasters & Emergency Response",
    description: "Stay prepared, stay safe. Emergency weather alerts and rescue requests for the Philippines.",
    url: "https://weather-hub-ph.vercel.app",
    siteName: "WINDER+",
    locale: "en_PH",
    type: "website",
    images: [
      {
        url: "/Winder+_OG.png",
        width: 1200,
        height: 630,
        alt: "WINDER+ - Weather and Emergency Response",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WINDER+ - Weather, Index (Heat), Natural Disasters & Emergency Response",
    description: "Stay prepared, stay safe. Emergency weather alerts and rescue requests for the Philippines.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WINDER+",
  },
  icons: {
  icon: [
    { url: "/favicon.ico" },
    { url: "/Winder+_Black-BG.png", type: "image/png" },
  ],
  apple: "/icon-192x192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#818cf8" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Read locale preference from cookies (server-side) and fall back to English.
  // `cookies` can be a function (callable) or an object depending on Next.js/runtime.
  let locale = "en"
  try {
    const cookieStore = typeof cookies === "function" ? cookies() : cookies
    const maybeCookie = cookieStore && typeof cookieStore.get === "function" ? cookieStore.get("NEXT_LOCALE") : (cookieStore?.get?.("NEXT_LOCALE") ?? undefined)
    if (maybeCookie) {
      // `maybeCookie` may be a CookieValue object with `.value` or a plain string
      // Handle both shapes defensively.
      // @ts-ignore -- runtime shape varies across Next.js versions
      locale = typeof maybeCookie === "string" ? maybeCookie : maybeCookie?.value ?? locale
    }
  } catch (err) {
    // If cookies access fails (e.g., running in edge or different runtime), fall back to default
    // Avoid throwing — locale is non-critical
    // eslint-disable-next-line no-console
    console.error("[layout] failed to read NEXT_LOCALE cookie:", err)
    locale = "en"
  }

  // Read theme preference from cookies (server-side) and fall back to 'light'.
  let theme = "light"
  try {
    const cookieStore = typeof cookies === "function" ? cookies() : cookies
    const maybeTheme = cookieStore && typeof cookieStore.get === "function" ? cookieStore.get("theme") : (cookieStore?.get?.("theme") ?? undefined)
    if (maybeTheme) {
      // may be a CookieValue object with `.value` or a plain string
      // @ts-ignore
      theme = typeof maybeTheme === "string" ? maybeTheme : maybeTheme?.value ?? theme
    }
  } catch (err) {
    // ignore and keep default theme
    // eslint-disable-next-line no-console
    console.error("[layout] failed to read theme cookie:", err)
    theme = "light"
  }

  return (
    <html lang={locale} data-theme={theme} className={`antialiased`}>
      <body className={`${inter.className} ${manrope.className} font-sans filipino-pattern`}>
        <ThemeProvider attribute="data-theme" defaultTheme={theme} enableSystem disableTransitionOnChange enableColorScheme={false}>
          <AuthProvider>
            <LanguageProvider>
              <UserPreferencesProvider>
                <WeatherProvider>
                  <LocationSharingProvider>
                    {children}
                    <Toaster />
                  </LocationSharingProvider>
                </WeatherProvider>
              </UserPreferencesProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
