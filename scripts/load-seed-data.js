#!/usr/bin/env node

/**
 * Load Seed Data for RoomFindr
 * 
 * This script loads sample data into your Supabase database.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function loadSeedData() {
  console.log('🌱 Loading sample data...');
  
  try {
    // Load sample users
    const users = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@roomfindr.com',
        role: 'admin',
        is_active: true,
        is_verified: true
      },
      {
        id: '00000000-0000-0000-0000-000000000002', 
        email: 'landlord1@example.com',
        role: 'landlord',
        is_active: true,
        is_verified: true
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'tenant1@example.com', 
        role: 'tenant',
        is_active: true,
        is_verified: true
      }
    ];

    console.log('📝 Inserting sample users...');
    const { error: usersError } = await supabase
      .from('users')
      .upsert(users);
    
    if (usersError) {
      console.log('Note: Users may already exist or need auth.users entries first');
      console.log('Error:', usersError.message);
    } else {
      console.log('✅ Sample users loaded');
    }

    // Load sample user profiles
    const profiles = [
      {
        user_id: '00000000-0000-0000-0000-000000000001',
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+63-900-000-0001'
      },
      {
        user_id: '00000000-0000-0000-0000-000000000002',
        first_name: 'John',
        last_name: 'Landlord', 
        phone: '+63-900-000-0002'
      },
      {
        user_id: '00000000-0000-0000-0000-000000000003',
        first_name: 'Alice',
        last_name: 'Tenant',
        phone: '+63-900-000-0003'
      }
    ];

    console.log('👤 Inserting sample profiles...');
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .upsert(profiles);
    
    if (profilesError) {
      console.log('Note: Profiles insertion had issues:', profilesError.message);
    } else {
      console.log('✅ Sample profiles loaded');
    }

    console.log('\n🎉 Sample data loading completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your Next.js app: npm run dev');
    console.log('   2. Test the authentication system');
    console.log('   3. Begin implementing the next task in your spec');
    
  } catch (error) {
    console.error('❌ Error loading sample data:', error.message);
  }
}

loadSeedData();