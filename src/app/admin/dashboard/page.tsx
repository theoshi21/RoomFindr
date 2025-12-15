'use client'

import { useState } from 'react'
import { ProtectedRoute } from '../../../components/auth'
import { DashboardNavigation, AdminDashboard } from '../../../components/dashboard'

type ActiveView = 'overview' | 'users' | 'verifications' | 'reviews' | 'analytics' | 'create-admin' | 'announcements' | 'audit-logs'

export default function AdminDashboardPage() {
  const [activeView, setActiveView] = useState<ActiveView>('overview')

  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'verifications', name: 'Verifications', icon: '✅' },
    { id: 'reviews', name: 'Content Moderation', icon: '⭐' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'create-admin', name: 'Create Admin', icon: '➕' },
    { id: 'announcements', name: 'Announcements', icon: '📢' },
    { id: 'audit-logs', name: 'Audit Logs', icon: '📋' }
  ]

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DashboardNavigation
              title="Admin Dashboard"
              items={navigationItems}
              activeItem={activeView}
              onItemClick={(itemId) => setActiveView(itemId as ActiveView)}
            />

            <AdminDashboard
              activeView={activeView}
              onViewChange={(view) => setActiveView(view as ActiveView)}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}