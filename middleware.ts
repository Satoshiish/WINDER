import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes that require special handling
const protectedRoutes = ["/admin", "/dashboard", "/settings"]
const publicRoutes = ["/", "/alerts", "/map", "/reports", "/rescue"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/api/")

  // For now, we'll just add security headers and logging
  // In the future, this could include authentication checks

  console.log(`[Middleware] ${request.method} ${pathname}`)

  // Add security headers
  const response = NextResponse.next()

  // Security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // CSP for weather app
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.open-meteo.com https://openweathermap.org https://*.openweathermap.org https://bfxjidnfgrconxvdvjmh.supabase.co https://*.supabase.co wss://bfxjidnfgrconxvdvjmh.supabase.co; font-src 'self' data:; frame-src https://openweathermap.org https://*.openweathermap.org;",
  )

  // Rate limiting headers (basic implementation)
  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown"
  response.headers.set("X-Client-IP", ip)

  // If it's a protected route, you could add authentication logic here
  if (isProtectedRoute) {
    // For now, just log access to protected routes
    console.log(`[Middleware] Access to protected route: ${pathname}`)

    // Future: Check authentication status
    // const token = request.cookies.get('auth-token')
    // if (!token) {
    //   return NextResponse.redirect(new URL('/login', request.url))
    // }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
