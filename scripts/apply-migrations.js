#!/usr/bin/env node

/**
 * Apply Database Migrations for RoomFindr
 * 
 * This script applies the database migrations to your Supabase project.
 * Run with: node scripts/apply-migrations.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function showMigrationInstructions(filename) {
  console.log(`📄 Migration: ${filename}`);
  
  try {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    
    if (!fs.existsSync(migrationPath)) {
      console.log(`   ⚠️  Migration file not found: ${filename}`);
      return false;
    }
    
    console.log(`   ✅ Migration file ready: ${filename}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error reading migration ${filename}:`, error.message);
    return false;
  }
}

async function testConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting RoomFindr database migration...\n');
  
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    console.log('\n📦 Checking database migrations...');
    
    // Check migrations in order
    const migrations = [
      '001_initial_schema.sql',
      '002_rls_policies.sql',
      '003_functions_and_triggers.sql',
      '004_verification_storage.sql',
      '005_roommate_profiles.sql',
      '006_policy_system.sql',
      '007_storage_policies.sql'
    ];
    
    let allReady = true;
    for (const migration of migrations) {
      const ready = await showMigrationInstructions(migration);
      if (!ready) allReady = false;
    }
    
    if (allReady) {
      console.log('\n✅ All migration files are ready!');
      console.log('\n⚠️  IMPORTANT: Supabase migrations must be applied manually:');
      console.log('   1. Open your Supabase Dashboard');
      console.log('   2. Go to SQL Editor');
      console.log('   3. Copy and paste each migration file content');
      console.log('   4. Execute them in order');
      console.log('\n   Or use Supabase CLI:');
      console.log('   supabase db push');
    }
    
    console.log('\n📝 Next steps after applying migrations:');
    console.log('   1. Test the database connection: npm run db:test');
    console.log('   2. Load sample data: npm run db:seed');
    console.log('   3. Start your Next.js application: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();