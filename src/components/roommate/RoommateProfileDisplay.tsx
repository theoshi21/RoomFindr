'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { RoommateProfile, CompatibilityScore } from '@/types/roommate'
import { calculateCompatibilityScore } from '@/lib/roommate'

interface RoommateProfileDisplayProps {
  profile: RoommateProfile
  currentUserProfile?: RoommateProfile
  showCompatibility?: boolean
  showPrivateInfo?: boolean
  className?: string
}

export default function RoommateProfileDisplay({
  profile,
  currentUserProfile,
  showCompatibility = false,
  showPrivateInfo = false,
  className = ''
}: RoommateProfileDisplayProps) {
  const [compatibilityScore, setCompatibilityScore] = useState<CompatibilityScore | null>(null)

  useEffect(() => {
    if (showCompatibility && currentUserProfile) {
      const score = calculateCompatibilityScore(currentUserProfile, profile)
      setCompatibilityScore(score)
    }
  }, [showCompatibility, currentUserProfile, profile])

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const formatLifestyleValue = (key: string, value: string) => {
    const formatMap: Record<string, Record<string, string>> = {
      sleepSchedule: {
        early: 'Early Bird',
        normal: 'Normal Hours',
        late: 'Night Owl'
      },
      cleanliness: {
        very_clean: 'Very Clean',
        clean: 'Clean',
        moderate: 'Moderate',
        relaxed: 'Relaxed'
      },
      socialLevel: {
        very_social: 'Very Social',
        social: 'Social',
        moderate: 'Moderate',
        private: 'Private'
      },
      noiseLevel: {
        quiet: 'Quiet',
        moderate: 'Moderate',
        lively: 'Lively'
      },
      guestPolicy: {
        no_guests: 'No Guests',
        occasional: 'Occasional',
        frequent: 'Frequent',
        anytime: 'Anytime'
      },
      smokingPreference: {
        non_smoker: 'Non-Smoker',
        outdoor_only: 'Outdoor Only',
        smoker: 'Smoker'
      },
      petPreference: {
        no_pets: 'No Pets',
        cats_only: 'Cats Only',
        dogs_only: 'Dogs Only',
        any_pets: 'Any Pets'
      }
    }
    return formatMap[key]?.[value] || value
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header with avatar and basic info */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
          {profile.avatar ? (
            <Image
              src={profile.avatar}
              alt={`${profile.firstName}'s avatar`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-semibold">
              {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {profile.privacySettings.showFullName || showPrivateInfo
                ? `${profile.firstName} ${profile.lastName}`
                : `${profile.firstName} ${profile.lastName.charAt(0)}.`
              }
            </h3>
            {showCompatibility && compatibilityScore && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCompatibilityColor(compatibilityScore.score)}`}>
                {compatibilityScore.score}% Match
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            {(profile.privacySettings.showAge || showPrivateInfo) && profile.age && (
              <span>Age {profile.age}</span>
            )}
            {(profile.privacySettings.showOccupation || showPrivateInfo) && profile.occupation && (
              <span>• {profile.occupation}</span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {(profile.privacySettings.showBio || showPrivateInfo) && profile.bio && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
          <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Lifestyle Preferences */}
      {(profile.privacySettings.showLifestyle || showPrivateInfo) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Lifestyle</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(profile.lifestyle).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                </span>
                <span className="text-gray-900 font-medium">
                  {formatLifestyleValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compatibility Details */}
      {showCompatibility && compatibilityScore && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Compatibility Details</h4>
          
          {compatibilityScore.matchingFactors.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-green-700 mb-1">Matching Factors</h5>
              <div className="flex flex-wrap gap-1">
                {compatibilityScore.matchingFactors.map((factor, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {compatibilityScore.conflictingFactors.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-red-700 mb-1">Potential Conflicts</h5>
              <div className="flex flex-wrap gap-1">
                {compatibilityScore.conflictingFactors.map((factor, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Move-in Date */}
      <div className="border-t pt-3 mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Move-in Date:</span>
          <span className="text-gray-900 font-medium">
            {new Date(profile.moveInDate).toLocaleDateString()}
          </span>
        </div>
        {profile.moveOutDate && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Move-out Date:</span>
            <span className="text-gray-900 font-medium">
              {new Date(profile.moveOutDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}