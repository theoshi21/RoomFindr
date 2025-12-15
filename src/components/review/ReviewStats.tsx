'use client'

import { useState, useEffect } from 'react'
import { ReviewStats as ReviewStatsType } from '@/types/review'
import { ReviewService } from '@/lib/review'

interface ReviewStatsProps {
  propertyId: string
  showDetailed?: boolean
}

export default function ReviewStats({ propertyId, showDetailed = false }: ReviewStatsProps) {
  const [stats, setStats] = useState<ReviewStatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        const reviewStats = await ReviewService.getPropertyReviewStats(propertyId)
        setStats(reviewStats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load review statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [propertyId])

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-lg',
      lg: 'text-2xl'
    }

    return (
      <div className={`flex ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0

    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className="w-8 text-right">{rating}</span>
        <span>★</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-8 text-gray-600">{count}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-6 bg-gray-300 rounded w-24"></div>
          <div className="h-4 bg-gray-300 rounded w-16"></div>
        </div>
        {showDetailed && (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-4 bg-gray-300 rounded"></div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        Failed to load review statistics
      </div>
    )
  }

  if (!stats || stats.total_reviews === 0) {
    return (
      <div className="text-gray-600">
        <div className="flex items-center space-x-2">
          {renderStars(0)}
          <span className="text-sm">No reviews yet</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Overall Rating */}
      <div className="flex items-center space-x-3">
        <div className="text-3xl font-bold text-gray-900">
          {stats.average_rating.toFixed(1)}
        </div>
        <div>
          {renderStars(stats.average_rating, 'lg')}
          <div className="text-sm text-gray-600 mt-1">
            {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Detailed Rating Breakdown */}
      {showDetailed && stats.total_reviews > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 mb-3">Rating Breakdown</h4>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating}>
              {renderRatingBar(
                rating,
                stats.rating_distribution[rating as keyof typeof stats.rating_distribution],
                stats.total_reviews
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {showDetailed && (
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((stats.rating_distribution[4] + stats.rating_distribution[5]) / stats.total_reviews * 100)}%
            </div>
            <div className="text-sm text-gray-600">Positive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.average_rating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Average</div>
          </div>
        </div>
      )}
    </div>
  )
}