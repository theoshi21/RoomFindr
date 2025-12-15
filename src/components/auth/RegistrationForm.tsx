'use client'

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { RegistrationData, FormState, ValidationError } from '../../types/auth'

interface RegistrationFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  onSwitchToLogin
}) => {
  const { signUp } = useAuth()
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    role: 'tenant',
    firstName: '',
    lastName: '',
    phone: ''
  })
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    errors: []
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      errors: [],
      success: undefined
    }))

    try {
      const result = await signUp(formData)
      
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
          success: 'Registration successful! Please check your email to verify your account.'
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

  const getFieldError = (fieldName: string): string | undefined => {
    return formState.errors.find(error => error.field === fieldName)?.message
  }

  const hasGeneralError = formState.errors.some(error => error.field === 'general')
  const generalError = formState.errors.find(error => error.field === 'general')?.message

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Create Your Account
      </h2>
      
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
        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            I am a:
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="tenant">Tenant (Looking for a room)</option>
            <option value="landlord">Landlord (Renting out rooms)</option>
          </select>
          {getFieldError('role') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('role')}</p>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {getFieldError('firstName') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('firstName')}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {getFieldError('lastName') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('lastName')}</p>
            )}
          </div>
        </div>

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

        {/* Phone (Optional) */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+63 or 09XX XXX XXXX"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {getFieldError('phone') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('phone')}</p>
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
          <p className="mt-1 text-xs text-gray-500">
            Must be at least 8 characters with uppercase, lowercase, and number
          </p>
        </div>

        {/* Landlord Notice */}
        {formData.role === 'landlord' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> As a landlord, you'll need to complete a verification process 
              before you can list properties. This helps ensure trust and safety for all users.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      )}
    </div>
  )
}