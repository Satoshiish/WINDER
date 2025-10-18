"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { Shield, Eye, EyeOff, Loader2, Cloud, ArrowLeft } from "lucide-react"

export default function ResponderLoginPage() {
  const router = useRouter()
  const { login, loading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(email, password, "responder")
      if (success) {
        router.push("/responder")
      } else {
        setError("Invalid email or password. Please check your credentials.")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with branding */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Cloud className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-semibold text-orange-400">WINDER+</h1>
              <p className="text-xs text-slate-400">Responder Access</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-6 border border-slate-600/30 backdrop-blur-sm shadow-2xl">
          <div className="text-center mb-5">
            <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-orange-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-3">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Responder Login</h2>
            <p className="text-slate-300 mt-1 text-sm">Emergency response team login portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="responder@rescue.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent rounded-xl h-11 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 hover:bg-slate-600/50 rounded-lg"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium h-11 rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200"
              disabled={isLoading || loading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Sign In as Responder
                </>
              )}
            </Button>
          </form>

          {/* Back Button */}
          <div className="mt-5 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Weather App
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">Weather, Index (Heat), Natural Disasters & Emergency Response</p>
        </div>
      </div>
    </div>
  )
}
