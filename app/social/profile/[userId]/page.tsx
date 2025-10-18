"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useParams } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import { ProfileHeader } from "@/components/social/profile-header"
import { PostCard } from "@/components/social/post-card"
import { EditProfileModal } from "@/components/social/edit-profile-modal"
import { getUserProfile, upsertUserProfile, getUserPosts, followUser, unfollowUser } from "@/lib/social-db"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UserProfile {
  id: number
  user_id: number
  bio?: string
  profile_image_url?: string
  cover_image_url?: string
  location?: string
  website_url?: string
  followers_count: number
  following_count: number
  posts_count: number
  is_verified: boolean
  is_public: boolean
}

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

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = Number.parseInt(params.userId as string)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isOwnProfile = user && Number.parseInt(user.id) === userId

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    setIsLoading(true)
    const userProfile = await getUserProfile(userId)
    if (userProfile) {
      setProfile(userProfile)
      const userPosts = await getUserPosts(userId)
      setPosts(userPosts)
    }
    setIsLoading(false)
  }

  const handleEditProfile = async (updatedProfile: any) => {
    if (!user) return

    setIsSaving(true)
    const result = await upsertUserProfile(userId, updatedProfile)

    if (result.success && result.profile) {
      setProfile(result.profile)
      setIsEditModalOpen(false)
    }
    setIsSaving(false)
  }

  const handleFollow = async () => {
    if (!user) return

    if (isFollowing) {
      await unfollowUser(Number.parseInt(user.id), userId)
    } else {
      await followUser(Number.parseInt(user.id), userId)
    }

    setIsFollowing(!isFollowing)
    loadProfile()
  }

  if (isLoading) {
    return (
      <RouteGuard requireAuth loginPath="/login">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </RouteGuard>
    )
  }

  if (!profile) {
    return (
      <RouteGuard requireAuth loginPath="/login">
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <p className="text-center text-slate-500 dark:text-slate-400">Profile not found</p>
          </div>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requireAuth loginPath="/login">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Profile</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Profile Header */}
          <ProfileHeader
            profile={{
              user_name: user?.name || "User",
              bio: profile.bio,
              location: profile.location,
              website_url: profile.website_url,
              profile_image_url: profile.profile_image_url,
              cover_image_url: profile.cover_image_url,
              followers_count: profile.followers_count,
              following_count: profile.following_count,
              posts_count: profile.posts_count,
              is_verified: profile.is_verified,
            }}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            onEditProfile={() => setIsEditModalOpen(true)}
          />

          {/* Posts Section */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Posts</h2>
            {posts.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No posts yet</p>
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
        </div>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={{
            bio: profile.bio,
            location: profile.location,
            website_url: profile.website_url,
          }}
          onSave={handleEditProfile}
          isLoading={isSaving}
        />
      </div>
    </RouteGuard>
  )
}
