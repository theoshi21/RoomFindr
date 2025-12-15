'use client'

import { useState } from 'react'
import { Property } from '@/types/property'
import { Reservation, ReservationData } from '@/types/reservation'
import { reservationService } from '@/lib/reservation'
import { useAuth } from '@/contexts/AuthContext'
import ReservationModal from './ReservationModal'
import PaymentModal from './PaymentModal'

interface ReservationContainerProps {
  property: Property
  onClose: () => void
  onReservationComplete?: (reservation: Reservation) => void
}

type ReservationStep = 'reservation' | 'payment' | 'complete'

export default function ReservationContainer({ 
  property, 
  onClose, 
  onReservationComplete 
}: ReservationContainerProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<ReservationStep>('reservation')
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReservationSubmit = async (reservationData: ReservationData) => {
    if (!user) {
      setError('You must be logged in to make a reservation')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Add user ID to reservation data
      const completeReservationData = {
        ...reservationData,
        tenantId: user.user.id
      }

      // Create the reservation
      const newReservation = await reservationService.createReservation(completeReservationData)
      setReservation(newReservation)
      setCurrentStep('payment')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reservation')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentComplete = async (paymentMethod: string, paymentReference?: string) => {
    if (!reservation) return

    try {
      setLoading(true)
      setError(null)

      // Process the payment
      await reservationService.processPayment(reservation.id, paymentMethod, paymentReference)
      
      // Get updated reservation
      const updatedReservation = await reservationService.getReservationById(reservation.id)
      if (updatedReservation) {
        setReservation(updatedReservation)
        onReservationComplete?.(updatedReservation)
      }

      setCurrentStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (currentStep === 'payment' && reservation) {
      // If user closes during payment, they can return to complete payment later
      // The reservation is already created but payment is pending
    }
    onClose()
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to make a reservation. Please log in or create an account to continue.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Redirect to login - this would be handled by your auth system
                window.location.href = '/auth/login'
              }}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => setError(null)}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'complete') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reservation Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your reservation request has been submitted successfully. The landlord will review your request and you'll receive a notification once it's approved.
          </p>
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              <p>Reservation ID: {reservation?.id.slice(-8)}</p>
              <p>Status: Pending Approval</p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {currentStep === 'reservation' && (
        <ReservationModal
          property={property}
          onClose={handleClose}
          onReserve={handleReservationSubmit}
          isLoading={loading}
        />
      )}

      {currentStep === 'payment' && reservation && (
        <PaymentModal
          reservation={reservation}
          onClose={handleClose}
          onPaymentComplete={handlePaymentComplete}
          isLoading={loading}
        />
      )}
    </>
  )
}