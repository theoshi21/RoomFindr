'use client'

import React from 'react'

interface ActivityItem {
  id: string
  type: 'reservation' | 'payment' | 'listing' | 'verification' | 'review' | 'notification'
  title: string
  description: string
  timestamp: Date
  status?: 'success' | 'warning' | 'error' | 'info'
  actionUrl?: string
}

interface RecentActivityProps {
  title?: string
  activities: ActivityItem[]
  maxItems?: number
  showViewAll?: boolean
  onViewAll?: () => void
}

export function RecentActivity({ 
  title = "Recent Activity", 
  activities, 
  maxItems = 5,
  showViewAll = true,
  onViewAll
}: RecentActivityProps) {
  const displayedActivities = activities.slice(0, maxItems)

  const getActivityIcon = (type: ActivityItem['type']) => {
    const icons = {
      reservation: '🏠',
      payment: '💳',
      listing: '📝',
      verification: '✅',
      review: '⭐',
      notification: '🔔'
    }
    return icons[type]
  }

  const getStatusColor = (status?: ActivityItem['status']) => {
    if (!status) return 'text-gray-600'
    
    const colors = {
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      info: 'text-blue-600'
    }
    return colors[status]
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-500">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {showViewAll && activities.length > maxItems && (
          <button
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {displayedActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl flex-shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4 text-right">
                  <div className="text-xs text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                  {activity.status && (
                    <div className={`text-xs font-medium mt-1 ${getStatusColor(activity.status)}`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </div>
                  )}
                </div>
              </div>
              
              {activity.actionUrl && (
                <div className="mt-2">
                  <a
                    href={activity.actionUrl}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    View Details →
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {activities.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <button
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View {activities.length - maxItems} more activities
          </button>
        </div>
      )}
    </div>
  )
}