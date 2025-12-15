'use client'

import React, { useState, useEffect } from 'react'
import { getUsers, updateUserAccount, suspendUser, activateUser } from '../../lib/admin'
import type { AdminUser, UserManagementFilters, UserAccountUpdate } from '../../types/admin'
import { useAuth } from '../../contexts/AuthContext'

interface UserManagementProps {
  className?: string
}

export const UserManagement: React.FC<UserManagementProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UserManagementFilters>({
    page: 1,
    limit: 20
  })
  const [totalPages, setTotalPages] = useState(0)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [bulkActions, setBulkActions] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getUsers(filters)
      setUsers(result.users)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [filters])

  const handleFilterChange = (newFilters: Partial<UserManagementFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'verify') => {
    if (!user?.user.id) return

    try {
      setActionLoading(userId)
      setError(null)

      switch (action) {
        case 'suspend':
          await suspendUser(userId, user.user.id)
          break
        case 'activate':
          await activateUser(userId, user.user.id)
          break
        case 'verify':
          await updateUserAccount(userId, { is_verified: true }, user.user.id)
          break
      }

      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} user`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'tenant' | 'landlord') => {
    if (!user?.user.id) return

    try {
      setActionLoading(userId)
      setError(null)
      await updateUserAccount(userId, { role: newRole }, user.user.id)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'verify') => {
    if (!user?.user.id || bulkActions.length === 0) return

    try {
      setError(null)
      
      for (const userId of bulkActions) {
        await handleUserAction(userId, action)
      }
      
      setBulkActions([])
      setShowBulkActions(false)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to perform bulk ${action}`)
    }
  }

  const toggleBulkSelection = (userId: string) => {
    setBulkActions(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    setBulkActions(users.map(u => u.id))
  }

  const clearBulkSelection = () => {
    setBulkActions([])
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'landlord': return 'bg-blue-100 text-blue-800'
      case 'tenant': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-800'
    if (!isVerified) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'Suspended'
    if (!isVerified) return 'Unverified'
    return 'Active'
  }

  if (loading && users.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
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
          <h2 className="text-lg font-medium text-gray-900">User Management</h2>
          
          {/* Bulk Actions */}
          {bulkActions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {bulkActions.length} selected
              </span>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Bulk Actions
              </button>
              <button
                onClick={clearBulkSelection}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Bulk Actions Dropdown */}
        {showBulkActions && bulkActions.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                Bulk Actions for {bulkActions.length} users:
              </span>
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Activate All
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Suspend All
              </button>
              <button
                onClick={() => handleBulkAction('verify')}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Verify All
              </button>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange({ role: e.target.value as any || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="landlord">Landlord</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange({ status: e.target.value as any || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
              <option value="pending_verification">Pending Verification</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
              placeholder="Email or name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy || 'created_at'}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">Created Date</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bulkActions.length === users.length && users.length > 0}
                    onChange={(e) => e.target.checked ? selectAllUsers() : clearBulkSelection()}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  User
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((userData) => (
              <tr key={userData.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bulkActions.includes(userData.id)}
                      onChange={() => toggleBulkSelection(userData.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {userData.profile?.first_name?.[0] || userData.email[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {userData.profile?.first_name} {userData.profile?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{userData.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={userData.role}
                    onChange={(e) => handleRoleChange(userData.id, e.target.value as any)}
                    disabled={actionLoading === userData.id}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userData.role)} border-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="admin">Admin</option>
                    <option value="landlord">Landlord</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(userData.is_active, userData.is_verified)}`}>
                    {getStatusText(userData.is_active, userData.is_verified)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(userData.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => {
                      setSelectedUser(userData)
                      setShowUserDetails(true)
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                  
                  {userData.is_active ? (
                    <button
                      onClick={() => handleUserAction(userData.id, 'suspend')}
                      disabled={actionLoading === userData.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUserAction(userData.id, 'activate')}
                      disabled={actionLoading === userData.id}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >
                      Activate
                    </button>
                  )}
                  
                  {!userData.is_verified && (
                    <button
                      onClick={() => handleUserAction(userData.id, 'verify')}
                      disabled={actionLoading === userData.id}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                    >
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {filters.page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange((filters.page || 1) - 1)}
              disabled={filters.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange((filters.page || 1) + 1)}
              disabled={filters.page === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User Details</h3>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">Name</label>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedUser.profile?.first_name} {selectedUser.profile?.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Email</label>
                    <p className="text-sm font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Role</label>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Status</label>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser.is_active, selectedUser.is_verified)}`}>
                      {getStatusText(selectedUser.is_active, selectedUser.is_verified)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Account Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">Created</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Last Updated</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUser.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              {selectedUser.profile && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Profile Information</h4>
                  <div className="space-y-2">
                    {selectedUser.profile.phone && (
                      <div>
                        <label className="block text-sm text-gray-600">Phone</label>
                        <p className="text-sm text-gray-900">{selectedUser.profile.phone}</p>
                      </div>
                    )}
                    {selectedUser.profile.bio && (
                      <div>
                        <label className="block text-sm text-gray-600">Bio</label>
                        <p className="text-sm text-gray-900">{selectedUser.profile.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Status */}
              {selectedUser.role === 'landlord' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Landlord Verification</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Verification Status</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.is_verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedUser.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    {!selectedUser.is_verified && (
                      <p className="text-sm text-gray-600 mt-2">
                        This landlord has not completed verification or is pending review.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.is_active ? (
                    <button
                      onClick={() => {
                        handleUserAction(selectedUser.id, 'suspend')
                        setShowUserDetails(false)
                      }}
                      disabled={actionLoading === selectedUser.id}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Suspend Account
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleUserAction(selectedUser.id, 'activate')
                        setShowUserDetails(false)
                      }}
                      disabled={actionLoading === selectedUser.id}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Activate Account
                    </button>
                  )}
                  
                  {!selectedUser.is_verified && (
                    <button
                      onClick={() => {
                        handleUserAction(selectedUser.id, 'verify')
                        setShowUserDetails(false)
                      }}
                      disabled={actionLoading === selectedUser.id}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Verify Account
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowUserDetails(false)
                  setSelectedUser(null)
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

export default UserManagement