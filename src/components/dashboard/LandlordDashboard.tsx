'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardWidget, QuickActions, RecentActivity } from './index'
import { PropertyManagement } from '../property'
import ReservationManagement from '../reservation/ReservationManagement'
import { TransactionHistory } from '../transaction/TransactionHistory'
import { VerificationStatus } from '../verification'
import { PropertyPolicyManager } from '../policy'
import { 
  HomeIcon, 
  CurrencyDollarIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface LandlordDashboardProps {
  activeView?: string
  onViewChange?: (view: string) => void
}

export function LandlordDashboard({ activeView = 'overview', onViewChange }: LandlordDashboardProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    monthlyRevenue: 0,
    pendingReservations: 0,
    occupancyRate: 0,
    totalEarnings: 0
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
        totalProperties: 5,
        activeListings: 4,
        monthlyRevenue: 125000,
        pendingReservations: 3,
        occupancyRate: 85,
        totalEarnings: 450000
      })

      setRecentActivity([
        {
          id: '1',
          type: 'reservation',
          title: 'New Reservation Request',
          description: 'John Doe requested to book your Studio Apartment in BGC',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          status: 'warning',
          actionUrl: '/landlord/reservations'
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Received',
          description: 'Received ₱25,000 monthly rent from Maria Santos',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          status: 'success'
        },
        {
          id: '3',
          type: 'listing',
          title: 'Property Listed',
          description: 'Your new property "Modern Condo in Ortigas" is now live',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'success'
        },
        {
          id: '4',
          type: 'verification',
          title: 'Verification Approved',
          description: 'Your landlord verification has been approved by admin',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'success'
        }
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const isVerified = user?.user.is_verified

  const quickActions = [
    {
      id: 'add-property',
      title: 'Add New Property',
      description: 'Create a new property listing to attract tenants',
      icon: '🏠',
      color: 'green' as const,
      onClick: () => onViewChange?.('properties'),
      disabled: !isVerified
    },
    {
      id: 'manage-properties',
      title: 'Manage Properties',
      description: 'View and edit your existing property listings',
      icon: '🏢',
      color: 'blue' as const,
      onClick: () => onViewChange?.('properties'),
      disabled: !isVerified
    },
    {
      id: 'reservations',
      title: 'Reservation Requests',
      description: 'Review and manage incoming reservation requests',
      icon: '📅',
      color: 'yellow' as const,
      onClick: () => onViewChange?.('reservations'),
      badge: stats.pendingReservations > 0 ? stats.pendingReservations.toString() : undefined
    },
    {
      id: 'policies',
      title: 'Policy Management',
      description: 'Create and manage custom rental policies for your properties',
      icon: '📋',
      color: 'indigo' as const,
      onClick: () => onViewChange?.('policies')
    },
    {
      id: 'verification',
      title: 'Verification Status',
      description: isVerified ? 'View your verification status' : 'Complete your verification to start listing',
      icon: isVerified ? '✅' : '⚠️',
      color: isVerified ? 'green' as const : 'red' as const,
      onClick: () => onViewChange?.('verification')
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      description: 'View detailed analytics about your properties and earnings',
      icon: '📊',
      color: 'purple' as const,
      onClick: () => onViewChange?.('analytics')
    }
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'properties':
        return user?.user.id ? (
          <PropertyManagement landlordId={user.user.id} />
        ) : null
      
      case 'reservations':
        return user?.user.id ? (
          <ReservationManagement
            userId={user.user.id}
            userRole="landlord"
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
      
      case 'verification':
        return user?.user.id ? (
          <VerificationStatus landlordId={user.user.id} />
        ) : null
      
      case 'policies':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Policy Management</h2>
            <p className="text-gray-600 mb-4">
              Manage your policy templates here. You can create custom rental policies that will be applied to your properties.
            </p>
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                Policy management features are coming soon. You'll be able to create and manage custom rental policies for your properties.
              </p>
            </div>
          </div>
        )
      
      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics & Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardWidget
                title="Monthly Revenue"
                value={`₱${stats.monthlyRevenue.toLocaleString()}`}
                subtitle="This month"
                icon={<CurrencyDollarIcon className="h-6 w-6" />}
                color="green"
                trend={{ value: 12, label: 'vs last month', isPositive: true }}
              />
              
              <DashboardWidget
                title="Occupancy Rate"
                value={`${stats.occupancyRate}%`}
                subtitle="Current occupancy"
                icon={<ChartBarIcon className="h-6 w-6" />}
                color="blue"
                trend={{ value: 5, label: 'vs last month', isPositive: true }}
              />
              
              <DashboardWidget
                title="Total Earnings"
                value={`₱${stats.totalEarnings.toLocaleString()}`}
                subtitle="All time"
                icon={<CurrencyDollarIcon className="h-6 w-6" />}
                color="purple"
              />
            </div>
            
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                Detailed analytics and reporting features are coming soon. 
                You'll be able to view property performance, tenant analytics, and financial reports.
              </p>
            </div>
          </div>
        )
      
      case 'overview':
      default:
        return (
          <div className="space-y-6">
            {/* Verification Alert */}
            {!isVerified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="text-yellow-800 font-medium">Verification Required</h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      Please complete your verification process to start listing properties and receiving reservations.
                    </p>
                    <button
                      onClick={() => onViewChange?.('verification')}
                      className="mt-2 text-yellow-800 hover:text-yellow-900 text-sm font-medium underline"
                    >
                      Complete Verification →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardWidget
                title="Total Properties"
                value={stats.totalProperties}
                subtitle={`${stats.activeListings} active listings`}
                icon={<HomeIcon className="h-6 w-6" />}
                color="blue"
                loading={loading}
                onClick={() => onViewChange?.('properties')}
              />
              
              <DashboardWidget
                title="Monthly Revenue"
                value={`₱${stats.monthlyRevenue.toLocaleString()}`}
                subtitle="This month"
                icon={<CurrencyDollarIcon className="h-6 w-6" />}
                color="green"
                loading={loading}
                trend={{ value: 12, label: 'vs last month', isPositive: true }}
                onClick={() => onViewChange?.('analytics')}
              />
              
              <DashboardWidget
                title="Pending Requests"
                value={stats.pendingReservations}
                subtitle="Awaiting response"
                icon={<CalendarIcon className="h-6 w-6" />}
                color="yellow"
                loading={loading}
                onClick={() => onViewChange?.('reservations')}
              />
              
              <DashboardWidget
                title="Occupancy Rate"
                value={`${stats.occupancyRate}%`}
                subtitle="Current occupancy"
                icon={<CheckCircleIcon className="h-6 w-6" />}
                color="purple"
                loading={loading}
                onClick={() => onViewChange?.('analytics')}
              />
            </div>

            {/* Quick Actions */}
            <QuickActions
              title="Manage Your Business"
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