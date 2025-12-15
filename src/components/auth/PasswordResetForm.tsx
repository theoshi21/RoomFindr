'use client'

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { PasswordResetData, FormState } from '../../types/auth'

interface PasswordResetFormProps {
  onSuccess?: () => void
  onBackToLogin?: () => void
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  onSuccess,
  onBackToLogin
}) => {
  const { resetPassword } = useAuth()
  const [formData, setFormData] = useState<PasswordResetData>({
    email: ''
  })
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    errors: []
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors when user starts typing
    if (formState.errors.length > 0) {
      setFormState(prev => ({
        ...prev,
        errors: []
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      errors: [],
      success: undefined
    }))

    try {
      const result = await resetPassword(formData)
      
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
          success: 'Password reset email sent! Please check your inbox and follow the instructions.'
        }))
        
        if (onSuccess) {
          onSuccess()
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

  const hasGeneralError = formState.errors.some(error => error.field === 'general')
  const generalError = formState.errors.find(error => error.field === 'general')?.message

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Reset Your Password
      </h2>
      
      <p className="text-sm text-gray-600 text-center mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      {formState.success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {formState.success}
        </div>
      )}
      
      {hasGeneralError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {formState.isSubmitting ? 'Sending Reset Email...' : 'Send Reset Email'}
        </button>
      </form>

      {/* Back to Login */}
      {onBackToLogin && (
        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to Sign In
          </button>
        </div>
      )}
    </div>
  )
}