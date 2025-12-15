// Simplified authentication utilities for initial implementation
import { supabase } from './supabase'
import type { 
  RegistrationData, 
  LoginCredentials, 
  AuthResponse, 
  PasswordResetData, 
  PasswordChangeData,
  EmailVerificationData,
  UserWithProfile,
  ValidationError
} from '../types/auth'

// Validation utilities (same as before)
export const validateEmail = (email: string): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    return { field: 'email', message: 'Email is required' }
  }
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Please enter a valid email address' }
  }
  return null
}

export const validatePassword = (password: string): ValidationError | null => {
  if (!password) {
    return { field: 'password', message: 'Password is required' }
  }
  if (password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters long' }
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
  }
  return null
}

export const validateName = (name: string, fieldName: string): ValidationError | null => {
  if (!name || name.trim().length === 0) {
    return { field: fieldName, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required` }
  }
  if (name.trim().length < 2) {
    return { field: fieldName, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 2 characters long` }
  }
  return null
}

export const validatePhone = (phone: string): ValidationError | null => {
  if (!phone) return null // Phone is optional
  
  const phoneRegex = /^(\+63|0)[0-9]{10}$/
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { field: 'phone', message: 'Please enter a valid Philippine phone number' }
  }
  return null
}

export const validateRegistrationData = (data: RegistrationData): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const emailError = validateEmail(data.email)
  if (emailError) errors.push(emailError)
  
  const passwordError = validatePassword(data.password)
  if (passwordError) errors.push(passwordError)
  
  const firstNameError = validateName(data.firstName, 'firstName')
  if (firstNameError) errors.push(firstNameError)
  
  const lastNameError = validateName(data.lastName, 'lastName')
  if (lastNameError) errors.push(lastNameError)
  
  if (data.phone) {
    const phoneError = validatePhone(data.phone)
    if (phoneError) errors.push(phoneError)
  }
  
  if (!data.role || !['tenant', 'landlord'].includes(data.role)) {
    errors.push({ field: 'role', message: 'Please select a valid role' })
  }
  
  return errors
}

// Simplified authentication functions
export const signUp = async (data: RegistrationData): Promise<AuthResponse> => {
  try {
    // Validate input data
    const validationErrors = validateRegistrationData(data)
    if (validationErrors.length > 0) {
      return {
        user: null,
        error: validationErrors.map(e => e.message).join(', ')
      }
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: data.role,
          first_name: data.firstName,
          last_name: data.lastName,
        }
      }
    })

    if (authError) {
      return {
        user: null,
        error: authError.message
      }
    }

    if (!authData.user) {
      return {
        user: null,
        error: 'Failed to create user account'
      }
    }

    // For now, we'll rely on database triggers to create the user record
    // This will be implemented when we set up the database properly
    
    return {
      user: authData.user,
      error: null
    }
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export const signIn = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const emailError = validateEmail(credentials.email)
    if (emailError) {
      return {
        user: null,
        error: emailError.message
      }
    }

    if (!credentials.password) {
      return {
        user: null,
        error: 'Password is required'
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })

    if (error) {
      return {
        user: null,
        error: error.message
      }
    }

    return {
      user: data.user,
      error: null
    }
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}

export const resetPassword = async (data: PasswordResetData): Promise<{ error: string | null }> => {
  try {
    const emailError = validateEmail(data.email)
    if (emailError) {
      return { error: emailError.message }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export const changePassword = async (data: PasswordChangeData): Promise<{ error: string | null }> => {
  try {
    const passwordError = validatePassword(data.newPassword)
    if (passwordError) {
      return { error: passwordError.message }
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export const verifyEmail = async (data: EmailVerificationData): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: data.token,
      type: data.type === 'signup' ? 'signup' : 'recovery'
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export const getCurrentUserWithProfile = async (): Promise<UserWithProfile | null> => {
  try {
    // Get auth user with short timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Auth timeout after 2 seconds')), 2000)
    })
    
    const authPromise = supabase.auth.getUser()
    const { data: authUser, error: authError } = await Promise.race([authPromise, timeoutPromise])
    
    if (authError || !authUser.user) {
      console.log('No authenticated user found')
      return null
    }
    
    console.log('Auth user found:', authUser.user.id)
    
    // For now, just use auth metadata to avoid database timeout issues
    // TODO: Re-enable database queries after fixing RLS policies
    const user = {
      id: authUser.user.id,
      email: authUser.user.email || '',
      role: (authUser.user.user_metadata?.role || 'tenant') as 'admin' | 'tenant' | 'landlord',
      is_active: true,
      is_verified: authUser.user.email_confirmed_at ? true : false,
      created_at: authUser.user.created_at,
      updated_at: authUser.user.updated_at || authUser.user.created_at
    }
    
    const profile = {
      id: authUser.user.id,
      user_id: authUser.user.id,
      first_name: authUser.user.user_metadata?.firstName || authUser.user.user_metadata?.first_name || '',
      last_name: authUser.user.user_metadata?.lastName || authUser.user.user_metadata?.last_name || '',
      phone: null,
      avatar: null,
      bio: null,
      preferences: null,
      created_at: authUser.user.created_at,
      updated_at: authUser.user.updated_at || authUser.user.created_at
    }
    
    console.log('Using auth metadata for user data (database queries disabled to prevent timeouts)')
    
    return { user, profile }
    
  } catch (error) {
    console.error('Error in getCurrentUserWithProfile:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Role-based redirect utility
export const getRoleBasedRedirect = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'landlord':
      return '/landlord/dashboard'
    case 'tenant':
      return '/tenant/dashboard'
    default:
      return '/dashboard'
  }
}