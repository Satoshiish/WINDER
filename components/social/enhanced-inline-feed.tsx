"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { EnhancedPostCard } from "@/components/social/enhanced-post-card"
import { CreatePostModal } from "@/components/social/create-post-modal"
import { LocationFilter } from "@/components/social/location-filter"
import { getSocialFeed, createSocialPost, likePost, unlikePost } from "@/lib/social-db"
import { Plus, AlertCircle } from "lucide-react"

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
  weather_condition?: string
  weather_temperature?: number
  weather_risk_level?: "low" | "medium" | "high"
}

interface EnhancedInlineFeedProps {
  onClose?: () => void
}

export function EnhancedInlineFeed({ onClose }: EnhancedInlineFeedProps) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState("All Areas")

  const availableLocations = ["All Areas", "Manila", "Quezon City", "Makati", "Pasig", "Caloocan"]

  useEffect(() => {
    loadFeed()
  }, [selectedLocation])

  const loadFeed = async () => {
    setIsLoading(true)
    const feedPosts = await getSocialFeed(20, 0)
    const filteredPosts =
      selectedLocation === "All Areas" ? feedPosts : feedPosts.filter((p) => p.location_name === selectedLocation)
    setPosts(filteredPosts)
    setIsLoading(false)
  }

  const handleCreatePost = async (content: string, options: any) => {
    if (!user) return

    setIsCreating(true)
    const result = await createSocialPost(Number.parseInt(user.id), user.name, user.email, content, options)

    if (result.success && result.post) {
      setPosts([result.post, ...posts])
      setIsModalOpen(false)
    }
    setIsCreating(false)
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

    loadFeed()
  }

  const handleReport = async (postId: number) => {
    // TODO: Implement report functionality
    console.log("Report post:", postId)
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
            Community Updates
          </h2>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white h-8 px-3 text-sm"
          >
            <Plus className="w-4 h-4" />
            Post
          </Button>
        </div>

        {/* Location Filter */}
        <LocationFilter
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          availableLocations={availableLocations}
        />
      </div>

      {/* Feed Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/30">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400">No posts in this area yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <EnhancedPostCard
              key={post.id}
              id={post.id}
              userName={post.user_name}
              userEmail={post.user_email}
              content={post.content}
              location={post.location_name || "Unknown Location"}
              weather={
                post.weather_condition
                  ? {
                      condition: post.weather_condition,
                      temperature: post.weather_temperature || 0,
                      riskLevel: post.weather_risk_level || "low",
                    }
                  : undefined
              }
              imageUrl={post.image_url}
              likesCount={post.likes_count}
              commentsCount={post.comments_count}
              sharesCount={post.shares_count}
              createdAt={post.created_at}
              userLiked={post.user_liked}
              onLike={handleLike}
              onComment={() => {}}
              onShare={() => {}}
              onReport={handleReport}
              onMore={() => {}}
            />
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
        userName={user?.name || "User"}
        isLoading={isCreating}
      />
    </div>
  )
}