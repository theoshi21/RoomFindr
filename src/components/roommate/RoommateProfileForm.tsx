'use client'

import { useState } from 'react'
import { 
  CheckIcon as Save, 
  XMarkIcon as X 
} from '@heroicons/react/24/outline'
import type { 
  RoommateProfileFormData, 
  LifestylePreferences, 
  CompatibilityPreferences, 
  PrivacySettings 
} from '@/types/roommate'
import { createRoommateProfile } from '@/lib/roommate'

interface RoommateProfileFormProps {
  propertyId: string
  onSuccess: () => void
  onCancel: () => void
  className?: string
}

const defaultLifestyle: LifestylePreferences = {
  sleepSchedule: 'normal',
  cleanliness: 'clean',
  socialLevel: 'moderate',
  noiseLevel: 'moderate',
  guestPolicy: 'occasional',
  smokingPreference: 'non_smoker',
  petPreference: 'no_pets'
}

const defaultCompatibility: CompatibilityPreferences = {
  preferredAgeRange: { min: 18, max: 65 },
  preferredGender: 'any',
  preferredOccupation: [],
  dealBreakers: [],
  importantQualities: []
}

const defaultPrivacy: PrivacySettings = {
  showFullName: true,
  showAge: true,
  showOccupation: true,
  showBio: true,
  showLifestyle: true,
  showCompatibility: false,
  showContactInfo: false
}

export default function RoommateProfileForm({
  propertyId,
  onSuccess,
  onCancel,
  className = ''
}: RoommateProfileFormProps) {
  const [formData, setFormData] = useState<RoommateProfileFormData>({
    bio: '',
    age: 25,
    occupation: '',
    lifestyle: defaultLifestyle,
    compatibility: defaultCompatibility,
    privacySettings: defaultPrivacy
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { profile, error: err } = await createRoommateProfile(propertyId, formData)
    
    if (err) {
      setError(err)
    } else if (profile) {
      onSuccess()
    }
    
    setLoading(false)
  }

  const updateLifestyle = (key: keyof LifestylePreferences, value: string) => {
    setFormData(prev => ({
      ...prev,
      lifestyle: {
        ...prev.lifestyle,
        [key]: value
      }
    }))
  }

  const updateCompatibility = (key: keyof CompatibilityPreferences, value: any) => {
    setFormData(prev => ({
      ...prev,
      compatibility: {
        ...prev.compatibility,
        [key]: value
      }
    }))
  }

  const updatePrivacy = (key: keyof PrivacySettings, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [key]: value
      }
    }))
  }

  const addToArray = (field: 'preferredOccupation' | 'dealBreakers' | 'importantQualities', value: string) => {
    if (value.trim()) {
      updateCompatibility(field, [...formData.compatibility[field], value.trim()])
    }
  }

  const removeFromArray = (field: 'preferredOccupation' | 'dealBreakers' | 'importantQualities', index: number) => {
    const newArray = [...formData.compatibility[field]]
    newArray.splice(index, 1)
    updateCompatibility(field, newArray)
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              min="18"
              max="100"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Occupation
            </label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Software Engineer, Student"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell potential roommates about yourself..."
            required
          />
        </div>
      </div>

      {/* Lifestyle Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Lifestyle Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sleep Schedule
            </label>
            <select
              value={formData.lifestyle.sleepSchedule}
              onChange={(e) => updateLifestyle('sleepSchedule', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="early">Early Bird (Before 10 PM)</option>
              <option value="normal">Normal Hours (10 PM - 12 AM)</option>
              <option value="late">Night Owl (After 12 AM)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cleanliness Level
            </label>
            <select
              value={formData.lifestyle.cleanliness}
              onChange={(e) => updateLifestyle('cleanliness', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="very_clean">Very Clean</option>
              <option value="clean">Clean</option>
              <option value="moderate">Moderate</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Social Level
            </label>
            <select
              value={formData.lifestyle.socialLevel}
              onChange={(e) => updateLifestyle('socialLevel', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="very_social">Very Social</option>
              <option value="social">Social</option>
              <option value="moderate">Moderate</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Noise Level
            </label>
            <select
              value={formData.lifestyle.noiseLevel}
              onChange={(e) => updateLifestyle('noiseLevel', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="quiet">Quiet</option>
              <option value="moderate">Moderate</option>
              <option value="lively">Lively</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Policy
            </label>
            <select
              value={formData.lifestyle.guestPolicy}
              onChange={(e) => updateLifestyle('guestPolicy', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="no_guests">No Guests</option>
              <option value="occasional">Occasional Guests</option>
              <option value="frequent">Frequent Guests</option>
              <option value="anytime">Guests Anytime</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Smoking Preference
            </label>
            <select
              value={formData.lifestyle.smokingPreference}
              onChange={(e) => updateLifestyle('smokingPreference', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="non_smoker">Non-Smoker</option>
              <option value="outdoor_only">Outdoor Only</option>
              <option value="smoker">Smoker</option>
            </select>
          </div>
        </div>
      </div>

      {/* Compatibility Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Compatibility Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Age Range
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="18"
                max="100"
                value={formData.compatibility.preferredAgeRange.min}
                onChange={(e) => updateCompatibility('preferredAgeRange', {
                  ...formData.compatibility.preferredAgeRange,
                  min: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min"
              />
              <span className="self-center">to</span>
              <input
                type="number"
                min="18"
                max="100"
                value={formData.compatibility.preferredAgeRange.max}
                onChange={(e) => updateCompatibility('preferredAgeRange', {
                  ...formData.compatibility.preferredAgeRange,
                  max: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Max"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Gender
            </label>
            <select
              value={formData.compatibility.preferredGender}
              onChange={(e) => updateCompatibility('preferredGender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-Binary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
        <p className="text-sm text-gray-600">Choose what information to share with potential roommates</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formData.privacySettings).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => updatePrivacy(key as keyof PrivacySettings, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Show {key.replace(/([A-Z])/g, ' $1').toLowerCase().replace('show ', '')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Profile'}
        </button>
      </div>
    </form>
  )
}