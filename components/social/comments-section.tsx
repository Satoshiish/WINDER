"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, Flag } from "lucide-react"
import { getPostComments, addComment } from "@/lib/social-db"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: number
  user_name: string
  user_email: string
  content: string
  likes_count: number
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
    const result = await addComment(postId, currentUserId, currentUserName, currentUserEmail, newComment)

    if (result.success && result.comment) {
      setComments([result.comment, ...comments])
      setNewComment("")
      onCommentAdded?.()
    }
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
          {currentUserName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
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
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
          >
            {isSubmitting ? "..." : "Post"}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {comment.user_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{comment.user_name}</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{comment.content}</p>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-slate-600 dark:text-slate-400">
                    <Heart className="w-3 h-3" />
                    {comment.likes_count}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-slate-600 dark:text-slate-400">
                    <Flag className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
