#!/usr/bin/env node

/**
 * Debug User Data Script
 * 
 * This script logs in as each test user and shows their complete user object
 * to debug why the profile name isn't showing in the dashboard.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, anonKey)

async function debugUserData(email, password, role) {
  console.log(`\n🔍 Debugging ${role} account: ${email}`)
  console.log('=' .repeat(50))
  
  try {
    // Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Login successful')
    console.log('\n📊 Auth User Data:')
    console.log('  ID:', authData.user.id)
    console.log('  Email:', authData.user.email)
    console.log('  Email Confirmed:', authData.user.email_confirmed_at ? '✅' : '❌')
    console.log('  Created:', authData.user.created_at)
    
    console.log('\n🏷️  User Metadata:')
    console.log('  Raw metadata:', JSON.stringify(authData.user.user_metadata, null, 2))
    console.log('  Role:', authData.user.user_metadata?.role || 'NOT SET')
    console.log('  First Name:', authData.user.user_metadata?.first_name || 'NOT SET')
    console.log('  Last Name:', authData.user.user_metadata?.last_name || 'NOT SET')
    
    // Try to get profile from database
    console.log('\n👤 Database Profile:')
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()
      
      if (profileError) {
        console.log('  ❌ Profile Error:', profileError.message)
      } else {
        console.log('  ✅ Profile found:')
        console.log('    First Name:', profile.first_name || 'NOT SET')
        console.log('    Last Name:', profile.last_name || 'NOT SET')
        console.log('    Phone:', profile.phone || 'NOT SET')
        console.log('    Bio:', profile.bio || 'NOT SET')
      }
    } catch (error) {
      console.log('  ❌ Database query failed:', error.message)
    }
    
    // Test what getCurrentUserWithProfile would return
    console.log('\n🔄 Simulating getCurrentUserWithProfile:')
    const simulatedUser = {
      id: authData.user.id,
      email: authData.user.email || '',
      role: (authData.user.user_metadata?.role || 'tenant'),
      is_active: true,
      is_verified: authData.user.email_confirmed_at ? true : false,
      created_at: authData.user.created_at,
      updated_at: authData.user.updated_at || authData.user.created_at
    }
    
    const simulatedProfile = {
      id: authData.user.id,
      user_id: authData.user.id,
      first_name: authData.user.user_metadata?.firstName || authData.user.user_metadata?.first_name || '',
      last_name: authData.user.user_metadata?.lastName || authData.user.user_metadata?.last_name || '',
      phone: null,
      avatar: null,
      bio: null,
      preferences: null,
      created_at: authData.user.created_at,
      updated_at: authData.user.updated_at || authData.user.created_at
    }
    
    console.log('  Simulated User Object:')
    console.log('    Role:', simulatedUser.role)
    console.log('    Email:', simulatedUser.email)
    
    console.log('  Simulated Profile Object:')
    console.log('    First Name:', `"${simulatedProfile.first_name}"`)
    console.log('    Last Name:', `"${simulatedProfile.last_name}"`)
    console.log('    Full Name:', `"${simulatedProfile.first_name} ${simulatedProfile.last_name}"`)
    
    // Test the welcome message logic
    const firstName = simulatedProfile.first_name || 'User'
    console.log('\n💬 Welcome Message Test:')
    console.log(`  Would show: "Good morning, ${firstName}! 👋"`)
    
    // Sign out
    await supabase.auth.signOut()
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
  }
}

async function main() {
  console.log('🔍 Debugging User Data for Dashboard Welcome Messages\n')
  
  const accounts = [
    { email: 'admin@roomfindr.com', password: 'admin123', role: 'Admin' },
    { email: 'tenant@test.com', password: 'password123', role: 'Tenant' },
    { email: 'landlord@test.com', password: 'password123', role: 'Landlord' }
  ]
  
  for (const account of accounts) {
    await debugUserData(account.email, account.password, account.role)
  }
  
  console.log('\n💡 Summary:')
  console.log('If first_name is empty in user_metadata, the welcome message will be blank.')
  console.log('Check if the user_metadata was set correctly during account creation.')
}

main().catch(console.error)