// Profile components exports
export { ProfileDisplay } from './ProfileDisplay'
export { ProfileForm } from './ProfileForm'
export { AvatarUpload } from './AvatarUpload'
export { ProfileManager } from './ProfileManager'

// Re-export types for convenience
export type {
  UserProfile,
  UserPreferences,
  ProfileUpdateData,
  ProfileFormData,
  ProfileValidationError,
  ProfileFormState,
  AvatarUploadData,
  AvatarUploadResult,
  ProfileResponse,
  ProfileUpdateResponse
} from '../../types/profile'