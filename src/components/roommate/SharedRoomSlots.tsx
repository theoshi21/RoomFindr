'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon as Plus, 
  UsersIcon as Users, 
  CalendarIcon as Calendar, 
  MapPinIcon as MapPin 
} from '@heroicons/react/24/outline'
import type { SharedRoomInfo, RoommateSlot } from '@/types/roommate'
import { getSharedRoomInfo } from '@/lib/roommate'
import RoommateProfileDisplay from './RoommateProfileDisplay'
import RoommateProfileForm from './RoommateProfileForm'

interface SharedRoomSlotsProps {
  propertyId: string
  currentUserId?: string
  showAddProfile?: boolean
  className?: string
}

export default function SharedRoomSlots({
  propertyId,
  currentUserId,
  showAddProfile = false,
  className = ''
}: SharedRoomSlotsProps) {
  const [roomInfo, setRoomInfo] = useState<SharedRoomInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProfileForm, setShowProfileForm] = useState(false)

  useEffect(() => {
    loadRoomInfo()
  }, [propertyId])

  const loadRoomInfo = async () => {
    setLoading(true)
    setError(null)
    
    const { roomInfo: data, error: err } = await getSharedRoomInfo(propertyId)
    
    if (err) {
      setError(err)
    } else {
      setRoomInfo(data)
    }
    
    setLoading(false)
  }

  const handleProfileCreated = () => {
    setShowProfileForm(false)
    loadRoomInfo() // Refresh room info
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>Error loading room information: {error}</p>
          <button
            onClick={loadRoomInfo}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!roomInfo) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-600">
          <p>Room information not available</p>
        </div>
      </div>
    )
  }

  const currentUserProfile = roomInfo.roommateSlots
    .find(slot => slot.roommateProfile?.userId === currentUserId)?.roommateProfile

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Roommate Information
            </h2>
            <p className="text-gray-600 mt-1">
              {roomInfo.occupiedSlots} of {roomInfo.totalSlots} slots occupied
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {roomInfo.availableSlots}
            </div>
            <div className="text-sm text-gray-600">Available Slots</div>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Occupancy</span>
            <span>{roomInfo.occupiedSlots}/{roomInfo.totalSlots}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(roomInfo.occupiedSlots / roomInfo.totalSlots) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Room Rules and Amenities */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shared Amenities */}
          {roomInfo.sharedAmenities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Shared Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {roomInfo.sharedAmenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Room Rules */}
          {roomInfo.roomRules.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Room Rules</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {roomInfo.roomRules.map((rule, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Roommate Slots */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roomInfo.roommateSlots.map((slot) => (
            <RoommateSlotCard
              key={slot.id}
              slot={slot}
              currentUserProfile={currentUserProfile}
              showAddButton={showAddProfile && !slot.isOccupied && !currentUserProfile}
              onAddProfile={() => setShowProfileForm(true)}
            />
          ))}
        </div>
      </div>

      {/* Profile Form Modal */}
      {showProfileForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Roommate Profile</h3>
                <button
                  onClick={() => setShowProfileForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <RoommateProfileForm
                propertyId={propertyId}
                onSuccess={handleProfileCreated}
                onCancel={() => setShowProfileForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface RoommateSlotCardProps {
  slot: RoommateSlot
  currentUserProfile?: any
  showAddButton?: boolean
  onAddProfile?: () => void
}

function RoommateSlotCard({
  slot,
  currentUserProfile,
  showAddButton,
  onAddProfile
}: RoommateSlotCardProps) {
  if (slot.isOccupied && slot.roommateProfile) {
    return (
      <RoommateProfileDisplay
        profile={slot.roommateProfile}
        currentUserProfile={currentUserProfile}
        showCompatibility={!!currentUserProfile && currentUserProfile.id !== slot.roommateProfile.id}
        className="h-full"
      />
    )
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 h-full flex flex-col justify-center">
      <div className="text-gray-400 mb-4">
        <Users className="w-12 h-12 mx-auto mb-2" />
        <h3 className="text-lg font-medium">Available Slot</h3>
        <p className="text-sm">Slot {slot.slotNumber}</p>
      </div>

      {slot.availableFrom && (
        <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
          <Calendar className="w-4 h-4 mr-1" />
          Available from {new Date(slot.availableFrom).toLocaleDateString()}
        </div>
      )}

      {showAddButton && onAddProfile && (
        <button
          onClick={onAddProfile}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Join as Roommate
        </button>
      )}
    </div>
  )
}