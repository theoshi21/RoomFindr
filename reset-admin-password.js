#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetAdminPassword() {
  const adminId = 'd5fd8882-c6b2-4618-a20b-e50bab31ec09'
  const newPassword = 'admin123' // Change this to whatever you want

  try {
    console.log('🔄 Resetting admin password...')

    // Update the user's password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(adminId, {
      password: newPassword
    })

    if (error) {
      console.error('❌ Failed to reset password:', error.message)
      return
    }

    console.log('✅ Password reset successfully!')
    console.log('📧 Email: admin@roomfindr.com')
    console.log('🔑 New Password:', newPassword)
    console.log('\n🚀 You can now login with these credentials!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

resetAdminPassword()