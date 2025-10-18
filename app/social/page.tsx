"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/social/post-card"
import { CreatePostModal } from "@/components/social/create-post-modal"
import { getSocialFeed, createSocialPost, likePost, unlikePost } from "@/lib/social-db"
import { Plus, ArrowLeft } from "lucide-react"

interface Post {
  id: number
  user_name: string
  user_email: string
  content: string
  image_url?: string
  location_name?: string
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  user_liked?: boolean
}

export default function SocialPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadFeed()
  }, [])

  const loadFeed = async () => {
    setIsLoading(true)
    const feedPosts = await getSocialFeed(20, 0)
    setPosts(feedPosts)
    setIsLoading(false)
  }

  const handleCreatePost = async (content: string, options: any) => {
  if (!user) return

  console.log('Creating post with user:', user)
  console.log('Content:', content)
  console.log('Options:', options)

  setIsCreating(true)
  
  try {
    // Convert user.id to number if it's a string
    const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
    
    console.log('Parsed user ID:', userId)
    
    const result = await createSocialPost(userId, user.name, user.email, content, options)

    console.log('Create post result:', result)

    if (result.success && result.post) {
      console.log('Post created successfully, adding to state')
      setPosts([result.post, ...posts])
      setIsModalOpen(false)
    } else {
      console.error('Failed to create post:', result.error)
      // You might want to show an error toast here
    }
  } catch (error) {
    console.error('Error in handleCreatePost:', error)
  } finally {
    setIsCreating(false)
  }
}

  const handleLike = async (postId: number) => {
    if (!user) return

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    if (post.user_liked) {
      await unlikePost(postId, Number.parseInt(user.id))
    } else {
      await likePost(postId, Number.parseInt(user.id))
    }

    // Reload feed to get updated counts
    loadFeed()
  }

  return (
    <RouteGuard requireAuth loginPath="/login">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Social Feed</h1>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="w-4 h-4" />
              Post
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onComment={() => {}}
                  onShare={() => {}}
                  onMore={() => {}}
                />
              ))}
            </div>
          )}
        </div>

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreatePost}
          userName={user?.name || "User"}
          isLoading={isCreating}
        />
      </div>
    </RouteGuard>
  )
}
