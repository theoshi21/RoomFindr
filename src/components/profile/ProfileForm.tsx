'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { updateUserProfile, validateProfileData } from '../../lib/profile-simple'
import type { 
  ProfileFormData, 
  ProfileFormState, 
  UserPreferences,
  ProfileUpdateData 
} from '../../types/profile'

interface ProfileFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess, onCancel }) => {
  const { user, refreshUser } = useAuth()
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    preferences: {
      notifications: true,
      emailUpdates: true,
      theme: 'light'
    }
  })
  const [formState, setFormState] = useState<ProfileFormState>({
    isSubmitting: false,
    errors: []
  })

  // Initialize form with user data
  useEffect(() => {
    if (user?.profile) {
      setFormData({
        firstName: user.profile.first_name || '',
        lastName: user.profile.last_name || '',
        phone: user.profile.phone || '',
        bio: user.profile.bio || '',
        preferences: (user.profile.preferences && typeof user.profile.preferences === 'object' && 
          'notifications' in user.profile.preferences) ? 
          user.profile.preferences as unknown as UserPreferences : {
          notifications: true,
          emailUpdates: true,
          theme: 'light'
        }
      })
    }
  }, [user])

  const handleInputChange = (field: keyof ProfileFormData, value: string | UserPreferences) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear field-specific errors
    setFormState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.field !== field)
    }))
  }

  const handlePreferenceChange = (key: keyof UserPreferences, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.user?.id) {
      setFormState(prev => ({
        ...prev,
        errors: [{ field: 'firstName', message: 'User not authenticated' }]
      }))
      return
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, errors: [] }))

    try {
      // Validate form data
      const updateData: ProfileUpdateData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        bio: formData.bio.trim() || null,
        preferences: formData.preferences
      }

      const validationErrors = validateProfileData(updateData)
      
      if (validationErrors.length > 0) {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          errors: validationErrors.map(message => ({ field: 'firstName', message }))
        }))
        return
      }

      // Update profile
      const result = await updateUserProfile(user.user.id, updateData)

      if (result.success) {
        await refreshUser()
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          success: 'Profile updated successfully!'
        }))
        onSuccess?.()
      } else {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          errors: [{ field: 'firstName', message: result.error || 'Failed to update profile' }]
        }))
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: [{ 
          field: 'firstName', 
          message: error instanceof Error ? error.message : 'An unexpected error occurred' 
        }]
      }))
    }
  }

  const getFieldError = (field: keyof ProfileFormData) => {
    return formState.errors.find(error => error.field === field)?.message
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
      
      {formState.success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{formState.success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
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
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('firstName') ? 'border-red-300' : 'border-gray-300'
              }`}
              required
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
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('lastName') ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {getFieldError('lastName') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('lastName')}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('phone') ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="+1234567890"
          />
          {getFieldError('phone') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('phone')}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('bio') ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Tell us about yourself..."
            maxLength={500}
          />
          <p className="mt-1 text-sm text-gray-500">{formData.bio.length}/500 characters</p>
          {getFieldError('bio') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('bio')}</p>
          )}
        </div>

        {/* Preferences */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                checked={formData.preferences.notifications}
                onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
                Receive push notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailUpdates"
                checked={formData.preferences.emailUpdates}
                onChange={(e) => handlePreferenceChange('emailUpdates', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailUpdates" className="ml-2 block text-sm text-gray-900">
                Receive email updates
              </label>
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                id="theme"
                value={formData.preferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value as 'light' | 'dark')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}