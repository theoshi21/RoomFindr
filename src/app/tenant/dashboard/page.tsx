'use client'

import { useState } from 'react'
import { ProtectedRoute } from '../../../components/auth'
import { DashboardNavigation } from '../../../components/dashboard'
import { useAuth } from '../../../contexts/AuthContext'

type ActiveView = 'overview' | 'search' | 'reservations' | 'roommates' | 'profile' | 'notifications'

export default function TenantDashboardPage() {
  const [activeView, setActiveView] = useState<ActiveView>('overview')
  const { user } = useAuth()

  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'search', name: 'Find Rooms', icon: '🔍' },
    { id: 'reservations', name: 'My Reservations', icon: '📅' },
    { id: 'roommates', name: 'Roommate Matching', icon: '👥' },
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' }
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to RoomFindr!</h2>
              <p className="text-gray-600 mb-4">
                Find your perfect room and connect with great roommates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">🔍 Search Rooms</h3>
                  <p className="text-blue-700 text-sm mt-1">Browse available rooms in your area</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900">👥 Find Roommates</h3>
                  <p className="text-green-700 text-sm mt-1">Connect with compatible roommates</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900">📅 Manage Bookings</h3>
                  <p className="text-purple-700 text-sm mt-1">Track your reservations and applications</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🏠</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Available Rooms</p>
                    <p className="text-2xl font-semibold text-gray-900">150+</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">My Reservations</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Roommate Matches</p>
                    <p className="text-2xl font-semibold text-gray-900">5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'search':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Rooms</h2>
            <p className="text-gray-600 mb-4">Search functionality will be implemented here.</p>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">🔍 Room search coming soon...</p>
            </div>
          </div>
        )

      case 'reservations':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Reservations</h2>
            <p className="text-gray-600 mb-4">Track your room reservations and applications.</p>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">📅 No reservations yet</p>
            </div>
          </div>
        )

      case 'roommates':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Roommate Matching</h2>
            <p className="text-gray-600 mb-4">Find compatible roommates based on your preferences.</p>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">👥 Roommate matching coming soon...</p>
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Profile</h2>
            <p className="text-gray-600 mb-4">Manage your profile information and preferences.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.profile?.first_name} {user?.profile?.last_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user?.user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{user?.user?.role}</p>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
            <p className="text-gray-600 mb-4">Stay updated with important messages and alerts.</p>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">🔔 No new notifications</p>
            </div>
          </div>
        )

      default:
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Select a section from the navigation above.</p>
          </div>
        )
    }
  }

  return (
    <ProtectedRoute requiredRole="tenant">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DashboardNavigation
              title="Tenant Dashboard"
              items={navigationItems}
              activeItem={activeView}
              onItemClick={(itemId) => setActiveView(itemId as ActiveView)}
            />

            <div className="mt-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}