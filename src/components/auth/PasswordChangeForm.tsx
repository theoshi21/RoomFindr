'use client'

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { PasswordChangeData, FormState } from '../../types/auth'

interface PasswordChangeFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { changePassword } = useAuth()
  const [formData, setFormData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    errors: []
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value)
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
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
    
    // Validate password confirmation
    if (formData.newPassword !== confirmPassword) {
      setFormState(prev => ({
        ...prev,
        errors: [{ field: 'confirmPassword', message: 'Passwords do not match' }]
      }))
      return
    }
    
    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      errors: [],
      success: undefined
    }))

    try {
      const result = await changePassword(formData)
      
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
          success: 'Password changed successfully!'
        }))
        
        // Clear form
        setFormData({
          currentPassword: '',
          newPassword: ''
        })
        setConfirmPassword('')
        
        if (onSuccess) {
          setTimeout(onSuccess, 1500) // Show success message briefly
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
        Change Password
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
        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {getFieldError('currentPassword') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('currentPassword')}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {getFieldError('newPassword') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('newPassword')}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Must be at least 8 characters with uppercase, lowercase, and number
          </p>
        </div>

        {/* Confirm New Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {getFieldError('confirmPassword') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('confirmPassword')}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {formState.isSubmitting ? 'Changing Password...' : 'Change Password'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}