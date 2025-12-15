'use client'

import { useState } from 'react'
import { Property } from '@/types/property'
import { Reservation } from '@/types/reservation'
import { 
  XMarkIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  StarIcon,
  ShareIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { ReservationContainer } from '@/components/reservation'
import { RoommateManager } from '@/components/roommate'
import { ReviewList, ReviewStats, ReviewForm } from '@/components/review'
import { ListingPolicyDisplay } from '@/components/policy'
import { useAuth } from '@/contexts/AuthContext'

interface PropertyDetailViewProps {
  property: Property
  onClose: () => void
  onReserve?: (property: Property) => void
}

export default function PropertyDetailView({ property, onClose, onReserve }: PropertyDetailViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'roommates' | 'reviews'>('details')
  const [showReviewForm, setShowReviewForm] = useState(false)
  
  const { user } = useAuth()

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!property.images || property.images.length === 0) return
    
    if (direction === 'prev') {
      setCurrentImageIndex(prev => 
        prev === 0 ? property.images.length - 1 : prev - 1
      )
    } else {
      setCurrentImageIndex(prev => 
        prev === property.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const availableSlots = property.availability.maxOccupancy - property.availability.currentOccupancy

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              {isFavorited ? (
                <HeartIconSolid className="h-6 w-6 text-red-500" />
              ) : (
                <HeartIcon className="h-6 w-6 text-gray-400" />
              )}
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ShareIcon className="h-6 w-6 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Property Details
              </button>
              {property.roomType === 'shared' && (
                <button
                  onClick={() => setActiveTab('roommates')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'roommates'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Roommate Information
                </button>
              )}
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reviews
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'roommates' && property.roomType === 'shared' ? (
            <div className="p-6">
              <RoommateManager
                propertyId={property.id}
                currentUserId={user?.user.id || ''}
                isCurrentUserTenant={user?.user.role === 'tenant'}
              />
            </div>
          ) : activeTab === 'reviews' ? (
            <div className="p-6 space-y-6">
              {/* Review Stats */}
              <ReviewStats propertyId={property.id} showDetailed={true} />
              
              {/* Write Review Button */}
              {user?.user.role === 'tenant' && !showReviewForm && (
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Write a Review
                  </button>
                </div>
              )}
              
              {/* Review Form */}
              {showReviewForm && (
                <ReviewForm
                  propertyId={property.id}
                  landlordId={property.landlordId}
                  onReviewSubmitted={() => setShowReviewForm(false)}
                  onCancel={() => setShowReviewForm(false)}
                />
              )}
              
              {/* Reviews List */}
              <ReviewList
                propertyId={property.id}
                currentUserId={user?.user.id}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="relative">
                {property.images && property.images.length > 0 ? (
                  <>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img
                        src={property.images[currentImageIndex]}
                        alt={`${property.title} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {property.images.length > 1 && (
                      <>
                        <button
                          onClick={() => handleImageNavigation('prev')}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => handleImageNavigation('next')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                        >
                          →
                        </button>
                        
                        {/* Image Indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {property.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">No Images Available</span>
                  </div>
                )}
              </div>

              {/* Property Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-5 w-5" />
                    <span>{property.address.street}, {property.address.city}, {property.address.province}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <HomeIcon className="h-5 w-5" />
                    <span className="capitalize">{property.roomType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <UsersIcon className="h-5 w-5" />
                    <span>{availableSlots} available</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="h-5 w-5" />
                    <span>Available now</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <StarIcon className="h-5 w-5" />
                    <ReviewStats propertyId={property.id} showDetailed={false} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{property.description}</p>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(showAllAmenities ? property.amenities : property.amenities.slice(0, 6)).map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                  {property.amenities.length > 6 && (
                    <button
                      onClick={() => setShowAllAmenities(!showAllAmenities)}
                      className="mt-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {showAllAmenities ? 'Show Less' : `Show All ${property.amenities.length} Amenities`}
                    </button>
                  )}
                </div>

                {/* Property Policies */}
                <ListingPolicyDisplay propertyId={property.id} />

                {/* Policies */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">House Rules & Policies</h3>
                  <div className="space-y-2 text-gray-700">
                    {property.policies.petPolicy && (
                      <div><strong>Pet Policy:</strong> {property.policies.petPolicy}</div>
                    )}
                    {property.policies.smokingPolicy && (
                      <div><strong>Smoking Policy:</strong> {property.policies.smokingPolicy}</div>
                    )}
                    {property.policies.guestPolicy && (
                      <div><strong>Guest Policy:</strong> {property.policies.guestPolicy}</div>
                    )}
                    {property.policies.cleaningPolicy && (
                      <div><strong>Cleaning Policy:</strong> {property.policies.cleaningPolicy}</div>
                    )}
                    {property.policies.cancellationPolicy && (
                      <div><strong>Cancellation Policy:</strong> {property.policies.cancellationPolicy}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 sticky top-6">
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ₱{property.price.toLocaleString()}
                    </span>
                    <span className="text-gray-600">/ month</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Security deposit: ₱{property.deposit.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Availability</span>
                    <span className="text-green-600 font-medium">
                      {availableSlots} slot{availableSlots !== 1 ? 's' : ''} available
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Move-in Date</span>
                    <span className="text-gray-900">
                      {new Date(property.availability.startDate).toLocaleDateString()}
                    </span>
                  </div>

                  {property.availability.endDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Available Until</span>
                      <span className="text-gray-900">
                        {new Date(property.availability.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowReservationModal(true)}
                    disabled={availableSlots === 0}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      availableSlots > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {availableSlots > 0 ? 'Reserve Now' : 'Not Available'}
                  </button>
                  
                  <button className="w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Contact Landlord
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Monthly rent</span>
                      <span>₱{property.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Security deposit</span>
                      <span>₱{property.deposit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total upfront</span>
                      <span>₱{(property.price + property.deposit).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && (
        <ReservationContainer
          property={property}
          onClose={() => setShowReservationModal(false)}
          onReservationComplete={(reservation: Reservation) => {
            setShowReservationModal(false)
            onReserve?.(property)
          }}
        />
      )}
    </div>
  )
}