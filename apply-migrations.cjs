const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error('SQL Error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Execution Error:', error);
    return false;
  }
}

async function runMigration004() {
  console.log('Running migration 004: Verification Storage...');
  
  // Create storage bucket
  const createBucket = `
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'verification-documents',
      'verification-documents',
      false,
      10485760,
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  await runSQL(createBucket);
  
  // Create RLS policies
  const policies = [
    `CREATE POLICY "Landlords can upload verification documents" ON storage.objects
     FOR INSERT WITH CHECK (
       bucket_id = 'verification-documents' 
       AND auth.uid()::text = (storage.foldername(name))[1]
       AND EXISTS (
         SELECT 1 FROM public.users 
         WHERE id = auth.uid() 
         AND role = 'landlord'
       )
     );`,
    
    `CREATE POLICY "Landlords can view their own verification documents" ON storage.objects
     FOR SELECT USING (
       bucket_id = 'verification-documents' 
       AND auth.uid()::text = (storage.foldername(name))[1]
       AND EXISTS (
         SELECT 1 FROM public.users 
         WHERE id = auth.uid() 
         AND role = 'landlord'
       )
     );`,
    
    `CREATE POLICY "Admins can view all verification documents" ON storage.objects
     FOR SELECT USING (
       bucket_id = 'verification-documents' 
       AND EXISTS (
         SELECT 1 FROM public.users 
         WHERE id = auth.uid() 
         AND role = 'admin'
       )
     );`,
    
    `CREATE POLICY "Landlords can delete their own verification documents" ON storage.objects
     FOR DELETE USING (
       bucket_id = 'verification-documents' 
       AND auth.uid()::text = (storage.foldername(name))[1]
       AND EXISTS (
         SELECT 1 FROM public.users 
         WHERE id = auth.uid() 
         AND role = 'landlord'
       )
     );`
  ];
  
  for (const policy of policies) {
    await runSQL(policy);
  }
  
  // Enable RLS
  await runSQL('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;');
  
  console.log('✅ Migration 004 completed');
}

async function runMigration005() {
  console.log('Running migration 005: Roommate Profiles...');
  
  // Create roommate_profiles table
  const createTable = `
    CREATE TABLE IF NOT EXISTS public.roommate_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        avatar TEXT,
        bio TEXT,
        age INTEGER CHECK (age >= 18 AND age <= 100),
        occupation TEXT,
        lifestyle JSONB NOT NULL DEFAULT '{}',
        compatibility JSONB NOT NULL DEFAULT '{}',
        privacy_settings JSONB NOT NULL DEFAULT '{"showFullName": true, "showAge": true, "showOccupation": true, "showBio": true, "showLifestyle": true, "showCompatibility": false, "showContactInfo": false}',
        move_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
        move_out_date DATE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT valid_move_dates CHECK (move_out_date IS NULL OR move_out_date > move_in_date)
    );
  `;
  
  await runSQL(createTable);
  
  // Create unique constraint
  await runSQL(`
    CREATE UNIQUE INDEX IF NOT EXISTS roommate_profiles_unique_active 
    ON public.roommate_profiles(user_id, property_id) 
    WHERE is_active = true;
  `);
  
  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_roommate_profiles_user_id ON public.roommate_profiles(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_roommate_profiles_property_id ON public.roommate_profiles(property_id);',
    'CREATE INDEX IF NOT EXISTS idx_roommate_profiles_is_active ON public.roommate_profiles(is_active);',
    'CREATE INDEX IF NOT EXISTS idx_roommate_profiles_age ON public.roommate_profiles(age);',
    'CREATE INDEX IF NOT EXISTS idx_roommate_profiles_move_in_date ON public.roommate_profiles(move_in_date);'
  ];
  
  for (const index of indexes) {
    await runSQL(index);
  }
  
  // Add updated_at trigger
  await runSQL(`
    CREATE TRIGGER update_roommate_profiles_updated_at 
        BEFORE UPDATE ON public.roommate_profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
  
  // Enable RLS
  await runSQL('ALTER TABLE public.roommate_profiles ENABLE ROW LEVEL SECURITY;');
  
  console.log('✅ Migration 005 completed');
}

async function main() {
  console.log('Starting migrations...');
  
  await runMigration004();
  await runMigration005();
  
  console.log('🎉 All migrations completed successfully!');
}

main().catch(console.error);