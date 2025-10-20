"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, MessageCircle, Share2, MoreVertical } from "lucide-react"
import { CommentsSection } from "./comments-section"
import { ShareModal } from "./share-modal"
import { PostOptionsMenu } from "./post-options-menu"
import { formatDistanceToNow } from "date-fns"

interface PostDetailModalProps {
  isOpen: boolean
  onClose: () => void
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
  currentUserId: number
  currentUserName: string
  currentUserEmail: string
  isOwnPost: boolean
  onShare?: (message?: string) => void
  onDelete?: () => void
}

export function PostDetailModal({
  isOpen,
  onClose,
  post,
  currentUserId,
  currentUserName,
  currentUserEmail,
  isOwnPost,
  onShare,
  onDelete,
}: PostDetailModalProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-slate-700/50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/95 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white">Post Details</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Post Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {post.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{post.user_name}</h3>
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200"
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            {/* Post Content */}
            <div>
              <p className="text-slate-300 mb-3">{post.content}</p>
              {post.image_url && (
                <img
                  src={post.image_url || "/placeholder.svg"}
                  alt="Post content"
                  className="w-full rounded-lg max-h-96 object-cover border border-slate-600/30"
                />
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-slate-400 py-3 border-y border-slate-700/50">
              <span>{post.comments_count} comments</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 py-2">
              <Button variant="ghost" className="flex-1 gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10">
                <MessageCircle className="w-4 h-4" />
                Comment
              </Button>
              <Button
                variant="ghost"
                className="flex-1 gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                onClick={() => setShowShareModal(true)}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>

            {/* Comments Section */}
            <div className="pt-4 border-t border-slate-700/50">
              <CommentsSection
                postId={post.id}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                currentUserEmail={currentUserEmail}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} postId={post.id} onShare={onShare} />

      {/* Options Menu */}
      <PostOptionsMenu
        isOpen={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        isOwnPost={isOwnPost}
        onDelete={onDelete}
      />
    </>
  )
}
