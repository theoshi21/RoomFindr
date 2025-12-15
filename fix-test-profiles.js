import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUserProfile(email, role, firstName, lastName) {
  try {
    console.log(`Fixing profile for: ${email}`);

    // Get user by email
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error getting users:', getUserError);
      return false;
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      console.error(`User not found: ${email}`);
      return false;
    }

    // Check if user exists in users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('Error checking user:', userCheckError);
      return false;
    }

    // Create user record if it doesn't exist
    if (!existingUser) {
      const { error: userInsertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: email,
          role: role,
          is_verified: role === 'tenant'
        });

      if (userInsertError) {
        console.error('Error creating user record:', userInsertError);
        return false;
      }
      console.log(`✅ Created user record for ${email}`);
    }

    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileCheckError);
      return false;
    }

    // Create profile if it doesn't exist
    if (!existingProfile) {
      const { error: profileInsertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          phone: role === 'tenant' ? '+639171234567' : '+639187654321',
          bio: role === 'tenant' 
            ? 'Looking for a comfortable and affordable room.'
            : 'Experienced landlord with quality properties.'
        });

      if (profileInsertError) {
        console.error('Error creating profile:', profileInsertError);
        return false;
      }
      console.log(`✅ Created profile for ${email}`);
    } else {
      console.log(`✅ Profile already exists for ${email}`);
    }

    return true;

  } catch (error) {
    console.error(`Failed to fix profile for ${email}:`, error);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing test account profiles...\n');

  const accounts = [
    { email: 'tenant@test.com', role: 'tenant', firstName: 'John', lastName: 'Doe' },
    { email: 'landlord@test.com', role: 'landlord', firstName: 'Jane', lastName: 'Smith' }
  ];

  for (const account of accounts) {
    await fixUserProfile(account.email, account.role, account.firstName, account.lastName);
  }

  console.log('\n✅ Profile fix complete!');
  console.log('\n🧪 Test your accounts:');
  console.log('   Run: node check-test-accounts.js');
}

main().catch(console.error);