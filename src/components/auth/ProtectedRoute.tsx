'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'tenant' | 'landlord'
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/auth/login'
}) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      if (requiredRole && user.user.role !== requiredRole) {
        // Redirect to appropriate dashboard based on user role
        switch (user.user.role) {
          case 'admin':
            router.push('/admin/dashboard')
            break
          case 'landlord':
            router.push('/landlord/dashboard')
            break
          case 'tenant':
            router.push('/tenant/dashboard')
            break
          default:
            router.push('/dashboard')
        }
        return
      }

      // Check if user is verified (for landlords especially)
      if (user.user.role === 'landlord' && !user.user.is_verified) {
        router.push('/landlord/verification')
        return
      }
    }
  }, [user, loading, requiredRole, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (requiredRole && user.user.role !== requiredRole) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}