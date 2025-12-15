'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface AuditLogEntry {
  id: string
  adminId: string
  adminName: string
  action: string
  targetType: 'user' | 'property' | 'reservation' | 'verification' | 'system' | 'content'
  targetId?: string
  details?: Record<string, any>
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

interface AuditLogsProps {
  className?: string
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    adminId: '',
    dateFrom: '',
    dateTo: ''
  })
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadAuditLogs()
  }, [filters])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for now - replace with actual API call
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          adminId: 'admin1',
          adminName: 'System Admin',
          action: 'suspend_user',
          targetType: 'user',
          targetId: 'user123',
          details: { 
            reason: 'Violation of terms',
            previousStatus: 'active',
            newStatus: 'suspended',
            userEmail: 'user@example.com'
          },
          timestamp: '2024-01-16T10:30:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
        {
          id: '2',
          adminId: 'admin1',
          adminName: 'System Admin',
          action: 'approve_verification',
          targetType: 'verification',
          targetId: 'ver456',
          details: { 
            landlordId: 'landlord789',
            documentsReviewed: ['id', 'business_permit'],
            reviewNotes: 'All documents verified successfully'
          },
          timestamp: '2024-01-16T09:15:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
        {
          id: '3',
          adminId: 'admin1',
          adminName: 'System Admin',
          action: 'moderate_content',
          targetType: 'content',
          targetId: 'listing789',
          details: {
            contentType: 'listing',
            action: 'suspend',
            reason: 'Inappropriate content',
            flagCount: 3,
            moderationNote: 'Content contains misleading information'
          },
          timestamp: '2024-01-16T08:45:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
        {
          id: '4',
          adminId: 'admin2',
          adminName: 'Content Moderator',
          action: 'send_announcement',
          targetType: 'system',
          details: {
            title: 'System Maintenance Scheduled',
            targetRoles: ['tenant', 'landlord'],
            recipientCount: 1247,
            priority: 'high'
          },
          timestamp: '2024-01-15T16:20:00Z',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        {
          id: '5',
          adminId: 'admin1',
          adminName: 'System Admin',
          action: 'create_admin',
          targetType: 'user',
          targetId: 'admin3',
          details: {
            newAdminEmail: 'newadmin@roomfindr.com',
            permissions: ['user_management', 'content_moderation'],
            createdBy: 'admin1'
          },
          timestamp: '2024-01-15T14:10:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        }
      ]

      // Apply filters
      let filteredLogs = mockLogs

      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action)
      }

      if (filters.targetType) {
        filteredLogs = filteredLogs.filter(log => log.targetType === filters.targetType)
      }

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom)
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= fromDate)
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999) // End of day
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= toDate)
      }

      setLogs(filteredLogs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('suspend') || action.includes('reject') || action.includes('remove') || action.includes('delete')) {
      return 'text-red-600 bg-red-50'
    }
    if (action.includes('approve') || action.includes('activate') || action.includes('verify') || action.includes('create')) {
      return 'text-green-600 bg-green-50'
    }
    if (action.includes('update') || action.includes('moderate') || action.includes('send')) {
      return 'text-blue-600 bg-blue-50'
    }
    return 'text-gray-600 bg-gray-50'
  }

  const formatAction = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case 'user': return '👤'
      case 'property': return '🏠'
      case 'verification': return '✅'
      case 'reservation': return '📅'
      case 'content': return '📝'
      case 'system': return '⚙️'
      default: return '📋'
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Admin', 'Action', 'Target Type', 'Target ID', 'Details'].join(','),
      ...logs.map(log => [
        log.timestamp,
        log.adminName,
        formatAction(log.action),
        log.targetType,
        log.targetId || '',
        JSON.stringify(log.details || {}).replace(/,/g, ';')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Audit Logs</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track all administrative actions and system changes
            </p>
          </div>
          
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="suspend_user">Suspend User</option>
              <option value="activate_user">Activate User</option>
              <option value="approve_verification">Approve Verification</option>
              <option value="reject_verification">Reject Verification</option>
              <option value="moderate_content">Moderate Content</option>
              <option value="send_announcement">Send Announcement</option>
              <option value="create_admin">Create Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Type
            </label>
            <select
              value={filters.targetType}
              onChange={(e) => setFilters(prev => ({ ...prev, targetType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="user">User</option>
              <option value="property">Property</option>
              <option value="verification">Verification</option>
              <option value="reservation">Reservation</option>
              <option value="content">Content</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ action: '', targetType: '', adminId: '', dateFrom: '', dateTo: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Logs</h3>
            <p className="text-gray-600">
              No administrative actions match your current filters.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{getTargetTypeIcon(log.targetType)}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {log.targetType}
                    </span>
                    {log.targetId && (
                      <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        {log.targetId}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="font-medium">By: {log.adminName}</span>
                    <span>
                      {new Date(log.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {log.ipAddress && (
                      <span className="text-xs text-gray-400">IP: {log.ipAddress}</span>
                    )}
                  </div>
                  
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-xs text-gray-500">
                      <button
                        onClick={() => {
                          setSelectedLog(log)
                          setShowDetails(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Details ({Object.keys(log.details).length} fields)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <p className="text-sm text-gray-900">{formatAction(selectedLog.action)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Type</label>
                  <p className="text-sm text-gray-900">{selectedLog.targetType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin</label>
                  <p className="text-sm text-gray-900">{selectedLog.adminName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                {selectedLog.targetId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedLog.targetId}</p>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IP Address</label>
                    <p className="text-sm text-gray-900">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>

              {selectedLog.details && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto border">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Agent</label>
                  <p className="text-xs text-gray-600 break-all">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedLog(null)
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogs