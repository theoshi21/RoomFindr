'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DocumentUpload from '../../../components/verification/DocumentUpload'
import VerificationStatus from '../../../components/verification/VerificationStatus'
import { getVerificationStatus } from '../../../lib/verification'

export default function VerificationPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentView, setCurrentView] = useState<'status' | 'upload'>('status')
  const [hasVerification, setHasVerification] = useState<boolean | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (user && user.user.role !== 'landlord') {
      router.push('/dashboard')
      return
    }

    if (user) {
      checkVerificationStatus()
    }
  }, [user, loading, router])

  const checkVerificationStatus = async () => {
    if (!user) return

    try {
      const result = await getVerificationStatus(user.user.id)
      
      if (result.verification) {
        setHasVerification(true)
        setVerificationStatus(result.verification.status)
        setCurrentView('status')
      } else {
        setHasVerification(false)
        setCurrentView('upload')
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
      setHasVerification(false)
      setCurrentView('upload')
    }
  }

  const handleUploadComplete = (success: boolean, message?: string) => {
    if (success) {
      setHasVerification(true)
      setVerificationStatus('pending')
      setCurrentView('status')
    }
  }

  const handleResubmit = () => {
    setCurrentView('upload')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.user.role !== 'landlord') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Landlord Verification</h1>
              <p className="mt-1 text-sm text-gray-600">
                Complete your verification to start listing properties
              </p>
            </div>
            <button
              onClick={() => router.push('/landlord/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      {hasVerification && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentView('status')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'status'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Verification Status
              </button>
              {verificationStatus === 'rejected' && (
                <button
                  onClick={() => setCurrentView('upload')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    currentView === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Resubmit Documents
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="py-8">
        {currentView === 'status' && hasVerification ? (
          <VerificationStatus 
            landlordId={user.user.id} 
            onResubmit={handleResubmit}
          />
        ) : (
          <div>
            {/* Instructions */}
            <div className="max-w-4xl mx-auto px-6 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-blue-900">Verification Requirements</h3>
                    <div className="mt-2 text-sm text-blue-800">
                      <p className="mb-2">To become a verified landlord, please upload the following documents:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Government ID</strong> - Valid government-issued identification</li>
                        <li><strong>Property Deed/Title</strong> - Proof of property ownership</li>
                        <li><strong>Business Permit</strong> - Business registration (if applicable)</li>
                        <li><strong>Other Documents</strong> - Any additional supporting documents</li>
                      </ul>
                      <p className="mt-3 text-xs">
                        All documents should be clear, legible, and in PDF or image format (max 10MB each).
                        The verification process typically takes 1-3 business days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DocumentUpload 
              landlordId={user.user.id} 
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}
      </div>
    </div>
  )
}