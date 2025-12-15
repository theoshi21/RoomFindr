'use client'

import React, { useState, useEffect } from 'react'
import { getSystemAnalytics } from '../../lib/admin'
import type { SystemAnalyticsData as SystemAnalyticsType } from '../../types/admin'

interface SystemAnalyticsProps {
  className?: string
}

export const SystemAnalytics: React.FC<SystemAnalyticsProps> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<SystemAnalyticsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSystemAnalytics()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">Failed to load analytics</div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">System Analytics</h2>
        <p className="text-sm text-gray-600 mt-1">Platform performance and usage statistics</p>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalUsers.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${getGrowthColor(analytics.monthlyGrowth.users)}`}>
                  {formatPercentage(analytics.monthlyGrowth.users)}
                </p>
                <p className="text-xs text-blue-700">vs last month</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-800">
              {analytics.activeUsers} active ({((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)}%)
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Properties</p>
                <p className="text-2xl font-bold text-green-900">{analytics.totalProperties.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${getGrowthColor(analytics.monthlyGrowth.properties)}`}>
                  {formatPercentage(analytics.monthlyGrowth.properties)}
                </p>
                <p className="text-xs text-green-700">vs last month</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-green-800">
              {analytics.activeProperties} active ({((analytics.activeProperties / analytics.totalProperties) * 100).toFixed(1)}%)
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">Reservations</p>
                <p className="text-2xl font-bold text-purple-900">{analytics.totalReservations.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${getGrowthColor(analytics.monthlyGrowth.reservations)}`}>
                  {formatPercentage(analytics.monthlyGrowth.reservations)}
                </p>
                <p className="text-xs text-purple-700">vs last month</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-purple-800">
              {analytics.completedReservations} completed ({((analytics.completedReservations / analytics.totalReservations) * 100).toFixed(1)}%)
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-900">Revenue</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(analytics.totalRevenue)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${getGrowthColor(analytics.monthlyGrowth.revenue)}`}>
                  {formatPercentage(analytics.monthlyGrowth.revenue)}
                </p>
                <p className="text-xs text-yellow-700">vs last month</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-yellow-800">
              From {analytics.completedReservations} bookings
            </div>
          </div>
        </div>

        {/* User Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Users by Role</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tenants</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.usersByRole.tenant / analytics.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {analytics.usersByRole.tenant}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Landlords</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.usersByRole.landlord / analytics.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {analytics.usersByRole.landlord}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Admins</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.usersByRole.admin / analytics.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {analytics.usersByRole.admin}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Landlord Verification</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Landlords</span>
                <span className="text-lg font-semibold text-gray-900">{analytics.totalLandlords}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verified</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-green-600">{analytics.verifiedLandlords}</span>
                  <span className="text-sm text-gray-500">
                    ({analytics.totalLandlords > 0 ? ((analytics.verifiedLandlords / analytics.totalLandlords) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Verification</span>
                <span className="text-lg font-semibold text-yellow-600">{analytics.pendingVerifications}</span>
              </div>
              
              {analytics.pendingVerifications > 0 && (
                <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    {analytics.pendingVerifications} landlord{analytics.pendingVerifications !== 1 ? 's' : ''} awaiting verification
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity (Last 30 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.recentActivity.newUsers}</div>
              <div className="text-sm text-gray-600">New Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.recentActivity.newProperties}</div>
              <div className="text-sm text-gray-600">New Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.recentActivity.newReservations}</div>
              <div className="text-sm text-gray-600">New Reservations</div>
            </div>
          </div>
        </div>

        {/* Platform Health Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Uptime</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">99.9%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database Performance</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">95%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Response Time</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">120ms avg</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Content Moderation</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Flagged Content</span>
                <span className="text-lg font-semibold text-red-600">3</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Reviews</span>
                <span className="text-lg font-semibold text-yellow-600">12</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-Moderated</span>
                <span className="text-lg font-semibold text-green-600">45</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium text-gray-900">2.3 hours avg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Geographic Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">45%</div>
              <div className="text-sm text-gray-600">Metro Manila</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">20%</div>
              <div className="text-sm text-gray-600">Cebu</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">15%</div>
              <div className="text-sm text-gray-600">Davao</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">20%</div>
              <div className="text-sm text-gray-600">Other Cities</div>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.totalRevenue)}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Platform commission from bookings
              </div>
            </div>
            
            <div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.totalRevenue * 0.15)}</div>
                <div className="text-sm text-gray-600">This Month</div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                {formatPercentage(analytics.monthlyGrowth.revenue)} vs last month
              </div>
            </div>
            
            <div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.totalRevenue / analytics.completedReservations)}</div>
                <div className="text-sm text-gray-600">Avg. Booking Value</div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Per completed reservation
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemAnalytics