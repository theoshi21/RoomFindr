'use client'

import React, { useState, useEffect } from 'react'
import { AnnouncementCreator } from '../notification'
import { useAuth } from '../../contexts/AuthContext'

interface Announcement {
  id: string
  title: string
  message: string
  target_roles: string[]
  priority: 'low' | 'medium' | 'high'
  created_at: string
  expires_at?: string
  sent_by: {
    id: string
    name: string
    email: string
  }
  recipient_count: number
  read_count: number
}

interface AnnouncementSystemProps {
  className?: string
}

export const AnnouncementSystem: React.FC<AnnouncementSystemProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create')

  useEffect(() => {
    if (activeTab === 'history') {
      loadAnnouncementHistory()
    }
  }, [activeTab])

  const loadAnnouncementHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for now - replace with actual API call
      const mockAnnouncements: Announcement[] = [
        {
          id: '1',
          title: 'System Maintenance Scheduled',
          message: 'We will be performing scheduled maintenance on Sunday, January 21st from 2:00 AM to 4:00 AM PST.',
          target_roles: ['tenant', 'landlord'],
          priority: 'high',
          created_at: '2024-01-15T10:00:00Z',
          expires_at: '2024-01-22T00:00:00Z',
          sent_by: {
            id: 'admin1',
            name: 'System Admin',
            email: 'admin@roomfindr.com'
          },
          recipient_count: 1247,
          read_count: 892
        },
        {
          id: '2',
          title: 'New Feature: Enhanced Search Filters',
          message: 'We have added new search filters to help you find the perfect room more easily.',
          target_roles: ['tenant'],
          priority: 'medium',
          created_at: '2024-01-10T14:30:00Z',
          sent_by: {
            id: 'admin1',
            name: 'System Admin',
            email: 'admin@roomfindr.com'
          },
          recipient_count: 856,
          read_count: 654
        }
      ]

      setAnnouncements(mockAnnouncements)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcement history')
    } finally {
      setLoading(false)
    }
  }

  const handleAnnouncementSent = () => {
    // Refresh announcement history if we're on that tab
    if (activeTab === 'history') {
      loadAnnouncementHistory()
    }
    
    // Show success message
    alert('Announcement sent successfully!')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTargetRoles = (roles: string[]) => {
    return roles.map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ')
  }

  const calculateReadPercentage = (readCount: number, totalCount: number) => {
    return totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Announcement System</h2>
        <p className="text-sm text-gray-600 mt-1">
          Create and manage system-wide announcements for users
        </p>
        
        {/* Tab Navigation */}
        <div className="mt-4 flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Announcement
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Announcement History
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'create' ? (
          <AnnouncementCreator onAnnouncementSent={handleAnnouncementSent} />
        ) : (
          <div>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">Failed to load announcements</div>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadAnnouncementHistory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📢</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements</h3>
                <p className="text-gray-600">No announcements have been sent yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {announcement.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {announcement.message}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Target Audience:</span>
                        <div className="font-medium text-gray-900">
                          {formatTargetRoles(announcement.target_roles)}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Recipients:</span>
                        <div className="font-medium text-gray-900">
                          {announcement.recipient_count.toLocaleString()}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Read Rate:</span>
                        <div className="font-medium text-gray-900">
                          {announcement.read_count.toLocaleString()} ({calculateReadPercentage(announcement.read_count, announcement.recipient_count)}%)
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${calculateReadPercentage(announcement.read_count, announcement.recipient_count)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Sent:</span>
                        <div className="font-medium text-gray-900">
                          {new Date(announcement.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {announcement.sent_by.name}
                        </div>
                      </div>
                    </div>
                    
                    {announcement.expires_at && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-xs text-yellow-800">
                          Expires: {new Date(announcement.expires_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AnnouncementSystem