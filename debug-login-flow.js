#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugLoginFlow() {
  try {
    console.log('🔍 Debugging complete login flow...\n')

    // Step 1: Sign in
    console.log('1. Signing in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@roomfindr.com',
      password: 'admin123'
    })

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message)
      return
    }

    console.log('✅ Sign in successful!')
    console.log('   User ID:', signInData.user?.id)
    console.log('   Email:', signInData.user?.email)

    // Step 2: Get user role immediately after login (like the AuthContext does)
    console.log('\n2. Getting user role for redirect...')
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', signInData.user.id)
      .single()

    if (userError) {
      console.error('❌ Failed to get user role:', userError.message)
      console.log('   This is why the redirect is failing!')
    } else {
      console.log('✅ User role found:', dbUser.role)
      
      // Step 3: Determine redirect path
      const getRoleBasedRedirect = (role) => {
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
      
      const redirectPath = getRoleBasedRedirect(dbUser.role)
      console.log('✅ Should redirect to:', redirectPath)
    }

    // Step 4: Test the full user profile fetch (like AuthContext does)
    console.log('\n3. Testing full user profile fetch...')
    const { data: fullUser, error: fullUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signInData.user.id)
      .single()

    if (fullUserError) {
      console.error('❌ Failed to get full user:', fullUserError.message)
    } else {
      console.log('✅ Full user data:')
      console.log('   Role:', fullUser.role)
      console.log('   Active:', fullUser.is_active)
      console.log('   Verified:', fullUser.is_verified)
    }

    // Step 5: Test profile fetch
    console.log('\n4. Testing profile fetch...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', signInData.user.id)
      .single()

    if (profileError) {
      console.error('❌ Failed to get profile:', profileError.message)
    } else {
      console.log('✅ Profile data:')
      console.log('   Name:', profile.first_name, profile.last_name)
    }

    console.log('\n🎯 Summary:')
    console.log('   Login works:', !signInError ? '✅' : '❌')
    console.log('   Role fetch works:', !userError ? '✅' : '❌')
    console.log('   Expected redirect:', !userError ? redirectPath : 'Unknown')

  } catch (error) {
    console.error('❌ Debug error:', error.message)
  }
}

debugLoginFlow()