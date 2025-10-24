"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Flag, Send } from "lucide-react"
import { getPostComments, addComment } from "@/lib/social-db"
import { formatDistanceToNow } from "date-fns"
import { CommentsSectionSkeleton } from "@/components/skeletons/social-skeleton"

interface Comment {
  id: number
  content: string
  created_at: string
}

interface CommentsSectionProps {
  postId: number
  currentUserId: number
  currentUserName: string
  currentUserEmail: string
  onCommentAdded?: () => void
}

export function CommentsSection({
  postId,
  currentUserId,
  currentUserName,
  currentUserEmail,
  onCommentAdded,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    setIsLoading(true)
    const fetchedComments = await getPostComments(postId)
    setComments(fetchedComments)
    setIsLoading(false)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    const optimisticTimestamp = new Date().toISOString()
    const result = await addComment(postId, newComment)

    if (result.success && result.comment) {
      const commentToAdd = {
        ...result.comment,
        created_at: optimisticTimestamp,
      } as Comment
      console.log("[v0] Comment added - returned timestamp:", result.comment.created_at, "using:", optimisticTimestamp)
      setComments([commentToAdd, ...comments])
      setNewComment("")
      onCommentAdded?.()
    }
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {currentUserName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleAddComment()
              }
            }}
          />
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
            size="sm"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "..." : "Post"}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <CommentsSectionSkeleton />
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                C
              </div>
              <div className="flex-1 bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-white">Community Member</h4>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-2">{comment.content}</p>
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-slate-400 hover:text-slate-300">
                  <Flag className="w-3 h-3" />
                  Report
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
