// services/feedbackService.ts
import { supabase } from "./supabaseClient"

export interface VolunteerFeedback {
  id: number
  volunteer_id: number
  volunteer_name: string
  admin_id: number
  admin_name: string
  feedback_type: 'validation' | 'performance' | 'general'
  rating: number
  comments: string
  status: 'pending' | 'approved' | 'rejected' | 'needs_improvement'
  created_at: string
  updated_at: string
}

export interface FeedbackStats {
  total: number
  pending: number
  approved: number
  rejected: number
  needs_improvement: number
  average_rating: number
}

// Get volunteer feedback (with optional filtering by volunteer ID)
export const getVolunteerFeedback = async (volunteerId?: number): Promise<VolunteerFeedback[]> => {
  try {
    let query = supabase
      .from("volunteer_feedback")
      .select("*")
      .order("created_at", { ascending: false })

    if (volunteerId) {
      query = query.eq("volunteer_id", volunteerId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching volunteer feedback:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching volunteer feedback:", error)
    return []
  }
}

// Add new feedback
export const addVolunteerFeedback = async (
  volunteerId: number,
  volunteerName: string,
  adminId: number,
  adminName: string,
  feedbackData: {
    feedback_type: 'validation' | 'performance' | 'general'
    rating: number
    comments: string
    status: 'pending' | 'approved' | 'rejected' | 'needs_improvement'
  }
): Promise<{ success: boolean; message: string; feedback?: VolunteerFeedback }> => {
  try {
    const newFeedback = {
      volunteer_id: volunteerId,
      volunteer_name: volunteerName,
      admin_id: adminId,
      admin_name: adminName,
      ...feedbackData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("volunteer_feedback")
      .insert([newFeedback])
      .select()
      .single()

    if (error) {
      console.error("Error adding feedback:", error)
      return { success: false, message: error.message || "Failed to submit feedback" }
    }

    return {
      success: true,
      message: "Feedback submitted successfully",
      feedback: data,
    }
  } catch (error) {
    console.error("Error adding feedback:", error)
    return {
      success: false,
      message: "Failed to submit feedback",
    }
  }
}

// Update feedback status
export const updateFeedbackStatus = async (
  feedbackId: number,
  status: 'pending' | 'approved' | 'rejected' | 'needs_improvement'
): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase
      .from("volunteer_feedback")
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", feedbackId)

    if (error) {
      console.error("Error updating feedback:", error)
      return { success: false, message: error.message || "Failed to update feedback status" }
    }

    return {
      success: true,
      message: "Feedback status updated successfully",
    }
  } catch (error) {
    console.error("Error updating feedback:", error)
    return {
      success: false,
      message: "Failed to update feedback status",
    }
  }
}

// Get feedback statistics
export const getFeedbackStats = async (volunteerId?: number): Promise<FeedbackStats> => {
  try {
    let query = supabase.from("volunteer_feedback").select("*")

    if (volunteerId) {
      query = query.eq("volunteer_id", volunteerId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching feedback stats:", error)
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        needs_improvement: 0,
        average_rating: 0,
      }
    }

    const feedback = data || []

    const total = feedback.length
    const pending = feedback.filter(fb => fb.status === 'pending').length
    const approved = feedback.filter(fb => fb.status === 'approved').length
    const rejected = feedback.filter(fb => fb.status === 'rejected').length
    const needs_improvement = feedback.filter(fb => fb.status === 'needs_improvement').length
    
    const ratings = feedback.filter(fb => fb.rating > 0).map(fb => fb.rating)
    const average_rating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0

    return {
      total,
      pending,
      approved,
      rejected,
      needs_improvement,
      average_rating: Number(average_rating.toFixed(1)),
    }
  } catch (error) {
    console.error("Error fetching feedback stats:", error)
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      needs_improvement: 0,
      average_rating: 0,
    }
  }
}

// Get volunteer validation status
export const getVolunteerValidationStatus = async (volunteerId: number): Promise<{
  is_validated: boolean
  last_feedback?: VolunteerFeedback
  overall_rating: number
}> => {
  try {
    // Add cache busting by including timestamp
    const timestamp = new Date().getTime()
    const { data, error } = await supabase
      .from("volunteer_feedback")
      .select("*")
      .eq("volunteer_id", volunteerId)
      .eq("feedback_type", "validation")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error fetching validation status:", error)
      return {
        is_validated: false,
        overall_rating: 0,
      }
    }

    // Return true if we have any approved validation feedback
    const is_validated = !!data && data.length > 0
    
    return {
      is_validated,
      last_feedback: data?.[0],
      overall_rating: data?.[0]?.rating || 0,
    }
  } catch (error) {
    console.error("Error fetching validation status:", error)
    return {
      is_validated: false,
      overall_rating: 0,
    }
  }
}

// Validate volunteer (creates approved validation feedback)
export const validateVolunteer = async (volunteerId: number): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("Validating volunteer:", volunteerId)
    
    // Get volunteer name
    const { data: volunteerData, error: volunteerError } = await supabase
      .from("volunteers")
      .select("full_name")
      .eq("id", volunteerId)
      .single()

    if (volunteerError || !volunteerData) {
      console.log("Volunteer not found:", volunteerId)
      return {
        success: false,
        message: "Volunteer not found"
      }
    }

    console.log("Found volunteer:", volunteerData.full_name)

    // Check if volunteer already has approved validation
    const { data: existingValidation } = await supabase
      .from("volunteer_feedback")
      .select("id")
      .eq("volunteer_id", volunteerId)
      .eq("feedback_type", "validation")
      .eq("status", "approved")
      .single()

    if (existingValidation) {
      console.log("Volunteer already validated:", volunteerId)
      return {
        success: false,
        message: "Volunteer is already validated"
      }
    }

    // Create validation feedback
    const validationFeedback = {
      volunteer_id: volunteerId,
      volunteer_name: volunteerData.full_name,
      admin_id: 0,
      admin_name: "System",
      feedback_type: "validation",
      rating: 5,
      comments: "Volunteer has been validated and approved for field operations.",
      status: "approved",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Creating validation feedback:", validationFeedback)

    const { error } = await supabase
      .from("volunteer_feedback")
      .insert([validationFeedback])

    if (error) {
      console.error("Error validating volunteer:", error)
      return { success: false, message: error.message || "Failed to validate volunteer" }
    }

    console.log("Volunteer validated successfully:", volunteerId)
    return {
      success: true,
      message: "Volunteer validated successfully"
    }
  } catch (error) {
    console.error("Error validating volunteer:", error)
    return {
      success: false,
      message: "Failed to validate volunteer"
    }
  }
}

// Revoke validation (removes approved validation feedback)
export const revokeValidation = async (volunteerId: number): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase
      .from("volunteer_feedback")
      .delete()
      .eq("volunteer_id", volunteerId)
      .eq("feedback_type", "validation")
      .eq("status", "approved")

    if (error) {
      console.error("Error revoking validation:", error)
      return { success: false, message: error.message || "Failed to revoke validation" }
    }

    return {
      success: true,
      message: "Volunteer validation revoked successfully"
    }
  } catch (error) {
    console.error("Error revoking validation:", error)
    return {
      success: false,
      message: "Failed to revoke validation"
    }
  }
}