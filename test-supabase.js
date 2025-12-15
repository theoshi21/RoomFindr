const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBasicConnection() {
  console.log('Testing basic connection...');
  
  try {
    // Try to create the users table directly
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'tenant',
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    
    // Use the raw SQL approach
    const { data, error } = await supabase.rpc('exec', { sql: createUsersTable });
    
    if (error) {
      console.log('RPC exec not available, trying alternative...');
      
      // Try inserting into a non-existent table to test connection
      const { error: testError } = await supabase
        .from('test_connection')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.log('Connection test result:', testError.message);
        if (testError.message.includes('does not exist')) {
          console.log('✅ Connection is working! Database is ready for manual setup.');
          return true;
        }
      }
    } else {
      console.log('✅ RPC exec worked!', data);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

testBasicConnection();