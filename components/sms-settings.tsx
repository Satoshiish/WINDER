"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageSquare, Phone, AlertCircle, CheckCircle } from "lucide-react"
import { getSMSPreferences, saveSMSPreferences, validatePhoneNumber, formatPhoneNumber } from "@/services/smsService"

interface SMSSettingsProps {
  onSave?: (preferences: any) => void
}

export function SMSSettings({ onSave }: SMSSettingsProps) {
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [weatherUpdates, setWeatherUpdates] = useState(true)
  const [riskAlerts, setRiskAlerts] = useState(true)
  const [emergencyAlerts, setEmergencyAlerts] = useState(true)
  const [updateFrequency, setUpdateFrequency] = useState<"immediate" | "hourly" | "daily">("immediate")
  const [validationError, setValidationError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load preferences on mount
  useEffect(() => {
    const preferences = getSMSPreferences()
    setSmsEnabled(preferences.enabled)
    setPhoneNumber(preferences.phoneNumber)
    setWeatherUpdates(preferences.weatherUpdates)
    setRiskAlerts(preferences.riskAlerts)
    setEmergencyAlerts(preferences.emergencyAlerts)
    setUpdateFrequency(preferences.updateFrequency)
  }, [])

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhoneNumber(value)
    setValidationError("")
  }

  const handleSave = async () => {
    setValidationError("")
    setSaveSuccess(false)

    // Validate phone number if SMS is enabled
    if (smsEnabled && phoneNumber.trim()) {
      if (!validatePhoneNumber(phoneNumber)) {
        setValidationError("Please enter a valid Philippine phone number (+639939487669 or 09939487669)")
        return
      }
    }

    setIsSaving(true)

    try {
      const preferences = {
        enabled: smsEnabled,
        phoneNumber: smsEnabled ? formatPhoneNumber(phoneNumber) : "",
        weatherUpdates,
        riskAlerts,
        emergencyAlerts,
        updateFrequency,
      }

      saveSMSPreferences(preferences)
      setSaveSuccess(true)

      if (onSave) {
        onSave(preferences)
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      setValidationError("Failed to save preferences. Please try again.")
      console.error("[v0] Error saving SMS preferences:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Offline SMS Notifications</h3>
          <p className="text-sm text-slate-400">Receive weather and risk updates via SMS</p>
        </div>
      </div>

      {/* Enable SMS Toggle */}
      <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-slate-300 font-medium">Enable SMS Notifications</span>
          <p className="text-xs text-slate-500 mt-1">Receive updates even when offline</p>
        </div>
        <Button
          size="sm"
          onClick={() => setSmsEnabled(!smsEnabled)}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            smsEnabled
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
              : "bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 border border-slate-700/60"
          }`}
        >
          {smsEnabled ? "Enabled" : "Disabled"}
        </Button>
      </div>

      {/* Phone Number Input */}
      {smsEnabled && (
        <div className="space-y-3">
          <Label className="text-white font-medium flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Philippine Phone Number
          </Label>
          <Input
            type="tel"
            placeholder="+639939487669 or 09939487669"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            className="bg-slate-800/70 border border-slate-700/60 text-white placeholder:text-slate-500 rounded-xl h-11"
          />
          <p className="text-xs text-slate-400">
            Enter your Philippine phone number in international format (+639XXXXXXXXX) or local format (09XXXXXXXXX).
          </p>
        </div>
      )}

      {/* Notification Preferences */}
      {smsEnabled && (
        <div className="space-y-4">
          <h4 className="text-white font-medium">Notification Types</h4>

          {/* Weather Updates */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-300 text-sm">Weather Updates</span>
            <Button
              size="sm"
              onClick={() => setWeatherUpdates(!weatherUpdates)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                weatherUpdates
                  ? "bg-blue-600/80 text-white"
                  : "bg-slate-700/60 text-slate-300 border border-slate-700/60"
              }`}
            >
              {weatherUpdates ? "On" : "Off"}
            </Button>
          </div>

          {/* Risk Alerts */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-300 text-sm">Risk Alerts</span>
            <Button
              size="sm"
              onClick={() => setRiskAlerts(!riskAlerts)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                riskAlerts ? "bg-blue-600/80 text-white" : "bg-slate-700/60 text-slate-300 border border-slate-700/60"
              }`}
            >
              {riskAlerts ? "On" : "Off"}
            </Button>
          </div>

          {/* Emergency Alerts */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-300 text-sm">Emergency Alerts</span>
            <Button
              size="sm"
              onClick={() => setEmergencyAlerts(!emergencyAlerts)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                emergencyAlerts
                  ? "bg-blue-600/80 text-white"
                  : "bg-slate-700/60 text-slate-300 border border-slate-700/60"
              }`}
            >
              {emergencyAlerts ? "On" : "Off"}
            </Button>
          </div>
        </div>
      )}

      {/* Update Frequency */}
      {smsEnabled && (
        <div className="space-y-3">
          <Label className="text-white font-medium">Update Frequency</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["immediate", "hourly", "daily"] as const).map((freq) => (
              <Button
                key={freq}
                size="sm"
                onClick={() => setUpdateFrequency(freq)}
                className={`rounded-lg font-medium transition-all capitalize ${
                  updateFrequency === freq
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                    : "bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700/60"
                }`}
              >
                {freq}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {validationError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{validationError}</p>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-400">SMS preferences saved successfully</p>
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || (smsEnabled && !phoneNumber.trim())}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-xl h-11 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? "Saving..." : "Save SMS Preferences"}
      </Button>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
        <p className="text-xs text-blue-300">
          Your phone number is stored securely and only used to send weather and risk updates. You can disable SMS
          notifications at any time.
        </p>
      </div>
    </div>
  )
}
