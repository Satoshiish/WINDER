"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busy, setBusy] = useState(false)

  // If a `returnTo` param exists, we'll redirect there after completing onboarding
  const returnTo = searchParams.get("returnTo") || "/admin"

  useEffect(() => {
    // If setup-complete cookie is already set, skip and go to returnTo
    try {
      const match = document.cookie.match(/(^|;)\s*setup-complete=1(\s|;|$)/)
      if (match) {
        router.replace(returnTo)
      }
    } catch (e) {
      // ignore
    }
  }, [router, returnTo])

  const finishOnboarding = () => {
    setBusy(true)
    try {
      // Mark setup complete for middleware; cookie lasts 30 days
      document.cookie = `setup-complete=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
      // small delay to ensure cookie is written before navigation
      setTimeout(() => {
        router.replace(returnTo)
      }, 150)
    } catch (e) {
      console.error("Failed to set setup cookie:", e)
      router.replace(returnTo)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-xl bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-md">
        <h1 className="text-2xl font-semibold text-white mb-2">Welcome — Complete your setup</h1>
        <p className="text-slate-300 mb-6">Before accessing the admin dashboard we need to finish a quick setup step.</p>

        <div className="space-y-3">
          <div className="p-4 bg-slate-700/30 rounded-md border border-slate-700 text-sm text-slate-300">
            This onboarding step records that your account has completed initial setup. It's a lightweight
            confirmation used by the app while developing; in production you'd record this in the database.
          </div>

          <div className="flex gap-3">
            <Button onClick={finishOnboarding} disabled={busy} className="bg-blue-600">
              {busy ? "Completing..." : "Complete setup and continue"}
            </Button>
            <Button variant="ghost" onClick={() => router.replace(returnTo)} disabled={busy}>
              Skip and continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
