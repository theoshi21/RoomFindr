'use client'

import { useState } from 'react'
import { Property } from '@/types/property'
import { ReservationData } from '@/types/reservation'
import { ReservationPolicyDisplay } from '@/components/policy'
import { 
  XMarkIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

interface ReservationModalProps {
  property: Property
  onClose: () => void
  onReserve: (reservationData: ReservationData) => void
  isLoading?: boolean
}

export default function ReservationModal({ 
  property, 
  onClose, 
  onReserve, 
  isLoading = false 
}: ReservationModalProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLongTerm, setIsLongTerm] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate costs
  const depositAmount = property.deposit
  const monthlyRent = property.price
  const totalUpfront = monthlyRent + depositAmount

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!startDate) {
      newErrors.startDate = 'Move-in date is required'
    } else {
      const selectedDate = new Date(startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.startDate = 'Move-in date cannot be in the past'
      }
    }

    if (!isLongTerm && !endDate) {
      newErrors.endDate = 'End date is required for short-term stays'
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const reservationData: ReservationData = {
      propertyId: property.id,
      startDate: new Date(startDate),
      endDate: isLongTerm ? undefined : new Date(endDate),
      tenantId: '', // This will be set by the parent component
      depositAmount,
      totalAmount: monthlyRent
    }

    onReserve(reservationData)
  }

  const availableSlots = property.availability.maxOccupancy - property.availability.currentOccupancy

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Reserve Your Room</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {/* Property Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-4">
                {property.images && property.images.length > 0 && (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{property.title}</h3>
                  <div className="flex items-center gap-1 text-gray-600 mt-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="text-sm">{property.address.city}, {property.address.province}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <HomeIcon className="h-4 w-4" />
                      <span className="capitalize">{property.roomType}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      <span>₱{property.price.toLocaleString()}/month</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability Check */}
            {availableSlots === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium">This property is currently at full capacity.</p>
                <p className="text-red-600 text-sm mt-1">Please check back later or contact the landlord for updates.</p>
              </div>
            )}

            {/* Reservation Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Stay Duration Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Stay Duration
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="stayType"
                      checked={isLongTerm}
                      onChange={() => setIsLongTerm(true)}
                      className="mr-2"
                    />
                    <span>Long-term (Monthly)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="stayType"
                      checked={!isLongTerm}
                      onChange={() => setIsLongTerm(false)}
                      className="mr-2"
                    />
                    <span>Short-term (Fixed period)</span>
                  </label>
                </div>
              </div>

              {/* Move-in Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Move-in Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.startDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              {/* Move-out Date (for short-term) */}
              {!isLongTerm && (
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Move-out Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.endDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                  )}
                </div>
              )}

              {/* Cost Breakdown */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Cost Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly rent</span>
                    <span className="text-gray-900">₱{monthlyRent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security deposit</span>
                    <span className="text-gray-900">₱{depositAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900">Total upfront payment</span>
                      <span className="text-gray-900">₱{totalUpfront.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  * Security deposit will be refunded at the end of your stay, subject to property condition and cancellation policy.
                </p>
              </div>

              {/* Property Policies */}
              <ReservationPolicyDisplay propertyId={property.id} />

              {/* Terms and Conditions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Important Information</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Your reservation is subject to landlord approval</li>
                  <li>• Payment will be processed only after approval</li>
                  <li>• Cancellation policy: {property.policies.cancellationPolicy}</li>
                  <li>• You will receive email notifications about your reservation status</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || availableSlots === 0}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    isLoading || availableSlots === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? 'Processing...' : 'Submit Reservation Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}