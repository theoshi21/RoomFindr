'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface ContentItem {
  id: string
  type: 'listing' | 'review'
  title: string
  content: string
  author: {
    id: string
    name: string
    email: string
  }
  status: 'active' | 'flagged' | 'suspended' | 'approved'
  flagCount: number
  flagReasons: string[]
  createdAt: string
  updatedAt: string
  reportedBy?: {
    id: string
    name: string
    reason: string
    reportedAt: string
  }[]
}

interface ContentModerationProps {
  className?: string
}

export const ContentModeration: React.FC<ContentModerationProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'flagged' | 'suspended' | 'pending'>('flagged')
  const [contentType, setContentType] = useState<'all' | 'listing' | 'review'>('all')
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [moderationNote, setModerationNote] = useState('')

  useEffect(() => {
    loadContent()
  }, [filter, contentType])

  const loadContent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for now - replace with actual API calls
      const mockContent: ContentItem[] = [
        {
          id: '1',
          type: 'listing',
          title: 'Luxury Condo in Makati',
          content: 'Beautiful 2BR condo with amazing city views...',
          author: {
            id: 'user1',
            name: 'John Smith',
            email: 'john@example.com'
          },
          status: 'flagged',
          flagCount: 3,
          flagReasons: ['Inappropriate content', 'Misleading information'],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-16T14:30:00Z',
          reportedBy: [
            {
              id: 'reporter1',
              name: 'Jane Doe',
              reason: 'Inappropriate content',
              reportedAt: '2024-01-16T09:00:00Z'
            }
          ]
        },
        {
          id: '2',
          type: 'review',
          title: 'Review for Sunset Apartments',
          content: 'This place was terrible, the landlord is a scammer...',
          author: {
            id: 'user2',
            name: 'Maria Santos',
            email: 'maria@example.com'
          },
          status: 'flagged',
          flagCount: 2,
          flagReasons: ['Defamatory content'],
          createdAt: '2024-01-14T15:30:00Z',
          updatedAt: '2024-01-15T11:20:00Z'
        }
      ]

      // Filter content based on current filters
      let filteredContent = mockContent
      
      if (filter !== 'all') {
        filteredContent = filteredContent.filter(item => {
          switch (filter) {
            case 'flagged':
              return item.status === 'flagged'
            case 'suspended':
              return item.status === 'suspended'
            case 'pending':
              return item.flagCount > 0 && item.status === 'active'
            default:
              return true
          }
        })
      }

      if (contentType !== 'all') {
        filteredContent = filteredContent.filter(item => item.type === contentType)
      }

      setContent(filteredContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleModerationAction = async (itemId: string, action: 'approve' | 'suspend' | 'remove') => {
    if (!user?.user.id) return

    try {
      setActionLoading(itemId)
      setError(null)

      // Mock API call - replace with actual implementation
      console.log(`Performing ${action} on content ${itemId} with note: ${moderationNote}`)

      // Update local state
      setContent(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: action === 'approve' ? 'approved' : 'suspended' as any }
          : item
      ))

      setSelectedItem(null)
      setModerationNote('')
      
      // Show success message
      alert(`Content ${action}d successfully!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} content`)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string, flagCount: number) => {
    switch (status) {
      case 'flagged':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-gray-100 text-gray-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      default:
        return flagCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusText = (status: string, flagCount: number) => {
    switch (status) {
      case 'flagged':
        return 'Flagged'
      case 'suspended':
        return 'Suspended'
      case 'approved':
        return 'Approved'
      default:
        return flagCount > 0 ? 'Pending Review' : 'Active'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Content Moderation</h2>
        <p className="text-sm text-gray-600 mt-1">
          Review and moderate flagged listings and reviews
        </p>
        
        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Content</option>
              <option value="flagged">Flagged</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending Review</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="listing">Listings</option>
              <option value="review">Reviews</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {content.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 text-4xl mb-4">🛡️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Content to Moderate</h3>
            <p className="text-gray-600">
              All content has been reviewed or no content matches your filters.
            </p>
          </div>
        ) : (
          content.map((item) => (
            <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status, item.flagCount)}`}>
                      {getStatusText(item.status, item.flagCount)}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {item.type === 'listing' ? '🏠 Listing' : '⭐ Review'}
                    </span>
                    {item.flagCount > 0 && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        {item.flagCount} flag{item.flagCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {item.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>By: {item.author.name}</span>
                    <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.flagReasons.length > 0 && (
                      <span>Reasons: {item.flagReasons.join(', ')}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Moderation Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Review {selectedItem.type === 'listing' ? 'Listing' : 'Review'}
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Content Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">{selectedItem.title}</h5>
                  <p className="text-gray-700 mb-3">{selectedItem.content}</p>
                  <div className="text-sm text-gray-600">
                    <p>Author: {selectedItem.author.name} ({selectedItem.author.email})</p>
                    <p>Created: {new Date(selectedItem.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {selectedItem.flagReasons.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Flag Reasons</h4>
                  <div className="space-y-2">
                    {selectedItem.flagReasons.map((reason, index) => (
                      <div key={index} className="px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                        <span className="text-sm text-red-800">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.reportedBy && selectedItem.reportedBy.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Reports</h4>
                  <div className="space-y-2">
                    {selectedItem.reportedBy.map((report, index) => (
                      <div key={index} className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-sm">
                          <span className="font-medium text-yellow-900">{report.name}</span>
                          <span className="text-yellow-700 ml-2">reported: {report.reason}</span>
                        </div>
                        <div className="text-xs text-yellow-600 mt-1">
                          {new Date(report.reportedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moderation Notes
                </label>
                <textarea
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about your moderation decision..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => {
                  setSelectedItem(null)
                  setModerationNote('')
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleModerationAction(selectedItem.id, 'approve')}
                  disabled={actionLoading === selectedItem.id}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Approve
                </button>
                
                <button
                  onClick={() => handleModerationAction(selectedItem.id, 'suspend')}
                  disabled={actionLoading === selectedItem.id}
                  className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  Suspend
                </button>
                
                <button
                  onClick={() => handleModerationAction(selectedItem.id, 'remove')}
                  disabled={actionLoading === selectedItem.id}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentModeration