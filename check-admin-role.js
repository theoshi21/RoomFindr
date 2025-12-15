#!/usr/bin/env node

/**
 * Check Admin Role Script
 * 
 * This script checks the admin account's role in both auth metadata
 * and database to diagnose role detection issues.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Create admin client with service role key
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkAdminAccounts() {
  console.log('🔍 Checking Admin Accounts...\n')
  
  try {
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return
    }
    
    console.log(`📊 Found ${authUsers.users.length} auth users total\n`)
    
    // Check each user for admin role
    for (const user of authUsers.users) {
      const role = user.user_metadata?.role || 'no role set'
      const email = user.email || 'no email'
      
      console.log(`👤 User: ${email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Auth Metadata Role: ${role}`)
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`)
      console.log(`   Created: ${user.created_at}`)
      
      // Check database role if exists
      try {
        const { data: dbUser, error: dbError } = await adminClient
          .from('users')
          .select('role, email')
          .eq('id', user.id)
          .single()
        
        if (dbUser) {
          console.log(`   Database Role: ${dbUser.role}`)
        } else {
          console.log(`   Database Role: ❌ Not found`)
        }
      } catch (error) {
        console.log(`   Database Role: ❌ Error checking`)
      }
      
      console.log('')
    }
    
    // Look for admin accounts specifically
    const adminUsers = authUsers.users.filter(user => 
      user.user_metadata?.role === 'admin' || 
      user.email?.includes('admin')
    )
    
    console.log(`🔑 Admin accounts found: ${adminUsers.length}`)
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin accounts found!')
      console.log('💡 You may need to create an admin account or update the role metadata')
    } else {
      console.log('\n🎯 Admin Account Details:')
      adminUsers.forEach(admin => {
        console.log(`   Email: ${admin.email}`)
        console.log(`   Role in metadata: ${admin.user_metadata?.role}`)
        console.log(`   ID: ${admin.id}`)
      })
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

async function fixAdminRole(email) {
  console.log(`\n🔧 Attempting to fix admin role for: ${email}`)
  
  try {
    // Get user by email
    const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return
    }
    
    const user = authUsers.users.find(u => u.email === email)
    
    if (!user) {
      console.error(`❌ User not found: ${email}`)
      return
    }
    
    // Update auth metadata
    const { data, error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          role: 'admin'
        }
      }
    )
    
    if (updateError) {
      console.error('❌ Error updating auth metadata:', updateError.message)
      return
    }
    
    console.log('✅ Auth metadata updated successfully')
    
    // Update database if user exists there
    try {
      const { error: dbUpdateError } = await adminClient
        .from('users')
        .update({ role: 'admin' })
        .eq('id', user.id)
      
      if (dbUpdateError) {
        console.log('⚠️  Database update failed (user might not exist in DB):', dbUpdateError.message)
      } else {
        console.log('✅ Database role updated successfully')
      }
    } catch (error) {
      console.log('⚠️  Database update failed:', error.message)
    }
    
  } catch (error) {
    console.error('💥 Error fixing admin role:', error.message)
  }
}

async function main() {
  await checkAdminAccounts()
  
  // Check if we should fix an admin account
  const args = process.argv.slice(2)
  if (args.length > 0 && args[0].includes('@')) {
    await fixAdminRole(args[0])
  } else {
    console.log('\n💡 To fix an admin role, run:')
    console.log('   node check-admin-role.js admin@example.com')
  }
}

main().catch(console.error)