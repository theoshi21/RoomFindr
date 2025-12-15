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

async function runMigration(migrationFile) {
  console.log(`Running migration: ${migrationFile}`);
  
  try {
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`Error executing statement: ${error.message}`);
          // Continue with next statement
        }
      }
    }
    
    console.log(`✅ Migration ${migrationFile} completed`);
  } catch (error) {
    console.error(`❌ Error running migration ${migrationFile}:`, error.message);
  }
}

async function main() {
  console.log('Running migrations 004 and 005...');
  
  await runMigration('004_verification_storage.sql');
  await runMigration('005_roommate_profiles.sql');
  
  console.log('All migrations completed!');
}

main().catch(console.error);