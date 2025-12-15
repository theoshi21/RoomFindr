'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import type { EmailVerificationData, FormState } from '../../types/auth'

interface EmailVerificationFormProps {
  onSuccess?: () => void
}

export const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  onSuccess
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyEmail } = useAuth()
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    errors: []
  })
  const [isAutoVerifying, setIsAutoVerifying] = useState(false)

  useEffect(() => {
    // Check if we have verification parameters in the URL
    const token = searchParams.get('token')
    const type = searchParams.get('type') as 'signup' | 'recovery' | null

    if (token && type && !isAutoVerifying) {
      setIsAutoVerifying(true)
      handleVerification({ token, type })
    }
  }, [searchParams, isAutoVerifying])

  const handleVerification = async (data: EmailVerificationData) => {
    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      errors: [],
      success: undefined
    }))

    try {
      const result = await verifyEmail(data)
      
      if (result.error) {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          errors: [{ field: 'general', message: result.error! }]
        }))
      } else {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          success: data.type === 'signup' 
            ? 'Email verified successfully! You can now sign in to your account.'
            : 'Email verified successfully! You can now set a new password.'
        }))
        
        if (onSuccess) {
          setTimeout(onSuccess, 2000)
        } else {
          // Redirect based on verification type
          setTimeout(() => {
            if (data.type === 'signup') {
              router.push('/auth/login?verified=true')
            } else {
              router.push('/auth/reset-password?verified=true')
            }
          }, 2000)
        }
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: [{ 
          field: 'general', 
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }]
      }))
    }
  }

  const handleResendVerification = async () => {
    // This would typically require the user's email
    // For now, we'll just show a message
    setFormState(prev => ({
      ...prev,
      success: 'Please check your email for the verification link, or contact support if you need assistance.'
    }))
  }

  const hasGeneralError = formState.errors.some(error => error.field === 'general')
  const generalError = formState.errors.find(error => error.field === 'general')?.message

  if (isAutoVerifying || formState.isSubmitting) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Verifying Your Email
        </h2>
        <p className="text-gray-600">
          Please wait while we verify your email address...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Email Verification
      </h2>
      
      {formState.success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-center">
          {formState.success}
        </div>
      )}
      
      {hasGeneralError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-medium mb-2">Verification Failed</p>
          <p className="text-sm">{generalError}</p>
        </div>
      )}

      {!formState.success && (
        <div className="text-center space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              If you clicked a verification link in your email, the verification should happen automatically.
            </p>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Didn't receive a verification email?
            </p>
            
            <button
              onClick={handleResendVerification}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Request New Verification Email
            </button>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => router.push('/auth/login')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  )
}