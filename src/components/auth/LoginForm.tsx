'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { getRoleBasedRedirect } from '../../lib/auth'
import type { LoginCredentials, FormState } from '../../types/auth'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
  onForgotPassword?: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword
}) => {
  const router = useRouter()
  const { signIn, user } = useAuth()
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
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
    
    // Clear field-specific errors when user starts typing
    if (formState.errors.length > 0) {
      setFormState(prev => ({
        ...prev,
        errors: prev.errors.filter(error => error.field !== name)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      errors: []
    }))

    try {
      const result = await signIn(formData)
      
      if (result.error) {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          errors: [{ field: 'general', message: result.error! }]
        }))
      } else {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false
        }))
        
        if (onSuccess) {
          onSuccess()
        } else {
          // Redirect to a page that will handle role-based routing
          router.push('/dashboard')
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

  const getFieldError = (fieldName: string): string | undefined => {
    return formState.errors.find(error => error.field === fieldName)?.message
  }

  const hasGeneralError = formState.errors.some(error => error.field === 'general')
  const generalError = formState.errors.find(error => error.field === 'general')?.message

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Sign In to RoomFindr
      </h2>
      
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
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {getFieldError('password') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
          )}
        </div>

        {/* Forgot Password Link */}
        {onForgotPassword && (
          <div className="text-right">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {formState.isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Switch to Register */}
      {onSwitchToRegister && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Create one here
            </button>
          </p>
        </div>
      )}
    </div>
  )
}