// Profile management types for RoomFindr
import type { Tables, Json } from './database'

type DatabaseUserProfile = Tables<'user_profiles'>

export interface UserProfile extends Omit<DatabaseUserProfile, 'preferences'> {
  preferences?: UserPreferences | Json
}

export interface UserPreferences {
  notifications: boolean
  emailUpdates: boolean
  theme: 'light' | 'dark'
  language?: string
  timezone?: string
}

export interface ProfileUpdateData {
  first_name?: string
  last_name?: string
  phone?: string | null
  bio?: string | null
  preferences?: UserPreferences
}

export interface AvatarUploadData {
  file: File
  userId: string
}

export interface ProfileFormData {
  firstName: string
  lastName: string
  phone: string
  bio: string
  preferences: UserPreferences
}

export interface ProfileValidationError {
  field: keyof ProfileFormData | 'avatar'
  message: string
}

export interface ProfileFormState {
  isSubmitting: boolean
  errors: ProfileValidationError[]
  success?: string
}

// Avatar upload types
export interface AvatarUploadResult {
  url: string | null
  error: string | null
}

// Profile API response types
export interface ProfileResponse {
  profile: UserProfile | null
  error: string | null
}

export interface ProfileUpdateResponse {
  success: boolean
  profile?: UserProfile
  error?: string
}