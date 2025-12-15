'use client'

import React, { useState, useEffect } from 'react'
import { getPendingVerifications, reviewVerification, getDocumentUrl } from '../../lib/verification'
import type { VerificationWithDocuments, VerificationReviewData } from '../../lib/verification'

interface VerificationReviewProps {
  adminId: string
}

export default function VerificationReview({ adminId }: VerificationReviewProps) {
  const [verifications, setVerifications] = useState<VerificationWithDocuments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVerification, setSelectedVerification] = useState<VerificationWithDocuments | null>(null)
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    loadPendingVerifications()
  }, [])

  const loadPendingVerifications = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getPendingVerifications()
      
      if (result.error) {
        setError(result.error)
      } else {
        setVerifications(result.verifications)
        
        // Load document URLs for all verifications
        const urls: Record<string, string> = {}
        for (const verification of result.verifications) {
          for (const doc of verification.documents) {
            const url = await getDocumentUrl(doc.file_path)
            if (url) {
              urls[doc.id] = url
            }
          }
        }
        setDocumentUrls(urls)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending verifications')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedVerification) return

    setIsReviewing(true)

    try {
      const reviewData: VerificationReviewData = {
        verificationId: selectedVerification.id,
        status,
        feedback: status === 'rejected' ? reviewFeedback : undefined,
        reviewedBy: adminId
      }

      const result = await reviewVerification(reviewData)
      
      if (result.success) {
        // Remove the reviewed verification from the list
        setVerifications(prev => prev.filter(v => v.id !== selectedVerification.id))
        setSelectedVerification(null)
        setReviewFeedback('')
        
        // Show success message
        setError(null)
        const message = `Verification ${status} successfully!`
        
        // Create a temporary success state
        setTimeout(() => {
          alert(message)
        }, 100)
      } else {
        setError(`Failed to ${status} verification: ${result.error}`)
      }
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsReviewing(false)
    }
  }

  const formatDocumentType = (type: string) => {
    switch (type) {
      case 'id':
        return 'Government ID'
      case 'business_permit':
        return 'Business Permit'
      case 'property_deed':
        return 'Property Deed/Title'
      case 'other':
        return 'Other Document'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Verifications</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={loadPendingVerifications}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Landlord Verification Review</h2>
        <p className="mt-1 text-sm text-gray-600">
          Review and approve or reject landlord verification submissions
        </p>
      </div>

      {verifications.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Pending Verifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            All verification requests have been processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verification List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Pending Verifications ({verifications.length})
            </h3>
            {verifications.map((verification) => (
              <div
                key={verification.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedVerification?.id === verification.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedVerification(verification)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {verification.landlord_profile?.first_name} {verification.landlord_profile?.last_name}
                    </h4>
                    <p className="text-sm text-gray-500">{verification.landlord_profile?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(verification.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {verification.documents.length} documents
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Verification Details */}
          <div>
            {selectedVerification ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Review Verification
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p><strong>Landlord:</strong> {selectedVerification.landlord_profile?.first_name} {selectedVerification.landlord_profile?.last_name}</p>
                    <p><strong>Email:</strong> {selectedVerification.landlord_profile?.email}</p>
                    <p><strong>Submitted:</strong> {new Date(selectedVerification.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                </div>

                {/* Documents */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Submitted Documents</h4>
                  <div className="space-y-3">
                    {selectedVerification.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDocumentType(doc.document_type)}
                          </p>
                          <p className="text-xs text-gray-500">{doc.filename}</p>
                          <p className="text-xs text-gray-400">
                            {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                          </p>
                        </div>
                        {documentUrls[doc.id] && (
                          <a
                            href={documentUrls[doc.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            View
                            <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                <div className="mb-6">
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (required for rejection)
                  </label>
                  <textarea
                    id="feedback"
                    rows={4}
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Provide feedback for the landlord..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleReview('approved')}
                    disabled={isReviewing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReviewing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReview('rejected')}
                    disabled={isReviewing || !reviewFeedback.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReviewing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Verification</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a verification from the list to review the documents and make a decision.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}