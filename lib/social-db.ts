import { supabase } from "./supabase-client"

export interface SocialPost {
  id: number
  user_id: number
  user_name: string
  user_email: string
  content: string
  image_url?: string
  privacy_level: "public" | "friends" | "private"
  location_name?: string
  latitude?: number
  longitude?: number
  likes_count: number
  comments_count: number
  shares_count: number
  is_pinned: boolean
  status: "active" | "archived" | "deleted"
  created_at: string
  updated_at: string
  user_liked?: boolean
}

export interface SocialComment {
  id: number
  post_id: number
  user_id: number
  user_name: string
  user_email: string
  content: string
  likes_count: number
  status: "active" | "deleted" | "flagged"
  created_at: string
  updated_at: string
}

export interface SocialUserProfile {
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
  created_at: string
  updated_at: string
}

// Get all public posts for feed
export async function getSocialFeed(limit = 20, offset = 0): Promise<SocialPost[]> {
  try {
    const { data, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("privacy_level", "public")
      .eq("status", "active")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching social feed:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching social feed:", error)
    return []
  }
}

// Get user's posts
export async function getUserPosts(userId: number, limit = 20): Promise<SocialPost[]> {
  try {
    const { data, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching user posts:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching user posts:", error)
    return []
  }
}

// Create a new post
// Create a new post
// Create a new post
export async function createSocialPost(
  userId: number,
  userName: string,
  userEmail: string,
  content: string,
  options?: {
    image_url?: string
    privacy_level?: "public" | "friends" | "private"
    location_name?: string
    latitude?: number
    longitude?: number
  },
): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
  try {
    console.log('🎯 Supabase create post called with:', {
      userId,
      userName,
      userEmail,
      content,
      options
    })

    // Validate required fields
    if (!userId || !userName || !userEmail || !content) {
      console.error('❌ Missing required fields:', { userId, userName, userEmail, content })
      return { success: false, error: 'Missing required fields' }
    }

    const postData = {
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      content,
      image_url: options?.image_url || null,
      privacy_level: options?.privacy_level || "public",
      location_name: options?.location_name || null,
      latitude: options?.latitude || null,
      longitude: options?.longitude || null,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      is_pinned: false,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('📤 Inserting post data:', postData)

    const { data, error } = await supabase
      .from("social_posts")
      .insert([postData])
      .select()
      .single()

    console.log('📥 Supabase response:', { data, error })

    if (error) {
      console.error("❌ Supabase error creating social post:", error)
      console.error("Error details:", error.details, error.hint, error.message)
      return { success: false, error: error.message || "Failed to create post" }
    }

    console.log('✅ Post created successfully:', data)
    return { success: true, post: data }
  } catch (error) {
    console.error("💥 Unexpected error creating social post:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Like a post
export async function likePost(postId: number, userId: number): Promise<boolean> {
  try {
    const { error: insertError } = await supabase.from("social_likes").insert([{ post_id: postId, user_id: userId }])

    if (insertError) {
      console.error("Error liking post:", insertError)
      return false
    }

    // Update likes count
    const { data: post, error: fetchError } = await supabase
      .from("social_posts")
      .select("likes_count")
      .eq("id", postId)
      .single()

    if (!fetchError && post) {
      await supabase
        .from("social_posts")
        .update({ likes_count: (post.likes_count || 0) + 1 })
        .eq("id", postId)
    }

    return true
  } catch (error) {
    console.error("Error liking post:", error)
    return false
  }
}

// Unlike a post
export async function unlikePost(postId: number, userId: number): Promise<boolean> {
  try {
    const { error: deleteError } = await supabase
      .from("social_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId)

    if (deleteError) {
      console.error("Error unliking post:", deleteError)
      return false
    }

    // Update likes count
    const { data: post, error: fetchError } = await supabase
      .from("social_posts")
      .select("likes_count")
      .eq("id", postId)
      .single()

    if (!fetchError && post && post.likes_count > 0) {
      await supabase
        .from("social_posts")
        .update({ likes_count: post.likes_count - 1 })
        .eq("id", postId)
    }

    return true
  } catch (error) {
    console.error("Error unliking post:", error)
    return false
  }
}

// Check if user liked a post
export async function checkUserLiked(postId: number, userId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("social_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single()

    if (error) return false
    return !!data
  } catch (error) {
    return false
  }
}

// Add comment to post
export async function addComment(
  postId: number,
  userId: number,
  userName: string,
  userEmail: string,
  content: string,
): Promise<{ success: boolean; comment?: SocialComment; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("social_comments")
      .insert([
        {
          post_id: postId,
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          content,
          status: "active",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error adding comment:", error)
      return { success: false, error: "Failed to add comment" }
    }

    // Update comments count
    const { data: post, error: fetchError } = await supabase
      .from("social_posts")
      .select("comments_count")
      .eq("id", postId)
      .single()

    if (!fetchError && post) {
      await supabase
        .from("social_posts")
        .update({ comments_count: (post.comments_count || 0) + 1 })
        .eq("id", postId)
    }

    return { success: true, comment: data }
  } catch (error) {
    console.error("Error adding comment:", error)
    return { success: false, error: "An error occurred" }
  }
}

// Get comments for a post
export async function getPostComments(postId: number): Promise<SocialComment[]> {
  try {
    const { data, error } = await supabase
      .from("social_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching comments:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching comments:", error)
    return []
  }
}

// Share a post
export async function sharePost(postId: number, userId: number, shareMessage?: string): Promise<boolean> {
  try {
    const { error: insertError } = await supabase.from("social_shares").insert([
      {
        post_id: postId,
        user_id: userId,
        share_type: "share",
        shared_message: shareMessage,
      },
    ])

    if (insertError) {
      console.error("Error sharing post:", insertError)
      return false
    }

    // Update shares count
    const { data: post, error: fetchError } = await supabase
      .from("social_posts")
      .select("shares_count")
      .eq("id", postId)
      .single()

    if (!fetchError && post) {
      await supabase
        .from("social_posts")
        .update({ shares_count: (post.shares_count || 0) + 1 })
        .eq("id", postId)
    }

    return true
  } catch (error) {
    console.error("Error sharing post:", error)
    return false
  }
}

// Get user profile
export async function getUserProfile(userId: number): Promise<SocialUserProfile | null> {
  try {
    const { data, error } = await supabase.from("social_user_profiles").select("*").eq("user_id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

// Create or update user profile
export async function upsertUserProfile(
  userId: number,
  profile: Partial<SocialUserProfile>,
): Promise<{ success: boolean; profile?: SocialUserProfile }> {
  try {
    const { data, error } = await supabase
      .from("social_user_profiles")
      .upsert(
        {
          user_id: userId,
          ...profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single()

    if (error) {
      console.error("Error upserting user profile:", error)
      return { success: false }
    }

    return { success: true, profile: data }
  } catch (error) {
    console.error("Error upserting user profile:", error)
    return { success: false }
  }
}

// Follow user
export async function followUser(followerId: number, followingId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("social_followers")
      .insert([{ follower_id: followerId, following_id: followingId, status: "active" }])

    if (error) {
      console.error("Error following user:", error)
      return false
    }

    // Update following count for follower
    const { data: followerProfile } = await supabase
      .from("social_user_profiles")
      .select("following_count")
      .eq("user_id", followerId)
      .single()

    if (followerProfile) {
      await supabase
        .from("social_user_profiles")
        .update({ following_count: (followerProfile.following_count || 0) + 1 })
        .eq("user_id", followerId)
    }

    // Update followers count for followed user
    const { data: followedProfile } = await supabase
      .from("social_user_profiles")
      .select("followers_count")
      .eq("user_id", followingId)
      .single()

    if (followedProfile) {
      await supabase
        .from("social_user_profiles")
        .update({ followers_count: (followedProfile.followers_count || 0) + 1 })
        .eq("user_id", followingId)
    }

    return true
  } catch (error) {
    console.error("Error following user:", error)
    return false
  }
}

// Unfollow user
export async function unfollowUser(followerId: number, followingId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("social_followers")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId)

    if (error) {
      console.error("Error unfollowing user:", error)
      return false
    }

    // Update following count
    const { data: followerProfile } = await supabase
      .from("social_user_profiles")
      .select("following_count")
      .eq("user_id", followerId)
      .single()

    if (followerProfile && followerProfile.following_count > 0) {
      await supabase
        .from("social_user_profiles")
        .update({ following_count: followerProfile.following_count - 1 })
        .eq("user_id", followerId)
    }

    // Update followers count
    const { data: followedProfile } = await supabase
      .from("social_user_profiles")
      .select("followers_count")
      .eq("user_id", followingId)
      .single()

    if (followedProfile && followedProfile.followers_count > 0) {
      await supabase
        .from("social_user_profiles")
        .update({ followers_count: followedProfile.followers_count - 1 })
        .eq("user_id", followingId)
    }

    return true
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return false
  }
}
