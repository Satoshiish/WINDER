"use client"

import React, { useState, useRef } from "react"

const EMERGENCY_NUMBERS = [
  { label: "Call 911", number: "911", color: "#ef4444", subtitle: "National emergency hotline" },
  { label: "Call 143", number: "143", color: "#3b82f6", subtitle: "Philippine Red Cross hotline" },
  { label: "Call 117", number: "117", color: "#fb923c", subtitle: "Police and public safety hotline" },
]

export default function EmergencyCallFab() {
  const [showPanel, setShowPanel] = useState(false)
  const [confirmNumber, setConfirmNumber] = useState<string | null>(null)
  const [longPressActive, setLongPressActive] = useState(false)
  const longPressTimer = useRef<number | null>(null)

  function startPress() {
    window.clearTimeout(longPressTimer.current ?? undefined)
    // trigger long-press after 700ms
    longPressTimer.current = window.setTimeout(() => {
      setLongPressActive(true)
      // provide a short vibration if available
      try { navigator.vibrate?.(50) } catch (e) {}
      // open confirm + direct-call shortcut (we still show a tiny confirm)
      setConfirmNumber(EMERGENCY_NUMBERS[0].number)
      setShowPanel(false)
    }, 700)
  }

  function cancelPress() {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    // if longPress already triggered, keep confirm state
    setLongPressActive(false)
  }

  function onTap() {
    // short tap toggles the big quick-call panel
    setShowPanel((s) => !s)
  }

  function onSelectNumber(num: string) {
    setConfirmNumber(num)
    setShowPanel(false)
  }

  function doCall(number: string | null) {
    if (!number) return
    // navigate to tel: link - will open device dialer
    window.location.href = `tel:${number}`
  }

  return (
    <>
      {/* Floating action button */}
      <div
        role="button"
        aria-label="Emergency call button"
        title="Emergency"
        onMouseDown={startPress}
        onTouchStart={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchEnd={cancelPress}
        onClick={onTap}
        style={{
          position: "fixed",
          right: 16,
          bottom: 20,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "linear-gradient(180deg,#ef4444,#dc2626)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: 14,
            padding: 8,
            touchAction: "manipulation",
          }}
        >
          {/* phone icon + label */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5 2h3a2 2 0 0 1 2 1.72c.12.9.38 1.78.78 2.59a2 2 0 0 1-.45 2.11L9.91 9.91a16 16 0 0 0 6 6l.49-.49a2 2 0 0 1 2.11-.45c.81.4 1.69.66 2.59.78A2 2 0 0 1 22 16.92z" fill="white" />
            </svg>
            <div style={{ fontSize: 11, marginTop: 2 }}>Emergency</div>
          </div>
        </div>
      </div>

      {/* Quick-call panel (tap) */}
      {showPanel && (
        <div
          role="dialog"
          aria-label="Emergency options"
          style={{
            position: "fixed",
            right: 12,
            bottom: 96,
            zIndex: 9998,
            width: 320,
            maxWidth: "calc(100% - 32px)",
            borderRadius: 12,
            padding: 12,
            background: "rgba(18,18,20,0.98)",
            color: "#fff",
            boxShadow: "0 10px 30px rgba(2,6,23,0.6)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Emergency Numbers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {EMERGENCY_NUMBERS.map((n) => (
              <button
                key={n.number}
                onClick={() => onSelectNumber(n.number)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: n.color,
                  color: "white",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  fontSize: 15,
                  fontWeight: 700,
                }}
                aria-label={`Call ${n.number}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5 2h3a2 2 0 0 1 2 1.72c.12.9.38 1.78.78 2.59a2 2 0 0 1-.45 2.11L9.91 9.91a16 16 0 0 0 6 6l.49-.49a2 2 0 0 1 2.11-.45c.81.4 1.69.66 2.59.78A2 2 0 0 1 22 16.92z" fill="rgba(255,255,255,0.95)" />
                </svg>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div>{n.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.95, fontWeight: 400 }}>{n.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowPanel(false)}
              style={{ background: "transparent", border: "none", color: "#cbd5e1", padding: 6 }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmNumber && (
        <div
          role="alertdialog"
          aria-label="Confirm call"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            padding: 20,
          }}
        >
          <div style={{ width: "100%", maxWidth: 480, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ background: "#0b1220", padding: 18, color: "white" }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Call {confirmNumber}?</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>Tap Confirm to open your phone dialer.</div>
            </div>
            <div style={{ display: "flex" }}>
              <button
                onClick={() => setConfirmNumber(null)}
                style={{ flex: 1, padding: 16, background: "#111827", color: "#cbd5e1", border: "none" }}
              >
                Cancel
              </button>
              <button
                onClick={() => doCall(confirmNumber)}
                style={{ flex: 1, padding: 16, background: "#ef4444", color: "white", border: "none", fontWeight: 700 }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
