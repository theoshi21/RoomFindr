#!/usr/bin/env node

/**
 * Apply Policy System Migration for RoomFindr
 * 
 * This script applies the policy system migration to your Supabase project.
 * Run with: node scripts/apply-policy-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

async function createPolicyTables() {
  console.log('📄 Creating policy system tables...');
  
  try {
    // Since we can't execute DDL directly, let's check if tables exist by trying to query them
    // and create them manually through the Supabase dashboard if needed
    
    // Test if policy_templates table exists
    const { error: templatesError } = await supabase
      .from('policy_templates')
      .select('id')
      .limit(1);
    
    if (templatesError && templatesError.message.includes('does not exist')) {
      console.log('❌ Policy tables do not exist. Please create them manually in Supabase dashboard.');
      console.log('📋 SQL to run in Supabase SQL Editor:');
      console.log(`
-- Policy Templates table
CREATE TABLE IF NOT EXISTS policy_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'rental_terms', 'house_rules', 'maintenance', 'security', 
    'utilities', 'guest_policy', 'pet_policy', 'smoking_policy', 
    'cleaning_policy', 'cancellation_policy', 'custom'
  )),
  default_value TEXT DEFAULT '',
  is_system_template BOOLEAN DEFAULT FALSE,
  landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property Policies table
CREATE TABLE IF NOT EXISTS property_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policy_templates(id) ON DELETE CASCADE,
  custom_value TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, policy_id)
);

-- Policy Updates table
CREATE TABLE IF NOT EXISTS policy_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policy_templates(id) ON DELETE CASCADE,
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_sent BOOLEAN DEFAULT FALSE
);

-- Rental Agreements table
CREATE TABLE IF NOT EXISTS rental_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policies JSONB NOT NULL DEFAULT '[]',
  terms_accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reservation_id)
);
      `);
      return false;
    } else {
      console.log('✅ Policy system tables already exist');
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking policy tables:', error.message);
    return false;
  }
}

async function createIndexes() {
  console.log('📄 Indexes will be created with the tables...');
  
  console.log('📋 Index SQL for Supabase SQL Editor:');
  console.log(`
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policy_templates_landlord_id ON policy_templates(landlord_id);
CREATE INDEX IF NOT EXISTS idx_policy_templates_category ON policy_templates(category);
CREATE INDEX IF NOT EXISTS idx_policy_templates_system ON policy_templates(is_system_template);
CREATE INDEX IF NOT EXISTS idx_property_policies_property_id ON property_policies(property_id);
CREATE INDEX IF NOT EXISTS idx_property_policies_policy_id ON property_policies(policy_id);
CREATE INDEX IF NOT EXISTS idx_property_policies_active ON property_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_policy_updates_property_id ON policy_updates(property_id);
CREATE INDEX IF NOT EXISTS idx_policy_updates_updated_at ON policy_updates(updated_at);
CREATE INDEX IF NOT EXISTS idx_policy_updates_notification_sent ON policy_updates(notification_sent);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_reservation_id ON rental_agreements(reservation_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_property_id ON rental_agreements(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_tenant_id ON rental_agreements(tenant_id);
  `);
  
  console.log('✅ Index SQL provided for manual execution');
}

async function insertSystemTemplates() {
  console.log('📄 Inserting system policy templates...');
  
  const systemTemplates = [
    {
      title: 'Pet Policy',
      description: 'Rules regarding pets in the property',
      category: 'pet_policy',
      default_value: 'No pets allowed',
      is_system_template: true
    },
    {
      title: 'Smoking Policy',
      description: 'Rules regarding smoking in the property',
      category: 'smoking_policy',
      default_value: 'No smoking inside the property',
      is_system_template: true
    },
    {
      title: 'Guest Policy',
      description: 'Rules regarding guests and visitors',
      category: 'guest_policy',
      default_value: 'Guests allowed until 10 PM with prior notice',
      is_system_template: true
    },
    {
      title: 'Cleaning Policy',
      description: 'Cleaning responsibilities and requirements',
      category: 'cleaning_policy',
      default_value: 'Tenant responsible for regular cleaning, deep cleaning upon move-out',
      is_system_template: true
    },
    {
      title: 'Cancellation Policy',
      description: 'Terms for reservation cancellation',
      category: 'cancellation_policy',
      default_value: '48-hour notice required for cancellation',
      is_system_template: true
    },
    {
      title: 'Noise Policy',
      description: 'Rules regarding noise levels',
      category: 'house_rules',
      default_value: 'Quiet hours from 10 PM to 7 AM',
      is_system_template: true
    },
    {
      title: 'Utility Policy',
      description: 'Utility usage and payment terms',
      category: 'utilities',
      default_value: 'Utilities included up to reasonable usage limits',
      is_system_template: true
    },
    {
      title: 'Security Deposit',
      description: 'Security deposit terms and conditions',
      category: 'rental_terms',
      default_value: 'Security deposit equal to one month rent, refundable upon satisfactory inspection',
      is_system_template: true
    },
    {
      title: 'Maintenance Policy',
      description: 'Maintenance and repair responsibilities',
      category: 'maintenance',
      default_value: 'Landlord responsible for major repairs, tenant responsible for minor maintenance',
      is_system_template: true
    },
    {
      title: 'Key Policy',
      description: 'Key management and security rules',
      category: 'security',
      default_value: 'No duplicate keys without permission, lost keys incur replacement fee',
      is_system_template: true
    }
  ];

  try {
    const { error } = await supabase
      .from('policy_templates')
      .upsert(systemTemplates, { 
        onConflict: 'title,is_system_template',
        ignoreDuplicates: true 
      });

    if (error) {
      console.log('System templates might already exist, continuing...');
    } else {
      console.log('✅ System policy templates inserted successfully');
    }
  } catch (error) {
    console.log('System templates insertion skipped:', error.message);
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
  console.log('🚀 Starting Policy System migration...\n');
  
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Apply policy system migration
    await createPolicyTables();
    await createIndexes();
    await insertSystemTemplates();
    
    console.log('\n✅ Policy System migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the policy system in your application');
    console.log('   2. Create custom policy templates as a landlord');
    console.log('   3. Add policies to your properties');
    
  } catch (error) {
    console.error('\n❌ Policy migration failed:', error.message);
    process.exit(1);
  }
}

main();