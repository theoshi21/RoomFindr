'use client'

import { useState, useEffect } from 'react'
import { ReviewWithDetails } from '@/types/review'
import { ReviewService } from '@/lib/review'
import ReviewCard from './ReviewCard'

interface ReviewModerationProps {
  currentUserId: string
}

export default function ReviewModeration({ currentUserId }: ReviewModerationProps) {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)

    try {
      const allReviews = await ReviewService.getAllReviewsForModeration()
      setReviews(allReviews)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleReviewUpdated = () => {
    fetchReviews()
  }

  const filteredReviews = reviews.filter(review => {
    // Filter by status
    const statusMatch = 
      filter === 'all' ||
      (filter === 'pending' && !review.is_verified) ||
      (filter === 'approved' && review.is_verified) ||
      (filter === 'rejected' && !review.is_verified) // Note: rejected reviews might need a separate field

    // Filter by search term
    const searchMatch = 
      !searchTerm ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${review.tenant.first_name} ${review.tenant.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())

    return statusMatch && searchMatch
  })

  const getStatusCounts = () => {
    return {
      all: reviews.length,
      pending: reviews.filter(r => !r.is_verified).length,
      approved: reviews.filter(r => r.is_verified).length,
      rejected: 0 // This would need a separate field in the database
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="flex space-x-4 mb-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-10 bg-gray-300 rounded w-24"></div>
            ))}
          </div>
          <div className="h-10 bg-gray-300 rounded w-full mb-6"></div>
        </div>
        
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
                </div>
              </div>
            </div>
          ))}
        </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review Moderation</h2>
        <p className="text-gray-600 mt-1">
          Manage and moderate user reviews across the platform
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All Reviews', count: statusCounts.all },
          { key: 'pending', label: 'Pending', count: statusCounts.pending },
          { key: 'approved', label: 'Approved', count: statusCounts.approved },
          { key: 'rejected', label: 'Rejected', count: statusCounts.rejected }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                filter === key
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search reviews by content, property, or reviewer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No matching reviews found' : 'No reviews to moderate'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Try adjusting your search terms or filters'
              : 'All reviews have been processed'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showPropertyInfo={true}
              showModerationActions={true}
              currentUserId={currentUserId}
              onReviewUpdated={handleReviewUpdated}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredReviews.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}