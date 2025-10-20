import { supabase } from "./supabase-client"

export interface SocialPost {
  id: number
  content: string
  image_url?: string
  location_name?: string
  latitude?: number
  longitude?: number
  comments_count: number
  status: "active" | "deleted"
  post_type: "post" | "donation"
  created_at: string
  updated_at: string
}

export interface SocialComment {
  id: number
  post_id: number
  content: string
  status: "active" | "deleted"
  created_at: string
  updated_at: string
}

// Get all posts for feed
export async function getSocialFeed(limit = 20, offset = 0, postType?: "post" | "donation"): Promise<SocialPost[]> {
  try {
    let query = supabase.from("social_posts").select("*").eq("status", "active")

    // Filter by post_type if provided
    if (postType) {
      query = query.eq("post_type", postType)
    }

    const { data, error } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

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

export async function createSocialPost(
  content: string,
  options?: {
    image_url?: string
    location_name?: string
    address?: string
    latitude?: number
    longitude?: number
    post_type?: "post" | "donation"
  },
): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
  try {
    console.log("[v0] Creating anonymous social post")

    // Validate content
    if (!content || !content.trim()) {
      console.error("[v0] Missing content")
      return { success: false, error: "Content is required" }
    }

    const now = new Date().toISOString()

    const postData = {
      content: content.trim(),
      image_url: options?.image_url || null,
      location_name: options?.location_name || null,
      address: options?.address || null,
      latitude: options?.latitude || null,
      longitude: options?.longitude || null,
      comments_count: 0,
      status: "active",
      post_type: options?.post_type || "post",
      created_at: now,
      updated_at: now,
    }

    console.log("[v0] Inserting anonymous post data:", postData)

    const { data, error } = await supabase.from("social_posts").insert([postData]).select().single()

    if (error) {
      console.error("[v0] Supabase error creating social post:", error)
      return { success: false, error: error.message || "Failed to create post" }
    }

    console.log("[v0] Post created successfully:", data)
    return { success: true, post: data }
  } catch (error) {
    console.error("[v0] Unexpected error creating social post:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function addComment(
  postId: number,
  content: string,
): Promise<{ success: boolean; comment?: SocialComment; error?: string }> {
  try {
    if (!content || !content.trim()) {
      return { success: false, error: "Comment content is required" }
    }

    const { data, error } = await supabase
      .from("social_comments")
      .insert([
        {
          post_id: postId,
          content: content.trim(),
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
