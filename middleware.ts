import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes that require special handling
const protectedRoutes = ["/admin", "/dashboard", "/settings"]
const publicRoutes = ["/", "/alerts", "/map", "/reports", "/rescue"]

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/api/")

  console.log(`[Middleware] ${request.method} ${pathname}`)

  // Default response to add security headers
  const response = NextResponse.next()

  // Security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Basic CSP
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.open-meteo.com https://openweathermap.org https://*.openweathermap.org https://*.supabase.co wss:; font-src 'self' data:; frame-src https://openweathermap.org https://*.openweathermap.org;",
  )

  // Rate limiting headers (informational)
  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown"
  response.headers.set("X-Client-IP", ip)

  try {
    // Locale redirect: if root path and a preferred locale is present, redirect
    const localeCookie = request.cookies.get("NEXT_LOCALE")?.value
    const acceptLang = request.headers.get("accept-language")
    if (pathname === "/") {
      const preferred = localeCookie || (acceptLang ? acceptLang.split(",")[0].split("-")[0] : "en")
      // If tag is Filipino/Tagalog, redirect to /tl (if you use locale routes)
      if (preferred && preferred.startsWith("tl")) {
        const url = new URL(`/tl${pathname}`, origin)
        return NextResponse.redirect(url)
      }
    }

    // Auth protected routes: check cookie-based token
    if (isProtectedRoute) {
      const token = request.cookies.get("auth-token")?.value
      // If no token, redirect to login preserving return path
      if (!token) {
        const loginUrl = new URL(`/login`, origin)
        loginUrl.searchParams.set("returnTo", pathname)
        return NextResponse.redirect(loginUrl)
      }

      // If token exists but user hasn't completed setup, send to onboarding
      const setupComplete = request.cookies.get("setup-complete")?.value
      if (token && setupComplete !== "1" && !pathname.startsWith("/onboarding")) {
        const onboardingUrl = new URL(`/onboarding`, origin)
        onboardingUrl.searchParams.set("returnTo", pathname)
        return NextResponse.redirect(onboardingUrl)
      }
    }

    // Example: redirect deprecated routes to new ones
    if (pathname.startsWith("/old-reports")) {
      const newUrl = new URL(`/reports${pathname.replace("/old-reports", "")}`, origin)
      return NextResponse.rewrite(newUrl)
    }
  } catch (e) {
    console.error("[Middleware] Error in middleware logic:", e)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
