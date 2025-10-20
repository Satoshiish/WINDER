"use client"
import { MessageCircle, Share2, MoreVertical, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

interface PostCardProps {
  post: {
    id: number
    user_name: string
    user_email: string
    content: string
    image_url?: string
    location_name?: string
    comments_count: number
    created_at: string
  }
  onComment?: (postId: number) => void
  onShare?: (postId: number) => void
  onMore?: (postId: number) => void
}

export function PostCard({ post, onComment, onShare, onMore }: PostCardProps) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-all hover:bg-slate-800/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {post.user_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-100">{post.user_name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200"
          onClick={() => onMore?.(post.id)}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Location */}
      {post.location_name && (
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          <MapPin className="w-3 h-3" />
          {post.location_name}
        </div>
      )}

      {/* Content */}
      <p className="text-slate-300 mb-3 text-sm leading-relaxed">{post.content}</p>

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url || "/placeholder.svg"}
          alt="Post content"
          className="w-full rounded-lg mb-3 max-h-96 object-cover border border-slate-600/30"
        />
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-3 border-b border-slate-700/50">
        <span>{post.comments_count} comments</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
          onClick={() => onComment?.(post.id)}
        >
          <MessageCircle className="w-4 h-4" />
          Comment
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
          onClick={() => onShare?.(post.id)}
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </div>
  )
}
