"use client"

import React from "react"

interface MetricProps {
  icon?: React.ReactNode
  label?: string
  value: React.ReactNode
  className?: string
}

export function Metric({ icon, label, value, className = "" }: MetricProps) {
  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      {icon}
      <div>
        {label && <div className="text-xs text-muted-foreground">{label}</div>}
        <div className="font-medium">{value}</div>
      </div>
    </div>
  )
}

export default Metric
