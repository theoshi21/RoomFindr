'use client'

import { useState, useEffect } from 'react'
import { ReviewWithDetails } from '@/types/review'
import { ReviewService } from '@/lib/review'
import ReviewCard from './ReviewCard'

interface ReviewListProps {
  propertyId?: string
  landlordId?: string
  userId?: string
  showPropertyInfo?: boolean
  showModerationActions?: boolean
  currentUserId?: string
  limit?: number
}

export default function ReviewList({
  propertyId,
  landlordId,
  userId,
  showPropertyInfo = false,
  showModerationActions = false,
  currentUserId,
  limit
}: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)

    try {
      let fetchedReviews: ReviewWithDetails[] = []

      if (propertyId) {
        fetchedReviews = await ReviewService.getPropertyReviews(propertyId)
      } else if (landlordId) {
        fetchedReviews = await ReviewService.getLandlordReviews(landlordId)
      } else if (userId) {
        fetchedReviews = await ReviewService.getUserReviews(userId)
      } else if (showModerationActions) {
        fetchedReviews = await ReviewService.getAllReviewsForModeration()
      }

      if (limit) {
        fetchedReviews = fetchedReviews.slice(0, limit)
      }

      setReviews(fetchedReviews)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [propertyId, landlordId, userId, showModerationActions, limit])

  const handleReviewUpdated = () => {
    fetchReviews()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>Error loading reviews: {error}</p>
        <button
          onClick={fetchReviews}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-600">
          {propertyId 
            ? "Be the first to review this property!"
            : "No reviews found."
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          showPropertyInfo={showPropertyInfo}
          showModerationActions={showModerationActions}
          currentUserId={currentUserId}
          onReviewUpdated={handleReviewUpdated}
        />
      ))}
      
      {limit && reviews.length === limit && (
        <div className="text-center py-4">
          <p className="text-gray-600">
            Showing {limit} most recent reviews
          </p>
        </div>
      )}
    </div>
  )
}