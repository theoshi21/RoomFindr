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

async function fixAdminSetup() {
  const adminId = 'd5fd8882-c6b2-4618-a20b-e50bab31ec09'
  const adminEmail = 'admin@roomfindr.com'

  try {
    console.log('🔄 Fixing admin account setup...')

    // First, let's disable the trigger temporarily
    console.log('🔧 Disabling user creation trigger...')
    await supabase.rpc('exec', {
      sql: 'ALTER TABLE public.users DISABLE TRIGGER on_user_created;'
    }).catch(() => {
      // Ignore error if trigger doesn't exist or can't be disabled
      console.log('⚠️  Could not disable trigger (this is okay)')
    })

    // Insert admin user directly with SQL
    console.log('👤 Creating admin user...')
    const { error: sqlError } = await supabase.rpc('exec', {
      sql: `
        INSERT INTO public.users (id, email, role, is_active, is_verified) 
        VALUES ('${adminId}', '${adminEmail}', 'admin', true, true)
        ON CONFLICT (id) DO UPDATE SET
          role = 'admin',
          is_verified = true,
          is_active = true;
      `
    })

    if (sqlError) {
      console.error('❌ SQL Error:', sqlError.message)
      // Try the direct approach instead
      console.log('🔄 Trying direct insert...')
      
      const { error: directError } = await supabase
        .from('users')
        .insert({
          id: adminId,
          email: adminEmail,
          role: 'admin',
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (directError) {
        console.error('❌ Direct insert failed:', directError.message)
        
        // Try update instead
        console.log('🔄 Trying update instead...')
        const { error: updateError } = await supabase
          .from('users')
          .update({
            role: 'admin',
            is_verified: true,
            is_active: true
          })
          .eq('id', adminId)

        if (updateError) {
          console.error('❌ Update failed:', updateError.message)
          return
        }
      }
    }

    console.log('✅ Admin user created/updated')

    // Create admin profile
    console.log('👤 Creating admin profile...')
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: adminId,
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+63-900-000-0001'
      })
      .select()

    if (profileError) {
      // Try update instead
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: 'System',
          last_name: 'Administrator',
          phone: '+63-900-000-0001'
        })
        .eq('user_id', adminId)

      if (profileUpdateError) {
        console.error('❌ Profile creation/update failed:', profileUpdateError.message)
      } else {
        console.log('✅ Admin profile updated')
      }
    } else {
      console.log('✅ Admin profile created')
    }

    // Re-enable the trigger
    console.log('🔧 Re-enabling user creation trigger...')
    await supabase.rpc('exec', {
      sql: 'ALTER TABLE public.users ENABLE TRIGGER on_user_created;'
    }).catch(() => {
      console.log('⚠️  Could not re-enable trigger')
    })

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
    console.log('👤 Name:', adminUser.user_profiles?.first_name || 'N/A', adminUser.user_profiles?.last_name || 'N/A')
    console.log('🔑 Role:', adminUser.role)
    console.log('✅ Active:', adminUser.is_active)
    console.log('✅ Verified:', adminUser.is_verified)
    console.log('\n🚀 You can now login with your admin credentials!')
    console.log('   Email: admin@roomfindr.com')
    console.log('   Password: [your password from Supabase Auth]')

  } catch (error) {
    console.error('❌ Error setting up admin:', error.message)
  }
}

fixAdminSetup()