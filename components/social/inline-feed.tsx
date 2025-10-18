"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { EnhancedPostCard } from "@/components/social/enhanced-post-card"
import { CreatePostModal } from "@/components/social/create-post-modal"
import { WeatherContextCard } from "@/components/social/weather-context-card"
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
    console.log("Report post:", postId)
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
            Community Updates
          </h2>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white h-9 px-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Post
          </Button>
        </div>

        <div className="pt-2">
          <WeatherContextCard
            location={currentWeather.location}
            temperature={currentWeather.temperature}
            condition={currentWeather.condition}
            humidity={currentWeather.humidity}
            windSpeed={currentWeather.windSpeed}
            riskLevel={currentWeather.riskLevel}
          />
        </div>

        <div className="pt-2">
          <LocationFilter
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            availableLocations={availableLocations}
          />
        </div>
      </div>

      {/* Feed Content Section */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-lg">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full">
                <AlertCircle className="w-12 h-12 text-blue-400" />
              </div>
            </div>
            <p className="text-slate-300 font-medium mb-3">No posts in this area yet</p>
            <p className="text-slate-400 text-sm px-4">
              Be the first to share community updates and weather observations!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
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
  )
}
