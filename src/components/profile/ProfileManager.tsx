'use client'

import React, { useState } from 'react'
import { ProfileDisplay } from './ProfileDisplay'
import { ProfileForm } from './ProfileForm'
import { AvatarUpload } from './AvatarUpload'

type ProfileView = 'display' | 'edit' | 'avatar'

interface ProfileManagerProps {
  initialView?: ProfileView
  showEmail?: boolean
  showRole?: boolean
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  initialView = 'display',
  showEmail = true,
  showRole = true
}) => {
  const [currentView, setCurrentView] = useState<ProfileView>(initialView)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleEditProfile = () => {
    setCurrentView('edit')
    setMessage(null)
  }

  const handleEditAvatar = () => {
    setCurrentView('avatar')
    setMessage(null)
  }

  const handleFormSuccess = () => {
    setMessage({ type: 'success', text: 'Profile updated successfully!' })
    setCurrentView('display')
  }

  const handleFormCancel = () => {
    setCurrentView('display')
    setMessage(null)
  }

  const handleAvatarSuccess = (url: string) => {
    setMessage({ 
      type: 'success', 
      text: url ? 'Avatar updated successfully!' : 'Avatar removed successfully!' 
    })
    setCurrentView('display')
  }

  const handleAvatarError = (error: string) => {
    setMessage({ type: 'error', text: error })
  }

  const clearMessage = () => {
    setMessage(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex justify-between items-center">
            <p>{message.text}</p>
            <button
              onClick={clearMessage}
              className="text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentView('display')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'display'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setCurrentView('edit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'edit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setCurrentView('avatar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'avatar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Avatar
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {currentView === 'display' && (
          <ProfileDisplay
            showEmail={showEmail}
            showRole={showRole}
            onEdit={handleEditProfile}
          />
        )}

        {currentView === 'edit' && (
          <ProfileForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}

        {currentView === 'avatar' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Avatar</h2>
              <AvatarUpload
                onSuccess={handleAvatarSuccess}
                onError={handleAvatarError}
              />
              <div className="mt-6">
                <button
                  onClick={() => setCurrentView('display')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}