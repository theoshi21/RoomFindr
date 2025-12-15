import { createClientComponentClient } from '@/lib/supabase'
import { Review, ReviewInsert, ReviewWithDetails, ReviewStats, ReviewFormData } from '@/types/review'

const supabase = createClientComponentClient()

export class ReviewService {
  // Create a new review
  static async createReview(reviewData: ReviewFormData, userId: string): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        ...reviewData,
        tenant_id: userId,
        is_verified: false
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create review: ${error.message}`)
    }

    return data
  }

  // Get reviews for a property
  static async getPropertyReviews(propertyId: string): Promise<ReviewWithDetails[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        tenant:users!reviews_tenant_id_fkey (
          id,
          user_profiles (
            first_name,
            last_name,
            avatar
          )
        ),
        property:properties!reviews_property_id_fkey (
          id,
          title,
          street,
          city
        )
      `)
      .eq('property_id', propertyId)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch property reviews: ${error.message}`)
    }

    return data.map((review: any) => ({
      ...review,
      tenant: {
        id: review.tenant.id,
        first_name: review.tenant.user_profiles?.first_name || '',
        last_name: review.tenant.user_profiles?.last_name || '',
        avatar: review.tenant.user_profiles?.avatar
      }
    }))
  }

  // Get reviews by landlord
  static async getLandlordReviews(landlordId: string): Promise<ReviewWithDetails[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        tenant:users!reviews_tenant_id_fkey (
          id,
          user_profiles (
            first_name,
            last_name,
            avatar
          )
        ),
        property:properties!reviews_property_id_fkey (
          id,
          title,
          street,
          city
        )
      `)
      .eq('landlord_id', landlordId)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch landlord reviews: ${error.message}`)
    }

    return data.map((review: any) => ({
      ...review,
      tenant: {
        id: review.tenant.id,
        first_name: review.tenant.user_profiles?.first_name || '',
        last_name: review.tenant.user_profiles?.last_name || '',
        avatar: review.tenant.user_profiles?.avatar
      }
    }))
  }

  // Get review statistics for a property
  static async getPropertyReviewStats(propertyId: string): Promise<ReviewStats> {
    const { data, error } = await supabase
      .rpc('calculate_property_rating', { p_property_id: propertyId })

    if (error) {
      throw new Error(`Failed to calculate property rating: ${error.message}`)
    }

    // The function returns a JSONB object, so we need to parse it properly
    const stats = (data as any) || {
      average_rating: 0,
      total_reviews: 0,
      rating_distribution: { '5_star': 0, '4_star': 0, '3_star': 0, '2_star': 0, '1_star': 0 }
    }

    // Convert the rating distribution to the expected format
    return {
      average_rating: stats.average_rating || 0,
      total_reviews: stats.total_reviews || 0,
      rating_distribution: {
        5: stats.rating_distribution?.['5_star'] || 0,
        4: stats.rating_distribution?.['4_star'] || 0,
        3: stats.rating_distribution?.['3_star'] || 0,
        2: stats.rating_distribution?.['2_star'] || 0,
        1: stats.rating_distribution?.['1_star'] || 0
      }
    }
  }

  // Check if user can review a property
  static async canUserReviewProperty(propertyId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_user_review_property', { 
        p_property_id: propertyId, 
        p_user_id: userId 
      })

    if (error) {
      throw new Error(`Failed to check review eligibility: ${error.message}`)
    }

    return data || false
  }

  // Get user's reviews
  static async getUserReviews(userId: string): Promise<ReviewWithDetails[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        tenant:users!reviews_tenant_id_fkey (
          id,
          user_profiles (
            first_name,
            last_name,
            avatar
          )
        ),
        property:properties!reviews_property_id_fkey (
          id,
          title,
          street,
          city
        )
      `)
      .eq('tenant_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user reviews: ${error.message}`)
    }

    return data.map((review: any) => ({
      ...review,
      tenant: {
        id: review.tenant.id,
        first_name: review.tenant.user_profiles?.first_name || '',
        last_name: review.tenant.user_profiles?.last_name || '',
        avatar: review.tenant.user_profiles?.avatar
      }
    }))
  }

  // Update review
  static async updateReview(reviewId: string, updates: Partial<ReviewFormData>): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update review: ${error.message}`)
    }

    return data
  }

  // Delete review
  static async deleteReview(reviewId: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      throw new Error(`Failed to delete review: ${error.message}`)
    }
  }

  // Admin functions
  static async getAllReviewsForModeration(): Promise<ReviewWithDetails[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        tenant:users!reviews_tenant_id_fkey (
          id,
          user_profiles (
            first_name,
            last_name,
            avatar
          )
        ),
        property:properties!reviews_property_id_fkey (
          id,
          title,
          street,
          city
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch reviews for moderation: ${error.message}`)
    }

    return data.map((review: any) => ({
      ...review,
      tenant: {
        id: review.tenant.id,
        first_name: review.tenant.user_profiles?.first_name || '',
        last_name: review.tenant.user_profiles?.last_name || '',
        avatar: review.tenant.user_profiles?.avatar
      }
    }))
  }

  // Moderate review (admin only)
  static async moderateReview(reviewId: string, action: 'approve' | 'reject', adminId: string): Promise<Review> {
    const updates = action === 'approve' 
      ? { is_verified: true }
      : { is_verified: false }

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to moderate review: ${error.message}`)
    }

    return data
  }

  // Remove review (admin only)
  static async removeReview(reviewId: string, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      throw new Error(`Failed to remove review: ${error.message}`)
    }
  }
}