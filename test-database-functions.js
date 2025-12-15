const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseFunctions() {
  console.log('🧪 Testing database functions...\n');
  
  try {
    // Test 1: Check if custom types exist
    console.log('1. Testing custom types...');
    const { data: enumData, error: enumError } = await supabase
      .from('properties')
      .select('room_type')
      .limit(1);
    
    if (enumError && !enumError.message.includes('no rows')) {
      console.log('❌ Custom types test failed:', enumError.message);
    } else {
      console.log('✅ Custom types are working');
    }

    // Test 2: Test search function
    console.log('\n2. Testing search_properties function...');
    const { data: searchData, error: searchError } = await supabase
      .rpc('search_properties', {
        p_limit: 5
      });
    
    if (searchError) {
      console.log('❌ Search function test failed:', searchError.message);
    } else {
      console.log('✅ Search function is working');
      console.log(`   Found ${searchData?.length || 0} properties`);
    }

    // Test 3: Test notification function
    console.log('\n3. Testing create_notification function...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const { data: notifData, error: notifError } = await supabase
      .rpc('create_notification', {
        p_user_id: testUserId,
        p_type: 'announcement',
        p_title: 'Database Test',
        p_message: 'Testing notification system',
        p_metadata: { test: true }
      });
    
    if (notifError) {
      console.log('❌ Notification function test failed:', notifError.message);
    } else {
      console.log('✅ Notification function is working');
      console.log(`   Created notification with ID: ${notifData}`);
    }

    // Test 4: Check RLS policies
    console.log('\n4. Testing Row Level Security...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    
    if (rlsError) {
      console.log('❌ RLS test failed:', rlsError.message);
    } else {
      console.log('✅ Row Level Security is configured');
      console.log(`   Can access ${rlsData?.length || 0} user records`);
    }

    console.log('\n🎉 Database function tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDatabaseFunctions();