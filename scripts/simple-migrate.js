#!/usr/bin/env node

/**
 * Simple Database Migration for RoomFindr
 * 
 * This script provides the SQL commands to run in your Supabase SQL Editor.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 RoomFindr Database Migration Guide\n');

console.log('Please follow these steps to set up your database:\n');

console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste each migration below, one at a time');
console.log('4. Click "Run" after pasting each migration\n');

console.log('=' .repeat(80));

const migrations = [
  '001_initial_schema.sql',
  '002_rls_policies.sql', 
  '003_functions_and_triggers.sql'
];

migrations.forEach((filename, index) => {
  console.log(`\n📄 MIGRATION ${index + 1}: ${filename}`);
  console.log('=' .repeat(80));
  
  try {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(sql);
    console.log('\n' + '=' .repeat(80));
    console.log(`✅ Copy the above SQL and run it in Supabase SQL Editor`);
    console.log('=' .repeat(80));
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
  }
});

console.log('\n🎉 After running all migrations, test your connection with:');
console.log('   npm run db:test\n');