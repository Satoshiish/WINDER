"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { EnhancedPostCard } from "@/components/social/enhanced-post-card"
import { CreatePostModal } from "@/components/social/create-post-modal"
import { PostDetailModal } from "@/components/social/post-detail-modal"
import { LocationFilter } from "@/components/social/location-filter"
import { getSocialFeed, createSocialPost } from "@/lib/social-db"
import { Plus, AlertCircle } from "lucide-react"

interface Post {
  id: number
  content: string
  image_url?: string
  location_name?: string
  post_type?: "post" | "donation"
  comments_count: number
  created_at: string
  weather_condition?: string
  weather_temperature?: number
  weather_risk_level?: "low" | "medium" | "high"
  user_name?: string
  user_email?: string
  likes_count?: number
  shares_count?: number
}

interface InlineFeedProps {
  onClose?: () => void
}

export function InlineFeed({ onClose }: InlineFeedProps) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState("All Areas")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isPostDetailOpen, setIsPostDetailOpen] = useState(false)
  const [currentWeather, setCurrentWeather] = useState({
    location: "Current Location",
    temperature: 28,
    condition: "Partly Cloudy",
    humidity: 75,
    windSpeed: 15,
    riskLevel: "medium" as const,
  })

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
    setIsCreating(true)

    try {
      const result = await createSocialPost(content, options)

      if (result.success && result.post) {
        setPosts([result.post, ...posts])
        setIsModalOpen(false)
      } else {
        console.error("Failed to create post:", result.error)
      }
    } catch (error) {
      console.error("Error in handleCreatePost:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleComment = (postId: number) => {
    const post = posts.find((p) => p.id === postId)
    if (post) {
      setSelectedPost(post)
      setIsPostDetailOpen(true)
    }
  }

  const handleReport = async (postId: number) => {
    console.log("Report post:", postId)
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto scrollbar-hidden">
      {/* Header Section */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
          Community Updates
        </h2>

        <div className="flex items-center justify-between">
          <LocationFilter
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            availableLocations={availableLocations}
          />
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white h-8 px-3 text-sm"
          >
            <Plus className="w-4 h-4" />
            Post
          </Button>
        </div>
      </div>

      {/* Feed Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30 backdrop-blur-sm">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400">No posts in this area yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <EnhancedPostCard
              key={post.id}
              id={post.id}
              content={post.content}
              location={post.location_name || "Unknown Location"}
              postType={post.post_type || "post"}
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
              commentsCount={post.comments_count}
              createdAt={post.created_at}
              onComment={handleComment}
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
        isLoading={isCreating}
      />

      {selectedPost && (
        <PostDetailModal
          isOpen={isPostDetailOpen}
          onClose={() => {
            setIsPostDetailOpen(false)
            setSelectedPost(null)
          }}
          post={{
            id: selectedPost.id,
            user_name: selectedPost.user_name || "Anonymous",
            user_email: selectedPost.user_email || "",
            content: selectedPost.content,
            image_url: selectedPost.image_url,
            location_name: selectedPost.location_name,
            likes_count: selectedPost.likes_count || 0,
            comments_count: selectedPost.comments_count,
            shares_count: 0,
            created_at: selectedPost.created_at,
            user_liked: false,
          }}
          currentUserId={user?.id || 0}
          currentUserName={user?.email?.split("@")[0] || "User"}
          currentUserEmail={user?.email || ""}
          isOwnPost={false}
        />
      )}
    </div>
  )
}
