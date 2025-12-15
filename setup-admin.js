#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdmin() {
  const adminId = 'd5fd8882-c6b2-4618-a20b-e50bab31ec09'
  const adminEmail = 'admin@roomfindr.com'

  try {
    console.log('🔄 Setting up admin account...')

    // Insert admin user
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: adminId,
        email: adminEmail,
        role: 'admin',
        is_active: true,
        is_verified: true
      })

    if (userError) {
      console.error('❌ Failed to create admin user:', userError.message)
      return
    }

    console.log('✅ Admin user created/updated')

    // Create admin profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: adminId,
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+63-900-000-0001'
      })

    if (profileError) {
      console.error('❌ Failed to create admin profile:', profileError.message)
      return
    }

    console.log('✅ Admin profile created/updated')

    // Create welcome notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: adminId,
        notification_type: 'announcement',
        title: 'Welcome to RoomFindr Admin',
        message: 'Your admin account has been set up successfully. You can now manage the platform.',
        metadata: { setup: 'complete' }
      })

    if (notificationError && !notificationError.message.includes('duplicate')) {
      console.error('❌ Failed to create notification:', notificationError.message)
    } else {
      console.log('✅ Welcome notification created')
    }

    // Verify admin user
    const { data: adminUser, error: verifyError } = await supabase
      .from('users')
      .select(`
        id, email, role, is_active, is_verified,
        user_profiles (first_name, last_name)
      `)
      .eq('id', adminId)
      .single()

    if (verifyError) {
      console.error('❌ Failed to verify admin user:', verifyError.message)
      return
    }

    console.log('\n🎉 Admin account setup complete!')
    console.log('📧 Email:', adminUser.email)
    console.log('👤 Name:', adminUser.user_profiles?.first_name, adminUser.user_profiles?.last_name)
    console.log('🔑 Role:', adminUser.role)
    console.log('✅ Active:', adminUser.is_active)
    console.log('✅ Verified:', adminUser.is_verified)
    console.log('\nYou can now login with your admin credentials!')

  } catch (error) {
    console.error('❌ Error setting up admin:', error.message)
  }
}

setupAdmin()