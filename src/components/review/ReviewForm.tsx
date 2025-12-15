'use client'

import { useState } from 'react'
import { ReviewService } from '@/lib/review'
import { ReviewFormData } from '@/types/review'
import { useAuth } from '@/contexts/AuthContext'

interface ReviewFormProps {
  propertyId: string
  landlordId: string
  onReviewSubmitted?: () => void
  onCancel?: () => void
}

export default function ReviewForm({ 
  propertyId, 
  landlordId, 
  onReviewSubmitted, 
  onCancel 
}: ReviewFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    comment: '',
    property_id: propertyId,
    landlord_id: landlordId
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!user?.user.id) {
        throw new Error('You must be logged in to submit a review')
      }
      
      await ReviewService.createReview(formData, user.user.id)
      
      if (onReviewSubmitted) {
        onReviewSubmitted()
      }
      
      // Reset form
      setFormData({
        rating: 5,
        comment: '',
        property_id: propertyId,
        landlord_id: landlordId
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Stars */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className={`text-2xl ${
                  star <= formData.rating
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                } hover:text-yellow-400 transition-colors`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review
          </label>
          <textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Share your experience with this property..."
            required
            minLength={10}
            maxLength={1000}
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.comment.length}/1000 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || formData.comment.length < 10}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}