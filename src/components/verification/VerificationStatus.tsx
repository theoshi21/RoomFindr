'use client'

import React, { useState, useEffect } from 'react'
import { getVerificationStatus, getDocumentUrl } from '../../lib/verification'
import type { VerificationWithDocuments } from '../../lib/verification'

interface VerificationStatusProps {
  landlordId: string
  onResubmit?: () => void
}

export default function VerificationStatus({ landlordId, onResubmit }: VerificationStatusProps) {
  const [verification, setVerification] = useState<VerificationWithDocuments | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    loadVerificationStatus()
  }, [landlordId])

  const loadVerificationStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getVerificationStatus(landlordId)
      
      if (result.error) {
        setError(result.error)
      } else {
        setVerification(result.verification)
        
        // Load document URLs if verification exists
        if (result.verification?.documents) {
          const urls: Record<string, string> = {}
          for (const doc of result.verification.documents) {
            const url = await getDocumentUrl(doc.file_path)
            if (url) {
              urls[doc.id] = url
            }
          }
          setDocumentUrls(urls)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      case 'approved':
        return (
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'rejected':
        return (
          <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Verification Status</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={loadVerificationStatus}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!verification) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Verification Submitted</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't submitted any verification documents yet. Upload your documents to get verified.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Verification Status</h2>
        
        {/* Status Badge */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(verification.status)} mb-6`}>
          {getStatusIcon(verification.status)}
          <span className="ml-2 capitalize">{verification.status}</span>
        </div>

        {/* Status Messages */}
        {verification.status === 'pending' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Verification Under Review</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your documents are being reviewed by our team. This process typically takes 1-3 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {verification.status === 'approved' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Verification Approved</h3>
                <p className="mt-1 text-sm text-green-700">
                  Congratulations! Your verification has been approved. You can now create property listings.
                </p>
              </div>
            </div>
          </div>
        )}

        {verification.status === 'rejected' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Verification Rejected</h3>
                <p className="mt-1 text-sm text-red-700">
                  Your verification was rejected. Please review the feedback below and resubmit with correct documents.
                </p>
                {verification.feedback && (
                  <div className="mt-2 p-2 bg-red-100 rounded">
                    <p className="text-sm text-red-800"><strong>Feedback:</strong> {verification.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Submitted</h3>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(verification.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          {verification.reviewed_at && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reviewed</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(verification.reviewed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Submitted Documents */}
        {verification.documents && verification.documents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submitted Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verification.documents.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {formatDocumentType(doc.document_type)}
                    </h4>
                    {documentUrls[doc.id] && (
                      <a
                        href={documentUrls[doc.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{doc.filename}</p>
                  <p className="text-xs text-gray-400">
                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {verification.status === 'rejected' && (
          <div className="flex justify-end">
            <button
              onClick={onResubmit}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Resubmit Documents
            </button>
          </div>
        )}
      </div>
    </div>
  )
}