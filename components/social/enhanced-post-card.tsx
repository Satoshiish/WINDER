"use client"

import { useState } from "react"
import { MessageCircle, MoreVertical, MapPin, Cloud, AlertCircle, Flag, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

interface EnhancedPostCardProps {
  id: number
  content: string
  location?: string
  address?: string
  postType?: "post" | "donation"
  weather?: {
    condition: string
    temperature: number
    riskLevel: "low" | "medium" | "high"
  }
  imageUrl?: string
  commentsCount: number
  createdAt: string
  onComment: (postId: number) => void
}

export function EnhancedPostCard({
  id,
  content,
  location,
  address,
  postType = "post",
  weather,
  imageUrl,
  commentsCount,
  createdAt,
  onComment,
}: EnhancedPostCardProps) {
  const [commentCount, setCommentCount] = useState(commentsCount)

  const parseTimestamp = (timestamp: string) => {
    // If timestamp doesn't end with Z, add it to ensure UTC parsing
    const normalizedTimestamp = timestamp.endsWith("Z") ? timestamp : `${timestamp}Z`
    return new Date(normalizedTimestamp)
  }

  const getRiskColor = () => {
    if (!weather) return "text-slate-400"
    switch (weather.riskLevel) {
      case "high":
        return "text-red-400"
      case "medium":
        return "text-yellow-400"
      default:
        return "text-green-400"
    }
  }

  const getPostTypeBadge = () => {
    if (postType === "donation") {
      return {
        bg: "bg-green-500/20",
        border: "border-green-500/30",
        text: "text-green-300",
        label: "Donation",
      }
    }
    return {
      bg: "bg-blue-500/20",
      border: "border-blue-500/30",
      text: "text-blue-300",
      label: "Post",
    }
  }

  const badge = getPostTypeBadge()

  return (
    <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/30 backdrop-blur-sm overflow-hidden hover:border-slate-500/50 transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-600/20">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500">
              <AvatarFallback className="text-white font-bold">A</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Anonymous</span>
                <span className={`text-xs px-2 py-1 rounded border ${badge.bg} ${badge.border} ${badge.text}`}>
                  {badge.label}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(parseTimestamp(createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Location, Address and Weather */}
        <div className="space-y-2 text-sm">
          {location && (
            <div className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>{location}</span>
            </div>
          )}
          {address && (
            <div className="flex items-start gap-1 text-slate-400 ml-1">
              <Navigation className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs">{address}</span>
            </div>
          )}
          {weather && (
            <div className="flex items-center gap-1">
              <Cloud className={`w-4 h-4 ${getRiskColor()}`} />
              <span className={`text-xs ${getRiskColor()}`}>
                {weather.temperature}°C • {weather.condition}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-slate-200 text-sm leading-relaxed mb-3">{content}</p>

        {imageUrl && (
          <div className="mb-3 rounded-lg overflow-hidden bg-slate-900/50 h-48">
            <img src={imageUrl || "/placeholder.svg"} alt="Post content" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Risk Alert */}
        {weather?.riskLevel === "high" && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4" />
            <span>High weather risk in this area - Stay safe!</span>
          </div>
        )}
      </div>

      {/* Footer - Interactions */}
      <div className="px-4 py-3 border-t border-slate-600/20 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onComment(id)}
            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentCount}</span>
          </button>
        </div>
      </div>
    </div>
  )
}