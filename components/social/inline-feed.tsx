"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EnhancedPostCard } from "@/components/social/enhanced-post-card"
import { CreatePostModal } from "@/components/social/create-post-modal"
import { PostDetailModal } from "@/components/social/post-detail-modal"
import { getSocialFeed, createSocialPost } from "@/services/socialService"
import { Plus, AlertCircle, MapPin, ChevronDown } from "lucide-react"
import { SocialFeedSkeleton } from "@/components/skeletons/social-skeleton"

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

// Olongapo City barangays data
const OLONGAPO_LOCATIONS = [
  { name: "Sta Rita", city: "Olongapo City", lat: 14.853, lng: 120.2982 },
  { name: "Gordon Heights", city: "Olongapo City", lat: 14.8156, lng: 120.2689 },
  { name: "East Bajac-Bajac", city: "Olongapo City", lat: 14.8347, lng: 120.2892 },
  { name: "West Bajac-Bajac", city: "Olongapo City", lat: 14.8289, lng: 120.2756 },
  { name: "East Tapinac", city: "Olongapo City", lat: 14.8423, lng: 120.2945 },
  { name: "West Tapinac", city: "Olongapo City", lat: 14.8378, lng: 120.2834 },
  { name: "Barretto", city: "Olongapo City", lat: 14.7989, lng: 120.2567 },
  { name: "New Cabalan", city: "Olongapo City", lat: 14.8512, lng: 120.2978 },
  { name: "Old Cabalan", city: "Olongapo City", lat: 14.8512, lng: 120.3045 },
  { name: "Pag-asa", city: "Olongapo City", lat: 14.8534, lng: 120.3012 },
  { name: "Kalaklan", city: "Olongapo City", lat: 14.8623, lng: 120.3089 },
  { name: "Mabayuan", city: "Olongapo City", lat: 14.8712, lng: 120.3156 },
  { name: "New Kalalake", city: "Olongapo City", lat: 14.8401, lng: 120.2912 },
  { name: "Old Kalalake", city: "Olongapo City", lat: 14.8367, lng: 120.2867 },
  { name: "New Ilalim", city: "Olongapo City", lat: 14.8334, lng: 120.2823 },
  { name: "Old Ilalim", city: "Olongapo City", lat: 14.8301, lng: 120.2789 },
  { name: "Asinan Poblacion", city: "Olongapo City", lat: 14.8234, lng: 120.2712 },
]

function searchLocations(query: string): typeof OLONGAPO_LOCATIONS {
  if (!query.trim()) return OLONGAPO_LOCATIONS
  const lowerQuery = query.toLowerCase()
  return OLONGAPO_LOCATIONS.filter((location) => location.name.toLowerCase().includes(lowerQuery))
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
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [locationSearch, setLocationSearch] = useState("")
  const [filteredLocations, setFilteredLocations] = useState(OLONGAPO_LOCATIONS)

  useEffect(() => {
    loadFeed()
  }, [selectedLocation])

  useEffect(() => {
    setFilteredLocations(searchLocations(locationSearch))
  }, [locationSearch])

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

  const handleSelectLocation = (locationName: string) => {
    setSelectedLocation(locationName)
    setLocationSearch("")
    setShowLocationDropdown(false)
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
          {/* Location Filter with Dropdown */}
          <div className="relative flex-1 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search location in Olongapo..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onFocus={() => setShowLocationDropdown(true)}
                  className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 pr-8"
                />
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Location Dropdown */}
            {showLocationDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                <div className="p-2 border-b border-slate-600">
                  <button
                    onClick={() => handleSelectLocation("All Areas")}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                      selectedLocation === "All Areas" 
                        ? "bg-blue-500 text-white" 
                        : "text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>All Areas</span>
                    </div>
                  </button>
                </div>
                <div className="p-1">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => handleSelectLocation(loc.name)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                          selectedLocation === loc.name 
                            ? "bg-blue-500 text-white" 
                            : "text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span>{loc.name}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-400">No locations found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white h-8 px-3 text-sm"
          >
            <Plus className="w-4 h-4" />
            Post
          </Button>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && selectedLocation !== "All Areas" && (
          <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="text-sm text-white">Showing posts from: {selectedLocation}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-slate-400 hover:text-white"
              onClick={() => setSelectedLocation("All Areas")}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Feed Content */}
      {isLoading ? (
        <SocialFeedSkeleton />
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30 backdrop-blur-sm">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400">
            {selectedLocation === "All Areas" 
              ? "No posts yet. Be the first to share!" 
              : `No posts in ${selectedLocation} yet. Be the first to share in this area!`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <EnhancedPostCard
              key={post.id}
              id={post.id}
              content={post.content}
              location={post.location_name || "Unknown Location"}
              address={post.address} // Add this line
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