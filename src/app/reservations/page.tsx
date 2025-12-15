'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ReservationManagement } from '@/components/reservation'
import { ProtectedRoute } from '@/components/auth'

export default function ReservationsPage() {
  const { user } = useAuth()

  if (!user) {
    return null // ProtectedRoute will handle redirect
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ReservationManagement
            userId={user.user.id}
            userRole={user.user.role as 'tenant' | 'landlord'}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}