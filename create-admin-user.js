import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create admin user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@roomfindr.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('✅ Admin user created in auth.users:', authData.user.id);

    // Add to public.users table
    const { error: publicUserError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: 'admin@roomfindr.com',
        role: 'admin',
        is_active: true,
        is_verified: true
      });

    if (publicUserError) {
      console.error('Error creating public user:', publicUserError);
      return;
    }

    console.log('✅ Admin user added to public.users');

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+63-900-000-0001'
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return;
    }

    console.log('✅ Admin profile created');
    console.log('\n🎉 Admin user setup complete!');
    console.log('📧 Email: admin@roomfindr.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 UUID:', authData.user.id);
    console.log('\nYou can now sign in with these credentials.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();