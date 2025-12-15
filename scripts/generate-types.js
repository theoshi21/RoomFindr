#!/usr/bin/env node

/**
 * Script to generate TypeScript types from Supabase
 * Run with: node scripts/generate-types.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function generateTypes() {
  try {
    console.log('Generating Supabase types...');
    
    // Check if supabase CLI is installed
    try {
      execSync('supabase --version', { stdio: 'pipe' });
    } catch (error) {
      console.error('Supabase CLI is not installed. Please install it first:');
      console.error('npm install -g supabase');
      process.exit(1);
    }

    // Generate types
    const command = 'supabase gen types typescript --local > src/types/database-generated.ts';
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Types generated successfully at src/types/database-generated.ts');
    console.log('📝 Please review and update src/types/database.ts if needed');
    
  } catch (error) {
    console.error('❌ Error generating types:', error.message);
    process.exit(1);
  }
}

generateTypes();