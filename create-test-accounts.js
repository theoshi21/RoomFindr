import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestAccount(email, password, role, firstName, lastName) {
  try {
    console.log(`Creating ${role} account: ${email}`);
    
    // Create user with admin client (bypasses email verification)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // This bypasses email verification
      user_metadata: {
        role: role,
        firstName: firstName,
        lastName: lastName
      }
    });

    if (authError) {
      console.error(`Error creating ${role} user:`, authError);
      return null;
    }

    console.log(`✅ Created ${role} user:`, authData.user.email);

    // Create entry in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        role: role,
        is_verified: role === 'tenant' // Auto-verify tenants, landlords need manual verification
      })
      .select()
      .single();

    if (userError) {
      console.error(`Error creating ${role} user record:`, userError);
      return authData.user;
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        phone: role === 'tenant' ? '+639171234567' : '+639187654321',
        bio: role === 'tenant' 
          ? 'Looking for a comfortable and affordable room.'
          : 'Experienced landlord with quality properties.'
      })
      .select()
      .single();

    if (profileError) {
      console.error(`Error creating ${role} profile:`, profileError);
      return { user: authData.user, userData };
    }

    console.log(`✅ Created ${role} profile for:`, email);
    
    return {
      user: authData.user,
      userData,
      profile: profileData
    };

  } catch (error) {
    console.error(`Failed to create ${role} account:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 Creating test accounts...\n');

  // Create tenant account
  const tenant = await createTestAccount(
    'tenant@test.com',
    'password123',
    'tenant',
    'John',
    'Doe'
  );

  // Create landlord account
  const landlord = await createTestAccount(
    'landlord@test.com',
    'password123',
    'landlord',
    'Jane',
    'Smith'
  );

  console.log('\n📋 Test Account Summary:');
  console.log('========================');
  
  if (tenant) {
    console.log('🏠 TENANT ACCOUNT:');
    console.log('   Email: tenant@test.com');
    console.log('   Password: password123');
    console.log('   Status: Ready to use');
    console.log('');
  }

  if (landlord) {
    console.log('🏢 LANDLORD ACCOUNT:');
    console.log('   Email: landlord@test.com');
    console.log('   Password: password123');
    console.log('   Status: Needs verification (upload documents)');
    console.log('');
  }

  console.log('💡 Tips:');
  console.log('   - Both accounts are email-verified and ready to login');
  console.log('   - Tenant can immediately search and book rooms');
  console.log('   - Landlord needs to complete verification before listing properties');
  console.log('   - Use these credentials on your login page');
}

main().catch(console.error);