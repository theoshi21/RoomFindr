// Authentication types for RoomFindr
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Simplified user types that don't depend on database schema
export interface User {
  id: string
  email: string
  role: 'admin' | 'tenant' | 'landlord'
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  phone: string | null
  avatar: string | null
  bio: string | null
  preferences: any | null
  created_at: string
  updated_at: string
}

export interface AuthUser extends Omit<SupabaseUser, 'user_metadata'> {
  user_metadata?: {
    role?: 'admin' | 'tenant' | 'landlord'
    first_name?: string
    last_name?: string
  }
}

export interface UserWithProfile {
  user: User
  profile?: UserProfile
}

export interface RegistrationData {
  email: string
  password: string
  role: 'tenant' | 'landlord'
  firstName: string
  lastName: string
  phone?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: AuthUser | null
  error: string | null
  userRole?: string
}

export interface PasswordResetData {
  email: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
}

export interface EmailVerificationData {
  token: string
  type: 'signup' | 'recovery'
}

// Auth context types
export interface AuthContextType {
  user: UserWithProfile | null
  loading: boolean
  signUp: (data: RegistrationData) => Promise<AuthResponse>
  signIn: (credentials: LoginCredentials) => Promise<AuthResponse>
  signOut: () => Promise<void>
  resetPassword: (data: PasswordResetData) => Promise<{ error: string | null }>
  changePassword: (data: PasswordChangeData) => Promise<{ error: string | null }>
  verifyEmail: (data: EmailVerificationData) => Promise<{ error: string | null }>
  refreshUser: () => Promise<void>
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState {
  isSubmitting: boolean
  errors: ValidationError[]
  success?: string
}