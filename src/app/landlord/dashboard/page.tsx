'use client'

import { useState } from 'react'
import { ProtectedRoute } from '../../../components/auth'
import { DashboardNavigation, LandlordDashboard } from '../../../components/dashboard'

type ActiveView = 'overview' | 'properties' | 'reservations' | 'transactions' | 'verification' | 'policies' | 'analytics'

export default function LandlordDashboardPage() {
  const [activeView, setActiveView] = useState<ActiveView>('overview')

  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'properties', name: 'Properties', icon: '🏠' },
    { id: 'reservations', name: 'Reservations', icon: '📅' },
    { id: 'verification', name: 'Verification', icon: '✅' },
    { id: 'policies', name: 'Policies', icon: '📋' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'transactions', name: 'Transactions', icon: '💳' }
  ]

  return (
    <ProtectedRoute requiredRole="landlord">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DashboardNavigation
              title="Landlord Dashboard"
              items={navigationItems}
              activeItem={activeView}
              onItemClick={(itemId) => setActiveView(itemId as ActiveView)}
            />

            <LandlordDashboard
              activeView={activeView}
              onViewChange={(view) => setActiveView(view as ActiveView)}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}