#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugLogin() {
  try {
    console.log('🔍 Debugging login issue...\n')

    // Check auth.users
    console.log('1. Checking auth.users table:')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return
    }

    const adminAuthUser = authUsers.users.find(u => u.email === 'admin@roomfindr.com')
    if (adminAuthUser) {
      console.log('✅ Found admin in auth.users:')
      console.log('   ID:', adminAuthUser.id)
      console.log('   Email:', adminAuthUser.email)
      console.log('   Email confirmed:', adminAuthUser.email_confirmed_at ? 'Yes' : 'No')
      console.log('   Created:', adminAuthUser.created_at)
    } else {
      console.log('❌ Admin user not found in auth.users')
      console.log('Available users:')
      authUsers.users.forEach(u => console.log(`   - ${u.email} (${u.id})`))
    }

    console.log('\n2. Checking public.users table:')
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select(`
        id, email, role, is_active, is_verified, created_at,
        user_profiles (first_name, last_name)
      `)

    if (publicError) {
      console.error('❌ Error fetching public users:', publicError.message)
      return
    }

    const adminPublicUser = publicUsers.find(u => u.email === 'admin@roomfindr.com')
    if (adminPublicUser) {
      console.log('✅ Found admin in public.users:')
      console.log('   ID:', adminPublicUser.id)
      console.log('   Email:', adminPublicUser.email)
      console.log('   Role:', adminPublicUser.role)
      console.log('   Active:', adminPublicUser.is_active)
      console.log('   Verified:', adminPublicUser.is_verified)
      console.log('   Profile:', adminPublicUser.user_profiles?.first_name, adminPublicUser.user_profiles?.last_name)
    } else {
      console.log('❌ Admin user not found in public.users')
      console.log('Available users:')
      publicUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`))
    }

    console.log('\n3. Testing login with Supabase Auth:')
    if (adminAuthUser) {
      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@roomfindr.com',
        password: 'admin123' // Updated password
      })

      if (signInError) {
        console.log('❌ Login failed:', signInError.message)
        
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('💡 This usually means:')
          console.log('   - Wrong password')
          console.log('   - Email not confirmed')
          console.log('   - User not found in auth.users')
        }
        
        if (signInError.message.includes('Email not confirmed')) {
          console.log('💡 Try confirming the email in Supabase Dashboard:')
          console.log('   - Go to Authentication → Users')
          console.log('   - Find admin@roomfindr.com')
          console.log('   - Click the three dots → Confirm email')
        }
      } else {
        console.log('✅ Login successful!')
        console.log('   User ID:', signInData.user?.id)
        console.log('   Email:', signInData.user?.email)
      }
    }

    console.log('\n4. Environment check:')
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')

  } catch (error) {
    console.error('❌ Debug error:', error.message)
  }
}

debugLogin()