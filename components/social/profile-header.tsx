"use client"

import { Button } from "@/components/ui/button"
import { MapPin, Globe, Heart, Users, FileText } from "lucide-react"

interface ProfileHeaderProps {
  profile: {
    user_name: string
    bio?: string
    location?: string
    website_url?: string
    profile_image_url?: string
    cover_image_url?: string
    followers_count: number
    following_count: number
    posts_count: number
    is_verified: boolean
  }
  isOwnProfile: boolean
  isFollowing?: boolean
  onFollow?: () => void
  onEditProfile?: () => void
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing = false,
  onFollow,
  onEditProfile,
}: ProfileHeaderProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600 relative">
        {profile.cover_image_url && (
          <img src={profile.cover_image_url || "/placeholder.svg"} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6">
        {/* Avatar and Actions */}
        <div className="flex items-end justify-between -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            {profile.user_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex gap-2">
            {isOwnProfile ? (
              <Button onClick={onEditProfile} className="bg-blue-500 hover:bg-blue-600 text-white">
                Edit Profile
              </Button>
            ) : (
              <Button
                onClick={onFollow}
                className={isFollowing ? "bg-slate-300 text-slate-900" : "bg-blue-500 hover:bg-blue-600 text-white"}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>

        {/* Name and Verification */}
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.user_name}</h1>
          {profile.is_verified && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
              ✓
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && <p className="text-slate-600 dark:text-slate-400 mb-4">{profile.bio}</p>}

        {/* Location and Website */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
          {profile.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {profile.location}
            </div>
          )}
          {profile.website_url && (
            <a
              href={profile.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-500"
            >
              <Globe className="w-4 h-4" />
              Website
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.posts_count}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
              <FileText className="w-3 h-3" />
              Posts
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.followers_count}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              Followers
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.following_count}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3" />
              Following
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
