// Admin API functions for RoomFindr
import { supabase, getAdminClient } from './supabase'
import type { 
  AdminUser,
  UserManagementFilters,
  UserManagementResult,
  UserAccountUpdate,
  SystemAnalyticsData,
  AuditLogEntry,
  AuditLogFilters,
  AuditLogResult,
  AnnouncementData,
  CreateAdminData,
  AdminDashboardStatsData
} from '../types/admin'
import type { Database } from '../types/database'

type User = Database['public']['Tables']['users']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type LandlordVerification = Database['public']['Tables']['landlord_verifications']['Row']

/**
 * Get paginated list of users with filtering and sorting (client-side version)
 */
export async function getUsers(filters: UserManagementFilters = {}): Promise<UserManagementResult> {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  })

  const response = await fetch(`/api/admin/users?${params}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  
  return response.json()
}

/**
 * Update user account status and permissions (client-side version)
 */
export async function updateUserAccount(userId: string, updates: UserAccountUpdate, adminId: string): Promise<User> {
  const response = await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, updates })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update user account')
  }
  
  return response.json()
}

/**
 * Create a new admin account (client-side version)
 */
export async function createAdminAccount(adminData: CreateAdminData, createdByAdminId: string): Promise<{ user: User; profile: UserProfile }> {
  const response = await fetch('/api/admin/create-admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adminData)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create admin account')
  }
  
  return response.json()
}

/**
 * Get system analytics and statistics (client-side version)
 */
export async function getSystemAnalytics(): Promise<SystemAnalyticsData> {
  const response = await fetch('/api/admin/analytics')
  
  if (!response.ok) {
    throw new Error('Failed to fetch system analytics')
  }
  
  return response.json()
}

/**
 * Get admin dashboard statistics (client-side version)
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStatsData> {
  const response = await fetch('/api/admin/stats')
  
  if (!response.ok) {
    throw new Error('Failed to fetch admin dashboard stats')
  }
  
  return response.json()
}

/**
 * Log admin actions for audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: 'user' | 'property' | 'reservation' | 'verification' | 'system',
  targetId?: string,
  details?: Record<string, any>
): Promise<void> {
  const adminClient = getAdminClient() as any

  // Get admin user info
  const { data: adminUser } = await adminClient
    .from('users')
    .select('email')
    .eq('id', adminId)
    .single()

  // In a real implementation, you would create an audit_logs table
  // For now, we'll use the notifications table as a simple audit log
  await adminClient
    .from('notifications')
    .insert({
      user_id: adminId,
      notification_type: 'announcement',
      title: `Admin Action: ${action}`,
      message: `Admin ${adminUser?.email || adminId} performed ${action} on ${targetType} ${targetId || ''}`,
      metadata: {
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        timestamp: new Date().toISOString()
      }
    })
}

/**
 * Send system-wide announcement
 */
export async function sendAnnouncement(announcementData: AnnouncementData, adminId: string): Promise<void> {
  const adminClient = getAdminClient() as any

  // Get target users based on roles
  let userQuery = adminClient.from('users').select('id')

  if (announcementData.target_roles && announcementData.target_roles.length > 0) {
    userQuery = userQuery.in('role', announcementData.target_roles)
  }

  const { data: targetUsers, error: userError } = await userQuery

  if (userError) {
    throw new Error(`Failed to get target users: ${userError.message}`)
  }

  if (!targetUsers || targetUsers.length === 0) {
    throw new Error('No target users found')
  }

  // Create notifications for all target users
  const notifications = targetUsers.map((user: any) => ({
    user_id: user.id,
    notification_type: 'announcement' as const,
    title: announcementData.title,
    message: announcementData.message,
    metadata: {
      priority: announcementData.priority || 'medium',
      expires_at: announcementData.expires_at,
      sent_by_admin: adminId
    }
  }))

  const { error: notificationError } = await adminClient
    .from('notifications')
    .insert(notifications)

  if (notificationError) {
    throw new Error(`Failed to send announcements: ${notificationError.message}`)
  }

  // Log the admin action
  await logAdminAction(adminId, 'send_announcement', 'system', undefined, {
    title: announcementData.title,
    target_roles: announcementData.target_roles,
    target_user_count: targetUsers.length
  })
}

/**
 * Suspend user account (client-side version)
 */
export async function suspendUser(userId: string, adminId: string, reason?: string): Promise<void> {
  const response = await fetch('/api/admin/users/suspend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, reason })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to suspend user')
  }
}

/**
 * Activate user account (client-side version)
 */
export async function activateUser(userId: string, adminId: string): Promise<void> {
  const response = await fetch('/api/admin/users/activate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to activate user')
  }
}