import { Database } from './database'

export type Review = Database['public']['Tables']['reviews']['Row']
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export interface ReviewWithDetails extends Review {
  tenant: {
    id: string
    first_name: string
    last_name: string
    avatar?: string
  }
  property: {
    id: string
    title: string
    street: string
    city: string
  }
}

export interface ReviewFormData {
  rating: number
  comment: string
  property_id: string
  landlord_id: string
}

export interface ReviewStats {
  average_rating: number
  total_reviews: number
  rating_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface ReviewModerationAction {
  review_id: string
  action: 'approve' | 'reject' | 'remove'
  reason?: string
  admin_id: string
}

export interface ReviewReport {
  id: string
  review_id: string
  reporter_id: string
  reason: string
  description?: string
  status: 'pending' | 'reviewed' | 'dismissed'
  created_at: string
}