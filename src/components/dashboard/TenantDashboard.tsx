'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardWidget, QuickActions, RecentActivity } from './index'
import ReservationManagement from '../reservation/ReservationManagement'
import { TransactionHistory } from '../transaction/TransactionHistory'
import SearchInterface from '../search/SearchInterface'
import { ProfileManager } from '../profile/ProfileManager'
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  CreditCardIcon, 
  UserIcon,
  CalendarIcon,
  BellIcon
} from '@heroicons/react/24/outline'

interface TenantDashboardProps {
  activeView?: string
  onViewChange?: (view: string) => void
}

export function TenantDashboard({ activeView = 'overview', onViewChange }: TenantDashboardProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    activeReservations: 0,
    totalSpent: 0,
    savedProperties: 0,
    unreadNotifications: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Mock data for now - replace with actual API calls
      setStats({
        activeReservations: 2,
        totalSpent: 45000,
        savedProperties: 8,
        unreadNotifications: 3
      })

      setRecentActivity([
        {
          id: '1',
          type: 'reservation',
          title: 'Reservation Confirmed',
          description: 'Your reservation for Studio Apartment in Makati has been confirmed',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'success',
          actionUrl: '/reservations'
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Processed',
          description: 'Security deposit of ₱15,000 has been processed successfully',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'success'
        },
        {
          id: '3',
          type: 'notification',
          title: 'New Property Match',
          description: 'Found 3 new properties matching your preferences in Quezon City',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'info',
          actionUrl: '/search'
        }
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      id: 'search',
      title: 'Search Rooms',
      description: 'Find your perfect room with our advanced search filters',
      icon: '🔍',
      color: 'blue' as const,
      path: '/search'
    },
    {
      id: 'reservations',
      title: 'My Reservations',
      description: 'View and manage your current and past reservations',
      icon: '🏠',
      color: 'green' as const,
      onClick: () => onViewChange?.('reservations')
    },
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Update your profile and preferences',
      icon: '👤',
      color: 'purple' as const,
      onClick: () => onViewChange?.('profile')
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      description: 'View your payment history and receipts',
      icon: '💳',
      color: 'indigo' as const,
      onClick: () => onViewChange?.('transactions')
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Check your latest notifications and updates',
      icon: '🔔',
      color: 'yellow' as const,
      path: '/notifications',
      badge: stats.unreadNotifications > 0 ? stats.unreadNotifications.toString() : undefined
    },
    {
      id: 'support',
      title: 'Help & Support',
      description: 'Get help with your account or report issues',
      icon: '❓',
      color: 'gray' as const,
      path: '/support'
    }
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'search':
        return (
          <div className="space-y-6">
            <SearchInterface
              onSearch={(filters: any) => console.log('Search:', filters)}
              onFiltersChange={(filters: any) => console.log('Filters:', filters)}
            />
          </div>
        )
      
      case 'reservations':
        return user?.user.id ? (
          <ReservationManagement
            userId={user.user.id}
            userRole="tenant"
            onReservationUpdate={loadDashboardData}
          />
        ) : null
      
      case 'transactions':
        return user?.user.id ? (
          <TransactionHistory
            userId={user.user.id}
            showFilters={true}
            showExport={true}
          />
        ) : null
      
      case 'profile':
        return user?.user.id ? (
          <ProfileManager />
        ) : null
      
      case 'overview':
      default:
        return (
          <div className="space-y-6">
            {/* Stats Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardWidget
                title="Active Reservations"
                value={stats.activeReservations}
                subtitle="Current bookings"
                icon={<HomeIcon className="h-6 w-6" />}
                color="blue"
                loading={loading}
                onClick={() => onViewChange?.('reservations')}
              />
              
              <DashboardWidget
                title="Total Spent"
                value={`₱${stats.totalSpent.toLocaleString()}`}
                subtitle="This year"
                icon={<CreditCardIcon className="h-6 w-6" />}
                color="green"
                loading={loading}
                onClick={() => onViewChange?.('transactions')}
              />
              
              <DashboardWidget
                title="Saved Properties"
                value={stats.savedProperties}
                subtitle="Favorites"
                icon={<CalendarIcon className="h-6 w-6" />}
                color="purple"
                loading={loading}
              />
              
              <DashboardWidget
                title="Notifications"
                value={stats.unreadNotifications}
                subtitle="Unread messages"
                icon={<BellIcon className="h-6 w-6" />}
                color="yellow"
                loading={loading}
                onClick={() => window.location.href = '/notifications'}
              />
            </div>

            {/* Quick Actions */}
            <QuickActions
              title="What would you like to do?"
              actions={quickActions}
              columns={3}
            />

            {/* Recent Activity */}
            <RecentActivity
              activities={recentActivity}
              onViewAll={() => onViewChange?.('activity')}
            />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  )
}