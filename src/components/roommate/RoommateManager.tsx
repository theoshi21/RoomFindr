'use client'

import { useState, useEffect } from 'react'
import { 
  UsersIcon as Users, 
  CogIcon as Settings, 
  HeartIcon as Heart, 
  HomeIcon as Home 
} from '@heroicons/react/24/outline'
import type { RoommateProfile } from '@/types/roommate'
import { getRoommateProfile } from '@/lib/roommate'
import SharedRoomSlots from './SharedRoomSlots'
import CompatibilityMatcher from './CompatibilityMatcher'
import RoommateProfileForm from './RoommateProfileForm'
import RoommateProfileDisplay from './RoommateProfileDisplay'

interface RoommateManagerProps {
  propertyId: string
  currentUserId: string
  isCurrentUserTenant?: boolean
  className?: string
}

type ActiveTab = 'overview' | 'compatibility' | 'profile'

export default function RoommateManager({
  propertyId,
  currentUserId,
  isCurrentUserTenant = false,
  className = ''
}: RoommateManagerProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [currentUserProfile, setCurrentUserProfile] = useState<RoommateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCurrentUserProfile()
  }, [propertyId, currentUserId])

  const loadCurrentUserProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      // Try to find current user's roommate profile for this property
      // This would need to be implemented in the roommate library
      // For now, we'll set it to null and handle the case where user doesn't have a profile
      setCurrentUserProfile(null)
    } catch (err) {
      setError('Failed to load user profile')
    }
    
    setLoading(false)
  }

  const handleProfileCreated = () => {
    loadCurrentUserProfile()
    setActiveTab('overview')
  }

  const tabs = [
    {
      id: 'overview' as ActiveTab,
      label: 'Room Overview',
      icon: Home,
      description: 'View all roommate slots and room information'
    },
    {
      id: 'compatibility' as ActiveTab,
      label: 'Find Matches',
      icon: Heart,
      description: 'Find compatible roommates',
      disabled: !currentUserProfile
    },
    {
      id: 'profile' as ActiveTab,
      label: 'My Profile',
      icon: Settings,
      description: 'Manage your roommate profile'
    }
  ]

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isDisabled = tab.disabled
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : isDisabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                title={isDisabled ? 'Create a roommate profile first' : tab.description}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-0">
        {activeTab === 'overview' && (
          <SharedRoomSlots
            propertyId={propertyId}
            currentUserId={currentUserId}
            showAddProfile={isCurrentUserTenant && !currentUserProfile}
          />
        )}

        {activeTab === 'compatibility' && currentUserProfile && (
          <div className="p-6">
            <CompatibilityMatcher
              propertyId={propertyId}
              currentUserProfileId={currentUserProfile.id}
              currentUserProfile={currentUserProfile}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-6">
            {currentUserProfile ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Your Roommate Profile</h3>
                  <button
                    onClick={() => {/* TODO: Implement edit mode */}}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
                
                <RoommateProfileDisplay
                  profile={currentUserProfile}
                  showPrivateInfo={true}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Create Your Roommate Profile
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Set up your profile to connect with compatible roommates and join shared rooms.
                  </p>
                </div>

                <RoommateProfileForm
                  propertyId={propertyId}
                  onSuccess={handleProfileCreated}
                  onCancel={() => setActiveTab('overview')}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-6 border-t border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={loadCurrentUserProfile}
              className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}