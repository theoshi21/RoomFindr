'use client'

import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { UserProfile, UserPreferences } from '../../types/profile'

interface ProfileDisplayProps {
  profile?: UserProfile
  showEmail?: boolean
  showRole?: boolean
  compact?: boolean
  onEdit?: () => void
}

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  profile,
  showEmail = false,
  showRole = false,
  compact = false,
  onEdit
}) => {
  const { user } = useAuth()
  
  // Use provided profile or current user's profile
  const displayProfile = profile || user?.profile
  const displayUser = user?.user

  if (!displayProfile || !displayUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">No profile information available</div>
      </div>
    )
  }

  const fullName = `${displayProfile.first_name} ${displayProfile.last_name}`.trim()
  const hasAvatar = Boolean(displayProfile.avatar)

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        {/* Compact Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
          {hasAvatar ? (
            <img
              src={displayProfile.avatar || ''}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <span className="text-sm font-medium text-gray-600">
                {displayProfile.first_name.charAt(0)}{displayProfile.last_name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Compact Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fullName}
          </p>
          {showRole && (
            <p className="text-xs text-gray-500 capitalize">
              {displayUser.role}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header with Edit Button */}
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Avatar Section */}
        <div className="flex-shrink-0 mb-6 md:mb-0">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg mx-auto md:mx-0">
            {hasAvatar ? (
              <img
                src={displayProfile.avatar || ''}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                <span className="text-2xl font-medium text-gray-600">
                  {displayProfile.first_name.charAt(0)}{displayProfile.last_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="flex-1 space-y-4">
          {/* Name */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{fullName}</h3>
            {showRole && (
              <p className="text-sm text-gray-600 capitalize mt-1">
                {displayUser.role}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            {showEmail && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                {displayUser.email}
              </div>
            )}

            {displayProfile.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {displayProfile.phone}
              </div>
            )}
          </div>

          {/* Bio */}
          {displayProfile.bio && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">About</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {displayProfile.bio}
              </p>
            </div>
          )}

          {/* Account Status */}
          <div className="flex items-center space-x-4 text-xs">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${
              displayUser.is_verified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {displayUser.is_verified ? 'Verified' : 'Unverified'}
            </span>
            
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${
              displayUser.is_active 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {displayUser.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Preferences (if available) */}
          {displayProfile.preferences && typeof displayProfile.preferences === 'object' && 
           'notifications' in displayProfile.preferences && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preferences</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    (displayProfile.preferences as UserPreferences).notifications ? 'bg-green-400' : 'bg-gray-300'
                  }`}></span>
                  Notifications
                </div>
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    (displayProfile.preferences as UserPreferences).emailUpdates ? 'bg-green-400' : 'bg-gray-300'
                  }`}></span>
                  Email Updates
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-2 bg-blue-400"></span>
                  {(displayProfile.preferences as UserPreferences).theme === 'dark' ? 'Dark' : 'Light'} Theme
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}