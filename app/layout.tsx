import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Manrope } from "next/font/google"
import "./globals.css"

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
  },
  twitter: {
    card: "summary_large_image",
    title: "WINDER+ - Weather, Index (Heat), Natural Disasters & Emergency Response",
    description: "Stay prepared, stay safe. Emergency weather alerts and rescue requests for the Philippines.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#818cf8" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WINDER+",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-sans filipino-pattern">{children}</body>
    </html>
  )
}
