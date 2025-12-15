'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardWidget, QuickActions, RecentActivity } from './index'
import { 
  AdminDashboardStats,
  UserManagement,
  SystemAnalytics,
  CreateAdminForm,
  AnnouncementSystem,
  AuditLogs,
  VerificationReview
} from '../admin'
import ContentModeration from '../admin/ContentModeration'
import PerformanceDashboard from '../admin/PerformanceDashboard'
import { ReviewModeration } from '../review'
import { 
  UsersIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface AdminDashboardProps {
  activeView?: string
  onViewChange?: (view: string) => void
}

export function AdminDashboard({ activeView = 'overview', onViewChange }: AdminDashboardProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    activeListings: 0,
    flaggedContent: 0,
    monthlyRevenue: 0,
    systemHealth: 100
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
        totalUsers: 1247,
        pendingVerifications: 8,
        activeListings: 342,
        flaggedContent: 3,
        monthlyRevenue: 2450000,
        systemHealth: 98
      })

      setRecentActivity([
        {
          id: '1',
          type: 'verification',
          title: 'New Verification Request',
          description: 'Landlord John Smith submitted verification documents',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          status: 'warning',
          actionUrl: '/admin/verifications'
        },
        {
          id: '2',
          type: 'review',
          title: 'Content Flagged',
          description: 'Property listing reported for inappropriate content',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          status: 'error',
          actionUrl: '/admin/reviews'
        },
        {
          id: '3',
          type: 'notification',
          title: 'System Alert',
          description: 'High server load detected - monitoring',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'warning'
        },
        {
          id: '4',
          type: 'verification',
          title: 'Verification Approved',
          description: 'Approved verification for Maria Santos',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'success'
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
      id: 'verifications',
      title: 'Review Verifications',
      description: 'Review pending landlord verification requests',
      icon: '✅',
      color: 'yellow' as const,
      onClick: () => onViewChange?.('verifications'),
      badge: stats.pendingVerifications > 0 ? stats.pendingVerifications.toString() : undefined
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: '👥',
      color: 'blue' as const,
      onClick: () => onViewChange?.('users')
    },
    {
      id: 'content-moderation',
      title: 'Content Moderation',
      description: 'Review flagged content and moderate listings',
      icon: '🛡️',
      color: 'red' as const,
      onClick: () => onViewChange?.('reviews'),
      badge: stats.flaggedContent > 0 ? stats.flaggedContent.toString() : undefined
    },
    {
      id: 'review-moderation',
      title: 'Review Moderation',
      description: 'Moderate user reviews and ratings',
      icon: '⭐',
      color: 'yellow' as const,
      onClick: () => onViewChange?.('review-moderation')
    },
    {
      id: 'analytics',
      title: 'System Analytics',
      description: 'View platform usage statistics and performance metrics',
      icon: '📊',
      color: 'purple' as const,
      onClick: () => onViewChange?.('analytics')
    },
    {
      id: 'announcements',
      title: 'Send Announcements',
      description: 'Create and send system-wide announcements to users',
      icon: '📢',
      color: 'green' as const,
      onClick: () => onViewChange?.('announcements')
    },
    {
      id: 'create-admin',
      title: 'Create Admin',
      description: 'Add new administrator accounts to the system',
      icon: '➕',
      color: 'indigo' as const,
      onClick: () => onViewChange?.('create-admin')
    }
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement />
      
      case 'verifications':
        return user?.user.id ? (
          <VerificationReview adminId={user.user.id} />
        ) : null
      
      case 'reviews':
        return <ContentModeration />
      
      case 'review-moderation':
        return user?.user.id ? (
          <ReviewModeration currentUserId={user.user.id} />
        ) : null
      
      case 'analytics':
        return <SystemAnalytics />
      
      case 'create-admin':
        return <CreateAdminForm />
      
      case 'announcements':
        return <AnnouncementSystem />
      
      case 'audit-logs':
        return <AuditLogs />
      
      case 'performance':
        return <PerformanceDashboard />
      
      case 'overview':
      default:
        return (
          <div className="space-y-6">
            {/* System Health Alert */}
            {stats.systemHealth < 95 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="text-yellow-800 font-medium">System Performance Alert</h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      System health is at {stats.systemHealth}%. Please monitor server performance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardWidget
                title="Total Users"
                value={stats.totalUsers}
                subtitle="Registered users"
                icon={<UsersIcon className="h-6 w-6" />}
                color="blue"
                loading={loading}
                trend={{ value: 8, label: 'vs last month', isPositive: true }}
                onClick={() => onViewChange?.('users')}
              />
              
              <DashboardWidget
                title="Pending Verifications"
                value={stats.pendingVerifications}
                subtitle="Awaiting review"
                icon={<CheckCircleIcon className="h-6 w-6" />}
                color="yellow"
                loading={loading}
                onClick={() => onViewChange?.('verifications')}
              />
              
              <DashboardWidget
                title="Active Listings"
                value={stats.activeListings}
                subtitle="Live properties"
                icon={<ChartBarIcon className="h-6 w-6" />}
                color="green"
                loading={loading}
                trend={{ value: 15, label: 'vs last month', isPositive: true }}
              />
              
              <DashboardWidget
                title="System Health"
                value={`${stats.systemHealth}%`}
                subtitle="Overall performance"
                icon={<ShieldCheckIcon className="h-6 w-6" />}
                color={stats.systemHealth >= 95 ? 'green' : 'yellow'}
                loading={loading}
              />
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardWidget
                title="Platform Revenue"
                value={`₱${stats.monthlyRevenue.toLocaleString()}`}
                subtitle="This month"
                icon={<CogIcon className="h-6 w-6" />}
                color="purple"
                loading={loading}
                trend={{ value: 22, label: 'vs last month', isPositive: true }}
                onClick={() => onViewChange?.('analytics')}
              />
              
              <DashboardWidget
                title="Flagged Content"
                value={stats.flaggedContent}
                subtitle="Requires moderation"
                icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                color={stats.flaggedContent > 0 ? 'red' : 'green'}
                loading={loading}
                onClick={() => onViewChange?.('reviews')}
              />
              
              <DashboardWidget
                title="Admin Actions"
                value="View Logs"
                subtitle="Recent admin activity"
                icon={<CogIcon className="h-6 w-6" />}
                color="gray"
                onClick={() => onViewChange?.('audit-logs')}
              />
            </div>

            {/* Quick Actions */}
            <QuickActions
              title="Administrative Tools"
              actions={quickActions}
              columns={3}
            />

            {/* Recent Activity */}
            <RecentActivity
              title="Recent System Activity"
              activities={recentActivity}
              onViewAll={() => onViewChange?.('audit-logs')}
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