#!/usr/bin/env node

/**
 * Create Admin Account Script for RoomFindr
 * 
 * This script helps create an admin account by:
 * 1. Finding the user in auth.users table
 * 2. Adding them to public.users with admin role
 * 3. Creating their profile
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminAccount() {
  try {
    console.log('🔍 Looking for users in auth.users...')
    
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`)
    }

    if (!authUsers.users || authUsers.users.length === 0) {
      console.log('❌ No users found in auth.users')
      console.log('Please create a user in Supabase Dashboard first:')
      console.log('1. Go to Authentication → Users → Add user')
      console.log('2. Email: admin@roomfindr.com (or your preferred email)')
      console.log('3. Password: your-secure-password')
      console.log('4. Check "Auto Confirm User"')
      console.log('5. Run this script again')
      return
    }

    console.log('📋 Found users in auth.users:')
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`)
    })

    // Check which users are already in public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, role')

    if (publicError) {
      throw new Error(`Failed to fetch public users: ${publicError.message}`)
    }

    const existingUserIds = new Set(publicUsers.map(u => u.id))

    // Find users that need to be added to public.users
    const usersToAdd = authUsers.users.filter(user => !existingUserIds.has(user.id))

    if (usersToAdd.length === 0) {
      console.log('✅ All auth users are already in public.users table')
      
      // Show current admin users
      const adminUsers = publicUsers.filter(u => u.role === 'admin')
      if (adminUsers.length > 0) {
        console.log('👑 Current admin users:')
        adminUsers.forEach(admin => {
          console.log(`   - ${admin.email} (${admin.id})`)
        })
      } else {
        console.log('❌ No admin users found. Would you like to promote a user to admin?')
        
        if (publicUsers.length > 0) {
          console.log('Available users to promote:')
          publicUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.role})`)
          })
          
          // For now, let's promote the first user to admin
          const userToPromote = publicUsers[0]
          console.log(`🔄 Promoting ${userToPromote.email} to admin...`)
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin', is_verified: true })
            .eq('id', userToPromote.id)

          if (updateError) {
            throw new Error(`Failed to promote user: ${updateError.message}`)
          }

          console.log(`✅ Successfully promoted ${userToPromote.email} to admin!`)
        }
      }
      return
    }

    console.log(`\n🔄 Adding ${usersToAdd.length} user(s) to public.users table...`)

    for (const authUser of usersToAdd) {
      console.log(`Adding ${authUser.email}...`)
      
      // Determine if this should be an admin (you can modify this logic)
      const isAdmin = authUser.email.includes('admin') || 
                     authUser.email === 'admin@roomfindr.com' ||
                     usersToAdd.length === 1 // If only one user, make them admin

      // Insert into public.users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          role: isAdmin ? 'admin' : 'tenant',
          is_active: true,
          is_verified: true
        })

      if (userError) {
        console.error(`❌ Failed to add user ${authUser.email}:`, userError.message)
        continue
      }

      // Create user profile
      const names = authUser.email.split('@')[0].split('.')
      const firstName = names[0] || 'User'
      const lastName = names[1] || (isAdmin ? 'Admin' : 'User')

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authUser.id,
          first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          phone: isAdmin ? '+63-900-000-0001' : null
        })

      if (profileError) {
        console.error(`❌ Failed to create profile for ${authUser.email}:`, profileError.message)
        continue
      }

      console.log(`✅ Successfully added ${authUser.email} as ${isAdmin ? 'admin' : 'tenant'}`)

      // Create welcome notification
      await supabase
        .from('notifications')
        .insert({
          user_id: authUser.id,
          notification_type: 'announcement',
          title: `Welcome to RoomFindr${isAdmin ? ' Admin' : ''}`,
          message: `Your ${isAdmin ? 'admin ' : ''}account has been set up successfully.`,
          metadata: { setup: 'complete' }
        })
    }

    console.log('\n🎉 Admin account setup complete!')
    console.log('You can now login with your credentials.')

  } catch (error) {
    console.error('❌ Error creating admin account:', error.message)
    process.exit(1)
  }
}

// Run the script
createAdminAccount()