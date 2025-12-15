#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthFlow() {
  try {
    console.log('🔍 Testing complete auth flow...\n')

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

    // Step 2: Try to get user from public.users
    console.log('\n2. Fetching user from public.users...')
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signInData.user.id)
      .single()

    if (userError) {
      console.error('❌ Failed to get user from database:', userError.message)
      console.log('   This might be an RLS (Row Level Security) issue')
    } else {
      console.log('✅ User found in database:')
      console.log('   Role:', dbUser.role)
      console.log('   Active:', dbUser.is_active)
      console.log('   Verified:', dbUser.is_verified)
    }

    // Step 3: Try to get profile
    console.log('\n3. Fetching user profile...')
    const { data: dbProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', signInData.user.id)
      .single()

    if (profileError) {
      console.error('❌ Failed to get profile from database:', profileError.message)
    } else {
      console.log('✅ Profile found:')
      console.log('   Name:', dbProfile.first_name, dbProfile.last_name)
    }

    // Step 4: Sign out
    console.log('\n4. Signing out...')
    await supabase.auth.signOut()
    console.log('✅ Signed out successfully')

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testAuthFlow()