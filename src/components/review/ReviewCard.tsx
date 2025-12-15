'use client'

import { useState } from 'react'
import { ReviewWithDetails } from '@/types/review'
import { ReviewService } from '@/lib/review'

interface ReviewCardProps {
  review: ReviewWithDetails
  showPropertyInfo?: boolean
  showModerationActions?: boolean
  currentUserId?: string
  onReviewUpdated?: () => void
}

export default function ReviewCard({ 
  review, 
  showPropertyInfo = false,
  showModerationActions = false,
  currentUserId,
  onReviewUpdated
}: ReviewCardProps) {
  const [isReporting, setIsReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showReportForm, setShowReportForm] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return
    
    setIsReporting(true)
    try {
      // This would call a report review function
      // await ReviewService.reportReview(review.id, reportReason, currentUserId)
      setShowReportForm(false)
      setReportReason('')
    } catch (error) {
      console.error('Failed to report review:', error)
    } finally {
      setIsReporting(false)
    }
  }

  const handleModeration = async (action: 'approve' | 'reject') => {
    if (!currentUserId) return
    
    try {
      await ReviewService.moderateReview(review.id, action, currentUserId)
      if (onReviewUpdated) {
        onReviewUpdated()
      }
    } catch (error) {
      console.error('Failed to moderate review:', error)
    }
  }

  const handleRemove = async () => {
    if (!currentUserId || !confirm('Are you sure you want to remove this review?')) return
    
    try {
      await ReviewService.removeReview(review.id, currentUserId)
      if (onReviewUpdated) {
        onReviewUpdated()
      }
    } catch (error) {
      console.error('Failed to remove review:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            {review.tenant.avatar ? (
              <img
                src={review.tenant.avatar}
                alt={`${review.tenant.first_name} ${review.tenant.last_name}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {review.tenant.first_name.charAt(0)}{review.tenant.last_name.charAt(0)}
              </span>
            )}
          </div>
          
          {/* User Info */}
          <div>
            <h4 className="font-medium text-gray-900">
              {review.tenant.first_name} {review.tenant.last_name}
            </h4>
            <p className="text-sm text-gray-500">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex flex-col items-end">
          {renderStars(review.rating)}
          <span className="text-sm text-gray-600 mt-1">
            {review.rating}/5
          </span>
        </div>
      </div>

      {/* Property Info (if enabled) */}
      {showPropertyInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h5 className="font-medium text-gray-900">{review.property.title}</h5>
          <p className="text-sm text-gray-600">
            {review.property.street}, {review.property.city}
          </p>
        </div>
      )}

      {/* Review Content */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
      </div>

      {/* Verification Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {review.is_verified ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Verified
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pending Review
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Report Button (for non-admin users) */}
          {!showModerationActions && currentUserId && currentUserId !== review.tenant_id && (
            <button
              onClick={() => setShowReportForm(true)}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Report
            </button>
          )}

          {/* Moderation Actions (for admins) */}
          {showModerationActions && (
            <div className="flex space-x-2">
              {!review.is_verified && (
                <button
                  onClick={() => handleModeration('approve')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
              )}
              
              <button
                onClick={() => handleModeration('reject')}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                {review.is_verified ? 'Hide' : 'Reject'}
              </button>
              
              <button
                onClick={handleRemove}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Form */}
      {showReportForm && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h5 className="font-medium text-gray-900 mb-2">Report Review</h5>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Please describe why you're reporting this review..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleReport}
              disabled={isReporting || !reportReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors"
            >
              {isReporting ? 'Reporting...' : 'Submit Report'}
            </button>
            <button
              onClick={() => {
                setShowReportForm(false)
                setReportReason('')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}