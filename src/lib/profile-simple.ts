// Simplified profile management that works without strict database types
import { supabaseFlexible as supabase } from './supabase-flexible'
import type { 
  UserProfile, 
  ProfileUpdateData, 
  AvatarUploadData, 
  ProfileResponse, 
  ProfileUpdateResponse,
  AvatarUploadResult,
  UserPreferences
} from '../types/profile'

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<ProfileResponse> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return { profile: null, error: error.message }
    }

    if (!data) {
      return { profile: null, error: 'Profile not found' }
    }

    // Parse preferences if they exist
    const profile: UserProfile = {
      id: data.id,
      user_id: data.user_id,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      avatar: data.avatar,
      bio: data.bio,
      preferences: data.preferences ? 
        (typeof data.preferences === 'string' ? JSON.parse(data.preferences) : data.preferences) : 
        undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    return { profile, error: null }
  } catch (error) {
    return { 
      profile: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch profile' 
    }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: ProfileUpdateData
): Promise<ProfileUpdateResponse> {
  try {
    // Prepare the update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (updates.first_name !== undefined) updateData.first_name = updates.first_name
    if (updates.last_name !== undefined) updateData.last_name = updates.last_name
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.bio !== undefined) updateData.bio = updates.bio
    if (updates.preferences !== undefined) {
      updateData.preferences = JSON.stringify(updates.preferences)
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Profile not found' }
    }

    // Parse preferences back
    const profile: UserProfile = {
      id: data.id,
      user_id: data.user_id,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      avatar: data.avatar,
      bio: data.bio,
      preferences: data.preferences ? 
        (typeof data.preferences === 'string' ? JSON.parse(data.preferences) : data.preferences) : 
        undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    return { success: true, profile }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile' 
    }
  }
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar({ file, userId }: AvatarUploadData): Promise<AvatarUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { url: null, error: 'File must be an image' }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { url: null, error: 'File size must be less than 5MB' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return { url: null, error: uploadError.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath)

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        avatar: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      // Try to clean up uploaded file if profile update fails
      await supabase.storage
        .from('user-uploads')
        .remove([filePath])
      
      return { url: null, error: updateError.message }
    }

    return { url: publicUrl, error: null }
  } catch (error) {
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Failed to upload avatar' 
    }
  }
}

/**
 * Delete avatar from storage and profile
 */
export async function deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current avatar URL
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('avatar')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    // Extract file path from URL if avatar exists
    if (profile?.avatar) {
      const url = new URL(profile.avatar)
      const filePath = url.pathname.split('/').slice(-2).join('/')
      
      // Delete from storage
      await supabase.storage
        .from('user-uploads')
        .remove([filePath])
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        avatar: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete avatar' 
    }
  }
}

/**
 * Validate profile data
 */
export function validateProfileData(data: Partial<ProfileUpdateData>): string[] {
  const errors: string[] = []

  if (data.first_name !== undefined) {
    if (!data.first_name || data.first_name.trim().length < 2) {
      errors.push('First name must be at least 2 characters long')
    }
    if (data.first_name.length > 50) {
      errors.push('First name must be less than 50 characters')
    }
  }

  if (data.last_name !== undefined) {
    if (!data.last_name || data.last_name.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long')
    }
    if (data.last_name.length > 50) {
      errors.push('Last name must be less than 50 characters')
    }
  }

  if (data.phone !== undefined && data.phone !== null) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (data.phone && !phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Please enter a valid phone number')
    }
  }

  if (data.bio !== undefined && data.bio !== null) {
    if (data.bio && data.bio.length > 500) {
      errors.push('Bio must be less than 500 characters')
    }
  }

  return errors
}

/**
 * Get default user preferences
 */
export function getDefaultPreferences(): UserPreferences {
  return {
    notifications: true,
    emailUpdates: true,
    theme: 'light',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

/**
 * Create initial profile for new user
 */
export async function createUserProfile(
  userId: string, 
  firstName: string, 
  lastName: string,
  phone?: string
): Promise<ProfileResponse> {
  try {
    const profileData = {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      preferences: JSON.stringify(getDefaultPreferences())
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      return { profile: null, error: error.message }
    }

    if (!data) {
      return { profile: null, error: 'Failed to create profile' }
    }

    const profile: UserProfile = {
      id: data.id,
      user_id: data.user_id,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      avatar: data.avatar,
      bio: data.bio,
      preferences: data.preferences ? 
        (typeof data.preferences === 'string' ? JSON.parse(data.preferences) : data.preferences) : 
        undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    return { profile, error: null }
  } catch (error) {
    return { 
      profile: null, 
      error: error instanceof Error ? error.message : 'Failed to create profile' 
    }
  }
}