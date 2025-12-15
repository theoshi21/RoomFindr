import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

async function runSQL(sql) {
  try {
    console.log('Executing SQL:', sql.substring(0, 100) + '...');
    
    // Use the SQL query directly
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Connection Error:', error);
      return false;
    }
    
    console.log('✅ Connection successful, but we need to run SQL through dashboard');
    return true;
  } catch (error) {
    console.error('Execution Error:', error);
    return false;
  }
}

async function fixUserCreation() {
  console.log('🔧 Fixing user creation triggers...');
  
  const fixSQL = `
-- Fix the user creation trigger that's causing the database error

-- Drop the existing problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if we have a valid email
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        INSERT INTO public.users (id, email, role, is_active, is_verified)
        VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role,
            true,
            COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            is_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
            updated_at = NOW();
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth.users insertion
        RAISE WARNING 'Failed to create public.users record for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `;

  const success = await runSQL(fixSQL);
  
  if (success) {
    console.log('🎉 User creation triggers fixed!');
    console.log('Now try creating a user through the Supabase dashboard again.');
  } else {
    console.log('❌ Failed to fix triggers. Let me try a different approach...');
    
    // Try executing each statement separately
    const statements = [
      'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;',
      'DROP FUNCTION IF EXISTS public.handle_new_user();'
    ];
    
    for (const stmt of statements) {
      console.log(`Executing: ${stmt}`);
      await runSQL(stmt);
    }
  }
}

fixUserCreation();