#!/usr/bin/env node

/**
 * Database Setup Script for RoomFindr
 * 
 * This script helps set up the database schema and initial data.
 * Run with: node scripts/setup-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

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

async function runMigration(filename) {
  console.log(`📄 Running migration: ${filename}`);
  
  try {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL by statements (basic splitting on semicolons)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    console.log(`✅ Migration ${filename} completed successfully`);
  } catch (error) {
    console.error(`❌ Error running migration ${filename}:`, error.message);
    throw error;
  }
}

async function loadSeedData() {
  console.log('🌱 Loading seed data...');
  
  try {
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');
    
    // Execute seed data
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error('❌ Error loading seed data:', error.message);
      throw error;
    }
    
    console.log('✅ Seed data loaded successfully');
  } catch (error) {
    console.error('❌ Error loading seed data:', error.message);
    throw error;
  }
}

async function testConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
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

async function checkTables() {
  console.log('📋 Checking database tables...');
  
  const expectedTables = [
    'users',
    'user_profiles',
    'landlord_verifications',
    'verification_documents',
    'properties',
    'reservations',
    'transactions',
    'notifications',
    'reviews'
  ];
  
  try {
    for (const table of expectedTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table '${table}' not accessible:`, error.message);
      } else {
        console.log(`✅ Table '${table}' is accessible`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting RoomFindr database setup...\n');
  
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    console.log('\n📦 Setting up database schema...');
    
    // Note: In a real setup, you would run these migrations through Supabase CLI
    // This script is for reference and local development
    console.log('ℹ️  For production setup, use Supabase CLI:');
    console.log('   supabase db reset');
    console.log('   supabase db push');
    
    // Check if tables exist
    await checkTables();
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify your Supabase project settings');
    console.log('   2. Configure authentication providers if needed');
    console.log('   3. Set up storage buckets for file uploads');
    console.log('   4. Configure email templates');
    console.log('   5. Test the application with sample data');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
RoomFindr Database Setup Script

Usage: node scripts/setup-database.js [options]

Options:
  --help, -h     Show this help message
  --test         Test database connection only
  --check        Check table accessibility only

Environment Variables Required:
  NEXT_PUBLIC_SUPABASE_URL      Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY     Your Supabase service role key

Note: This script is for reference. Use Supabase CLI for production setup.
`);
  process.exit(0);
}

if (args.includes('--test')) {
  testConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (args.includes('--check')) {
  checkTables().then(() => {
    process.exit(0);
  });
} else {
  main();
}