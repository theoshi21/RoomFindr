// Admin-specific types for RoomFindr
import type { Database } from './database'

type User = Database['public']['Tables']['users']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type LandlordVerification = Database['public']['Tables']['landlord_verifications']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']
type DatabaseNotification = Database['public']['Tables']['notifications']['Row']

export interface AdminUser extends User {
  profile?: UserProfile
  verification?: LandlordVerification
}

export interface UserManagementFilters {
  role?: 'admin' | 'tenant' | 'landlord'
  status?: 'active' | 'inactive' | 'pending_verification'
  search?: string
  sortBy?: 'created_at' | 'email' | 'role' | 'last_login'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface UserManagementResult {
  users: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UserAccountUpdate {
  is_active?: boolean
  role?: 'admin' | 'tenant' | 'landlord'
  is_verified?: boolean
}

export interface SystemAnalyticsData {
  totalUsers: number
  activeUsers: number
  totalLandlords: number
  verifiedLandlords: number
  pendingVerifications: number
  totalProperties: number
  activeProperties: number
  totalReservations: number
  completedReservations: number
  totalRevenue: number
  monthlyGrowth: {
    users: number
    properties: number
    reservations: number
    revenue: number
  }
  usersByRole: {
    admin: number
    tenant: number
    landlord: number
  }
  recentActivity: {
    newUsers: number
    newProperties: number
    newReservations: number
  }
}

export interface AuditLogEntry {
  id: string
  admin_id: string
  admin_email: string
  action: string
  target_type: 'user' | 'property' | 'reservation' | 'verification' | 'system'
  target_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface AuditLogFilters {
  admin_id?: string
  action?: string
  target_type?: 'user' | 'property' | 'reservation' | 'verification' | 'system'
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

export interface AuditLogResult {
  logs: AuditLogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AnnouncementData {
  title: string
  message: string
  target_roles?: ('admin' | 'tenant' | 'landlord')[]
  priority?: 'low' | 'medium' | 'high'
  expires_at?: string
}

export interface CreateAdminData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface AdminDashboardStatsData {
  pendingVerifications: number
  activeUsers: number
  totalProperties: number
  recentTransactions: Transaction[]
  systemAlerts: {
    type: 'warning' | 'error' | 'info'
    message: string
    count?: number
  }[]
}

// Form validation types
export interface AdminFormError {
  field: string
  message: string
}

export interface AdminFormState {
  isSubmitting: boolean
  errors: AdminFormError[]
  success?: string
}