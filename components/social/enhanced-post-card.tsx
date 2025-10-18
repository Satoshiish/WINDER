"use client"

import { useState } from "react"
import { MessageCircle, MoreVertical, MapPin, Cloud, AlertCircle, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

interface EnhancedPostCardProps {
  id: number
  content: string
  location?: string
  weather?: {
    condition: string
    temperature: number
    riskLevel: "low" | "medium" | "high"
  }
  imageUrl?: string
  commentsCount: number
  createdAt: string
  onComment: (postId: number) => void
  onReport: (postId: number) => void
  onMore: (postId: number) => void
}

export function EnhancedPostCard({
  id,
  content,
  location,
  weather,
  imageUrl,
  commentsCount,
  createdAt,
  onComment,
  onReport,
  onMore,
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
              </div>
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(parseTimestamp(createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onMore(id)}>
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </Button>
        </div>

        {/* Location and Weather */}
        <div className="flex items-center gap-4 text-sm">
          {location && (
            <div className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>{location}</span>
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
        <button
          onClick={() => onReport(id)}
          className="flex items-center gap-1 hover:text-amber-400 transition-colors"
          title="Report post"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
