import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email, password) {
  try {
    console.log(`Testing login for: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error(`❌ Login failed for ${email}:`, error.message);
      return false;
    }

    console.log(`✅ Login successful for ${email}`);
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Role: ${data.user.user_metadata?.role || 'Not set'}`);
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError) {
      console.log(`   Profile: ❌ ${profileError.message}`);
    } else {
      console.log(`   Profile: ✅ ${profile.first_name} ${profile.last_name}`);
    }

    // Sign out
    await supabase.auth.signOut();
    return true;

  } catch (error) {
    console.error(`❌ Error testing ${email}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing RoomFindr accounts...\n');

  const accounts = [
    { email: 'admin@roomfindr.com', password: 'admin123', role: 'Admin' },
    { email: 'tenant@test.com', password: 'password123', role: 'Tenant' },
    { email: 'landlord@test.com', password: 'password123', role: 'Landlord' }
  ];

  let allWorking = true;

  for (const account of accounts) {
    console.log(`\n👤 ${account.role} Account:`);
    const working = await testLogin(account.email, account.password);
    if (!working) allWorking = false;
  }

  console.log('\n📋 Summary:');
  console.log('===========');
  
  if (allWorking) {
    console.log('✅ All test accounts are working properly!');
    console.log('\n🚀 You can now:');
    console.log('   1. Start your development server: npm run dev');
    console.log('   2. Visit: http://localhost:3000');
    console.log('   3. Login with any account:');
    console.log('      • admin@roomfindr.com / admin123');
    console.log('      • tenant@test.com / password123');
    console.log('      • landlord@test.com / password123');
  } else {
    console.log('❌ Some accounts have issues. You may need to recreate them.');
    console.log('   Run: node reset-test-accounts.js');
  }
}

main().catch(console.error);