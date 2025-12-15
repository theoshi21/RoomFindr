#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdmin() {
  const adminId = 'd5fd8882-c6b2-4618-a20b-e50bab31ec09'
  const adminEmail = 'admin@roomfindr.com'

  try {
    console.log('🔄 Setting up admin account...')

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', adminId)
      .single()

    if (existingUser) {
      console.log('👤 User already exists, updating role to admin...')
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          is_verified: true,
          is_active: true
        })
        .eq('id', adminId)

      if (updateError) {
        console.error('❌ Failed to update user:', updateError.message)
        return
      }
      
      console.log('✅ User role updated to admin')
    } else {
      console.log('👤 Creating new admin user...')
      
      // Try inserting without triggering the problematic trigger
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: adminId,
          email: adminEmail,
          role: 'admin',
          is_active: true,
          is_verified: true
        })

      if (insertError) {
        console.error('❌ Failed to create user:', insertError.message)
        console.log('💡 This might be due to a database trigger issue.')
        console.log('💡 Try running this SQL directly in Supabase Dashboard:')
        console.log(`
INSERT INTO public.users (id, email, role, is_active, is_verified) 
VALUES ('${adminId}', '${adminEmail}', 'admin', true, true)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_verified = true,
  is_active = true;
        `)
        return
      }
      
      console.log('✅ Admin user created')
    }

    // Handle profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', adminId)
      .single()

    if (existingProfile) {
      console.log('👤 Profile exists, updating...')
      
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: 'System',
          last_name: 'Administrator',
          phone: '+63-900-000-0001'
        })
        .eq('user_id', adminId)

      if (profileUpdateError) {
        console.error('❌ Failed to update profile:', profileUpdateError.message)
      } else {
        console.log('✅ Profile updated')
      }
    } else {
      console.log('👤 Creating profile...')
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: adminId,
          first_name: 'System',
          last_name: 'Administrator',
          phone: '+63-900-000-0001'
        })

      if (profileError) {
        console.error('❌ Failed to create profile:', profileError.message)
      } else {
        console.log('✅ Profile created')
      }
    }

    // Verify final setup
    const { data: finalUser, error: verifyError } = await supabase
      .from('users')
      .select(`
        id, email, role, is_active, is_verified,
        user_profiles (first_name, last_name)
      `)
      .eq('id', adminId)
      .single()

    if (verifyError) {
      console.error('❌ Failed to verify setup:', verifyError.message)
      return
    }

    console.log('\n🎉 Admin account setup complete!')
    console.log('📧 Email:', finalUser.email)
    console.log('🔑 Role:', finalUser.role)
    console.log('✅ Active:', finalUser.is_active)
    console.log('✅ Verified:', finalUser.is_verified)
    
    if (finalUser.user_profiles) {
      console.log('👤 Name:', finalUser.user_profiles.first_name, finalUser.user_profiles.last_name)
    }

    console.log('\n🚀 You can now login with:')
    console.log('   Email: admin@roomfindr.com')
    console.log('   Password: [your password from Supabase Auth]')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

setupAdmin()