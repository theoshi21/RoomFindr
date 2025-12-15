#!/usr/bin/env node

/**
 * Fix Admin Name Script
 * 
 * This script adds firstName and lastName to the admin account's auth metadata
 * so the welcome message will show the proper name.
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

async function fixAdminName() {
  console.log('🔧 Fixing Admin Account Name Metadata...\n')
  
  try {
    // Get admin user
    const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return
    }
    
    const adminUser = authUsers.users.find(u => u.email === 'admin@roomfindr.com')
    
    if (!adminUser) {
      console.error('❌ Admin user not found')
      return
    }
    
    console.log('👤 Current admin metadata:')
    console.log(JSON.stringify(adminUser.user_metadata, null, 2))
    
    // Update auth metadata with name fields
    const { data, error: updateError } = await adminClient.auth.admin.updateUserById(
      adminUser.id,
      {
        user_metadata: {
          ...adminUser.user_metadata,
          role: 'admin',
          firstName: 'System',
          lastName: 'Administrator'
        }
      }
    )
    
    if (updateError) {
      console.error('❌ Error updating auth metadata:', updateError.message)
      return
    }
    
    console.log('\n✅ Admin metadata updated successfully!')
    console.log('📝 New metadata:')
    console.log(JSON.stringify(data.user.user_metadata, null, 2))
    
    console.log('\n🎉 Admin account should now show: "Good morning, System! 👋"')
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

fixAdminName().catch(console.error)