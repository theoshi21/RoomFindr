'use client'

import React, { useState } from 'react'
import { createAdminAccount } from '../../lib/admin'
import type { CreateAdminData, AdminFormState } from '../../types/admin'
import { useAuth } from '../../contexts/AuthContext'

interface CreateAdminFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

export const CreateAdminForm: React.FC<CreateAdminFormProps> = ({ 
  onSuccess, 
  onCancel, 
  className = '' 
}) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState<CreateAdminData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formState, setFormState] = useState<AdminFormState>({
    isSubmitting: false,
    errors: []
  })

  const validateForm = (): boolean => {
    const errors: { field: string; message: string }[] = []

    if (!formData.email.trim()) {
      errors.push({ field: 'email', message: 'Email is required' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' })
    }

    if (!formData.password) {
      errors.push({ field: 'password', message: 'Password is required' })
    } else if (formData.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long' })
    }

    if (formData.password !== confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Passwords do not match' })
    }

    if (!formData.firstName.trim()) {
      errors.push({ field: 'firstName', message: 'First name is required' })
    }

    if (!formData.lastName.trim()) {
      errors.push({ field: 'lastName', message: 'Last name is required' })
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.push({ field: 'phone', message: 'Please enter a valid phone number' })
    }

    setFormState(prev => ({ ...prev, errors }))
    return errors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user?.user.id) {
      return
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, errors: [] }))

    try {
      await createAdminAccount(formData, user.user.id)
      setFormState(prev => ({ 
        ...prev, 
        success: 'Admin account created successfully',
        isSubmitting: false 
      }))
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: ''
      })
      setConfirmPassword('')

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: [{ field: 'general', message: error instanceof Error ? error.message : 'Failed to create admin account' }]
      }))
    }
  }

  const handleInputChange = (field: keyof CreateAdminData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific errors when user starts typing
    setFormState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.field !== field)
    }))
  }

  const getFieldError = (field: string) => {
    return formState.errors.find(error => error.field === field)?.message
  }

  const generalError = formState.errors.find(error => error.field === 'general')?.message

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Create Admin Account</h2>
        <p className="text-sm text-gray-600 mt-1">Add a new administrator to the system</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{generalError}</p>
          </div>
        )}

        {formState.success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{formState.success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('firstName') ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={formState.isSubmitting}
            />
            {getFieldError('firstName') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('firstName')}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('lastName') ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={formState.isSubmitting}
            />
            {getFieldError('lastName') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('lastName')}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('email') ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={formState.isSubmitting}
          />
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('phone') ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={formState.isSubmitting}
          />
          {getFieldError('phone') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('phone')}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('password') ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={formState.isSubmitting}
            />
            {getFieldError('password') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setFormState(prev => ({
                  ...prev,
                  errors: prev.errors.filter(error => error.field !== 'confirmPassword')
                }))
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('confirmPassword') ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={formState.isSubmitting}
            />
            {getFieldError('confirmPassword') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('confirmPassword')}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={formState.isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {formState.isSubmitting ? 'Creating...' : 'Create Admin Account'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateAdminForm