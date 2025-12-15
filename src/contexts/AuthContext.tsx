'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  signUp as authSignUp,
  signIn as authSignIn,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  changePassword as authChangePassword,
  verifyEmail as authVerifyEmail,
  getCurrentUserWithProfile
} from '../lib/auth'
import type { 
  AuthContextType, 
  RegistrationData, 
  LoginCredentials, 
  AuthResponse,
  PasswordResetData,
  PasswordChangeData,
  EmailVerificationData,
  UserWithProfile
} from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    console.log('AuthContext: Refreshing user...')
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('User refresh timeout')), 5000)
      })
      
      const userPromise = getCurrentUserWithProfile()
      const userWithProfile = await Promise.race([userPromise, timeoutPromise])
      
      console.log('AuthContext: User refreshed successfully', { hasUser: !!userWithProfile })
      setUser(userWithProfile)
    } catch (error) {
      console.error('AuthContext: Error refreshing user:', error instanceof Error ? error.message : 'Unknown error')
      setUser(null)
    }
  }

  useEffect(() => {
    let isMounted = true
    let subscription: any = null
    
    // Get initial session with improved error handling
    const getInitialSession = async () => {
      console.log('AuthContext: Starting initial session check...')
      try {
        // Shorter timeout for initial session
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Session check timeout after 5 seconds')), 5000)
        })

        const sessionPromise = supabase.auth.getSession()
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])
        
        if (error) {
          throw error
        }
        
        console.log('AuthContext: Session check complete', { hasSession: !!session })
        
        if (isMounted && session?.user) {
          console.log('AuthContext: User found, refreshing user data...')
          await refreshUser()
        }
      } catch (error: any) {
        console.error('AuthContext: Error getting initial session:', error?.message || 'Unknown error')
        
        // Provide specific error messages
        if (error?.message?.includes('timeout')) {
          console.error('AuthContext: Connection timed out - check network connectivity')
        } else if (error?.message?.includes('SSL') || error?.message?.includes('certificate')) {
          console.error('AuthContext: SSL certificate error - check Supabase URL')
        } else if (error?.message?.includes('CORS')) {
          console.error('AuthContext: CORS error - check domain configuration')
        }
      } finally {
        if (isMounted) {
          console.log('AuthContext: Setting loading to false')
          setLoading(false)
        }
      }
    }

    // Set up auth listener with debouncing
    let refreshTimeout: NodeJS.Timeout | null = null
    
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('AuthContext: Auth state changed:', event)
          
          if (!isMounted) return
          
          // Clear any pending refresh
          if (refreshTimeout) {
            clearTimeout(refreshTimeout)
          }
          
          // Debounce rapid auth state changes
          refreshTimeout = setTimeout(async () => {
            if (!isMounted) return
            
            try {
              if (event === 'SIGNED_IN' && session?.user) {
                await refreshUser()
              } else if (event === 'SIGNED_OUT') {
                setUser(null)
              } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                // Only refresh if we don't already have user data
                if (!user) {
                  await refreshUser()
                }
              }
            } catch (error) {
              console.error('AuthContext: Error handling auth state change:', error)
            } finally {
              if (isMounted) {
                setLoading(false)
              }
            }
          }, 100) // 100ms debounce
        }
      )
      subscription = data.subscription
    } catch (error) {
      console.error('AuthContext: Failed to set up auth listener:', error)
    }

    // Start initial session check
    getInitialSession()

    return () => {
      isMounted = false
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, []) // Remove user dependency to prevent infinite loops

  const signUp = async (data: RegistrationData): Promise<AuthResponse> => {
    setLoading(true)
    try {
      console.log('AuthContext: Attempting signUp...')
      const result = await authSignUp(data)
      if (result.user && !result.error) {
        console.log('AuthContext: SignUp successful')
      }
      return result
    } catch (error: any) {
      console.error('AuthContext: SignUp failed:', error)
      return { user: null, error: `Sign up failed: ${error.message}` }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setLoading(true)
    try {
      console.log('AuthContext: Attempting signIn...')
      const result = await authSignIn(credentials)
      if (result.user && !result.error) {
        console.log('AuthContext: SignIn successful, refreshing user...')
        await refreshUser()
      }
      return result
    } catch (error: any) {
      console.error('AuthContext: SignIn failed:', error)
      return { user: null, error: `Sign in failed: ${error.message}` }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    setLoading(true)
    try {
      console.log('AuthContext: Attempting signOut...')
      await authSignOut()
      setUser(null)
      console.log('AuthContext: SignOut successful')
    } catch (error: any) {
      console.error('AuthContext: SignOut failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (data: PasswordResetData): Promise<{ error: string | null }> => {
    try {
      console.log('AuthContext: Attempting resetPassword...')
      return await authResetPassword(data)
    } catch (error: any) {
      console.error('AuthContext: ResetPassword failed:', error)
      return { error: `Password reset failed: ${error.message}` }
    }
  }

  const changePassword = async (data: PasswordChangeData): Promise<{ error: string | null }> => {
    try {
      console.log('AuthContext: Attempting changePassword...')
      return await authChangePassword(data)
    } catch (error: any) {
      console.error('AuthContext: ChangePassword failed:', error)
      return { error: `Password change failed: ${error.message}` }
    }
  }

  const verifyEmail = async (data: EmailVerificationData): Promise<{ error: string | null }> => {
    try {
      console.log('AuthContext: Attempting verifyEmail...')
      const result = await authVerifyEmail(data)
      if (!result.error) {
        await refreshUser()
      }
      return result
    } catch (error: any) {
      console.error('AuthContext: VerifyEmail failed:', error)
      return { error: `Email verification failed: ${error.message}` }
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    changePassword,
    verifyEmail,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}