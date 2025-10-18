"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/social/post-card"
import { CreatePostModal } from "@/components/social/create-post-modal"
import { getSocialFeed, createSocialPost } from "@/lib/social-db"
import { Plus, ArrowLeft } from "lucide-react"

interface Post {
  id: number
  content: string
  image_url?: string
  location_name?: string
  likes_count: number
  comments_count: number
  post_type: "post" | "donation"
  created_at: string
}

export default function SocialPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [filter, setFilter] = useState<"all" | "post" | "donation">("all")

  useEffect(() => {
    loadFeed()
  }, [filter])

  const loadFeed = async () => {
    setIsLoading(true)
    const postType = filter === "all" ? undefined : filter
    const feedPosts = await getSocialFeed(20, 0, postType as "post" | "donation" | undefined)
    setPosts(feedPosts)
    setIsLoading(false)
  }

  const handleCreatePost = async (content: string, options: any) => {
    console.log("[v0] Creating anonymous post with options:", options)

    setIsCreating(true)

    try {
      const result = await createSocialPost(content, {
        location_name: options?.location_name,
        post_type: options?.post_type || "post",
      })

      console.log("[v0] Create post result:", result)

      if (result.success && result.post) {
        console.log("[v0] Post created successfully:", result.post)
        setPosts([result.post, ...posts])
        setIsModalOpen(false)
      } else {
        console.error("[v0] Failed to create post:", result.error)
      }
    } catch (error) {
      console.error("[v0] Error in handleCreatePost:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Community Feed</h1>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-500 hover:bg-blue-600 text-white">
            <Plus className="w-4 h-4" />
            Post
          </Button>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-4 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("post")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "post"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setFilter("donation")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "donation"
                ? "bg-green-500 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            Donations
          </button>
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
            <p className="text-slate-500 dark:text-slate-400">
              {filter === "all" ? "No posts yet. Be the first to share!" : `No ${filter}s found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={() => {}}
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
        isLoading={isCreating}
      />
    </div>
  )
}
