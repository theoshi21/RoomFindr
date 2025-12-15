'use client'

import { useState, useEffect } from 'react'
import { Reservation } from '@/types/reservation'
import { reservationService, formatReservationStatus, formatPaymentStatus } from '@/lib/reservation'
import { 
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ReservationManagementProps {
  userId: string
  userRole: 'tenant' | 'landlord'
  onReservationUpdate?: () => void
}

export default function ReservationManagement({ 
  userId, 
  userRole, 
  onReservationUpdate 
}: ReservationManagementProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadReservations()
  }, [userId])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const data = await reservationService.getReservations(userId)
      setReservations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReservation = async (reservationId: string) => {
    try {
      setActionLoading(reservationId)
      await reservationService.confirmReservation(reservationId)
      await loadReservations()
      onReservationUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm reservation')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelReservation = async (reservationId: string, reason: string = 'User cancelled') => {
    try {
      setActionLoading(reservationId)
      const result = await reservationService.cancelReservation(reservationId, reason)
      
      if (result.success) {
        await loadReservations()
        onReservationUpdate?.()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel reservation')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusIcon = (status: Reservation['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canConfirm = (reservation: Reservation) => {
    return userRole === 'landlord' && 
           reservation.status === 'pending' && 
           reservation.paymentStatus === 'paid'
  }

  const canCancel = (reservation: Reservation) => {
    return reservation.status === 'pending' || reservation.status === 'confirmed'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading reservations...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          <p className="text-red-800">{error}</p>
        </div>
        <button
          onClick={() => {
            setError(null)
            loadReservations()
          }}
          className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reservations</h3>
        <p className="text-gray-600">
          {userRole === 'tenant' 
            ? "You haven't made any reservations yet." 
            : "You don't have any reservation requests yet."
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {userRole === 'tenant' ? 'My Reservations' : 'Reservation Requests'}
        </h2>
        <button
          onClick={loadReservations}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6">
        {reservations.map((reservation) => (
          <div key={reservation.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(reservation.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Reservation #{reservation.id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Created {reservation.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                    {formatReservationStatus(reservation.status)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    reservation.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : reservation.paymentStatus === 'refunded'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {formatPaymentStatus(reservation.paymentStatus)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarIcon className="h-4 w-4" />
                  <div>
                    <div className="text-xs text-gray-500">Move-in</div>
                    <div className="text-sm font-medium">
                      {reservation.startDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {reservation.endDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="h-4 w-4" />
                    <div>
                      <div className="text-xs text-gray-500">Move-out</div>
                      <div className="text-sm font-medium">
                        {reservation.endDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <div>
                    <div className="text-xs text-gray-500">Monthly Rent</div>
                    <div className="text-sm font-medium">
                      ₱{reservation.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <div>
                    <div className="text-xs text-gray-500">Deposit</div>
                    <div className="text-sm font-medium">
                      ₱{reservation.depositAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {canConfirm(reservation) && (
                  <button
                    onClick={() => handleConfirmReservation(reservation.id)}
                    disabled={actionLoading === reservation.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === reservation.id ? 'Confirming...' : 'Confirm Reservation'}
                  </button>
                )}

                {canCancel(reservation) && (
                  <button
                    onClick={() => handleCancelReservation(reservation.id)}
                    disabled={actionLoading === reservation.id}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === reservation.id ? 'Cancelling...' : 'Cancel Reservation'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedReservation(reservation)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reservation Details Modal */}
      {selectedReservation && (
        <ReservationDetailsModal
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
        />
      )}
    </div>
  )
}

interface ReservationDetailsModalProps {
  reservation: Reservation
  onClose: () => void
}

function ReservationDetailsModal({ reservation, onClose }: ReservationDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Reservation Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XCircleIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Reservation Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Reservation ID:</span>
                  <div className="font-medium">{reservation.id}</div>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="font-medium">{formatReservationStatus(reservation.status)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Payment Status:</span>
                  <div className="font-medium">{formatPaymentStatus(reservation.paymentStatus)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">{reservation.createdAt.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Stay Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Move-in Date:</span>
                  <div className="font-medium">{reservation.startDate.toLocaleDateString()}</div>
                </div>
                {reservation.endDate && (
                  <div>
                    <span className="text-gray-500">Move-out Date:</span>
                    <div className="font-medium">{reservation.endDate.toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Financial Details</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rent:</span>
                    <span className="font-medium">₱{reservation.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit:</span>
                    <span className="font-medium">₱{reservation.depositAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Upfront:</span>
                      <span>₱{(reservation.totalAmount + reservation.depositAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}