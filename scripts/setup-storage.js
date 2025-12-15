#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Storage bucket configurations
const BUCKETS = [
  {
    id: 'property-images',
    name: 'Property Images',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  },
  {
    id: 'avatars',
    name: 'User Avatars',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },
  {
    id: 'verification-documents',
    name: 'Verification Documents',
    public: false,
    fileSizeLimit: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  },
  {
    id: 'announcements',
    name: 'Announcement Images',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  },
];

// Note: Storage policies are now handled via database migrations
// See: supabase/migrations/007_storage_policies.sql

async function createBuckets() {
  console.log('🗂️  Setting up Supabase Storage buckets...\n');

  for (const bucket of BUCKETS) {
    try {
      console.log(`Creating bucket: ${bucket.name} (${bucket.id})`);
      
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ✅ Bucket ${bucket.id} already exists`);
        } else {
          console.error(`  ❌ Failed to create bucket ${bucket.id}:`, error.message);
        }
      } else {
        console.log(`  ✅ Created bucket ${bucket.id}`);
      }
    } catch (error) {
      console.error(`  ❌ Error creating bucket ${bucket.id}:`, error.message);
    }
  }
}

async function createStoragePolicies() {
  console.log('\n🔒 Storage RLS policies setup...\n');
  console.log('⚠️  Storage policies should be applied via database migrations.');
  console.log('   Run the following command to apply storage policies:');
  console.log('   npm run db:migrate');
  console.log('   Or apply migration 007_storage_policies.sql manually in Supabase dashboard');
}

async function setupStorage() {
  try {
    console.log('🚀 Starting Supabase Storage setup...\n');
    
    // Test connection
    const { data, error } = await supabase.auth.getSession();
    if (error && !error.message.includes('session_not_found')) {
      throw new Error(`Connection failed: ${error.message}`);
    }
    
    console.log('✅ Connected to Supabase\n');
    
    // Create buckets
    await createBuckets();
    
    // Create RLS policies
    await createStoragePolicies();
    
    console.log('\n🎉 Storage setup completed successfully!');
    console.log('\nBuckets created:');
    BUCKETS.forEach(bucket => {
      console.log(`  • ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
  } catch (error) {
    console.error('\n❌ Storage setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupStorage();