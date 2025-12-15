#!/usr/bin/env node

/**
 * Test SQL Execution Script
 * 
 * This script demonstrates how to execute SQL commands programmatically
 * using the custom execute_sql function with service role key.
 * 
 * Prerequisites:
 * 1. Create execute_sql function in Supabase (see CRITICAL_DEVELOPMENT_GUIDE.md)
 * 2. Set SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌')
  process.exit(1)
}

// Create admin client with service role key
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Execute SQL using custom function
 */
async function executeSQL(sql) {
  console.log(`🔄 Executing SQL: ${sql}`)
  
  const { data, error } = await adminClient.rpc('execute_sql', {
    query: sql
  })
  
  if (error) {
    console.error('❌ SQL Error:', error.message)
    return { success: false, error }
  }
  
  console.log('✅ SQL Success:', data)
  return { success: true, data }
}

/**
 * Test various SQL operations
 */
async function testSQLExecution() {
  console.log('🚀 Testing SQL Execution with Service Role Key\n')
  
  try {
    // Test 1: Simple SELECT query
    console.log('📋 Test 1: Simple SELECT query')
    await executeSQL('SELECT COUNT(*) as user_count FROM auth.users')
    console.log('')
    
    // Test 2: Check if execute_sql function exists
    console.log('📋 Test 2: Check if execute_sql function exists')
    const { data: functions, error: funcError } = await adminClient.rpc('execute_sql', {
      query: `SELECT proname FROM pg_proc WHERE proname = 'execute_sql'`
    })
    
    if (funcError) {
      console.error('❌ execute_sql function not found!')
      console.log('💡 Create it using the SQL in CRITICAL_DEVELOPMENT_GUIDE.md')
      return
    }
    console.log('✅ execute_sql function exists')
    console.log('')
    
    // Test 3: Create a test table (will be cleaned up)
    console.log('📋 Test 3: Create and drop test table')
    await executeSQL('CREATE TABLE IF NOT EXISTS test_sql_execution (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())')
    await executeSQL('INSERT INTO test_sql_execution DEFAULT VALUES')
    await executeSQL('SELECT COUNT(*) FROM test_sql_execution')
    await executeSQL('DROP TABLE test_sql_execution')
    console.log('')
    
    // Test 4: Check RLS policies
    console.log('📋 Test 4: Check RLS policies')
    await executeSQL(`
      SELECT schemaname, tablename, policyname, permissive 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      LIMIT 5
    `)
    console.log('')
    
    console.log('🎉 All SQL execution tests completed successfully!')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
  }
}

/**
 * Alternative method using direct PostgreSQL connection
 */
async function testDirectConnection() {
  console.log('\n🔄 Testing Direct PostgreSQL Connection...')
  
  try {
    // This requires the database connection string from Supabase settings
    const connectionString = process.env.DATABASE_URL
    
    if (!connectionString) {
      console.log('⚠️  DATABASE_URL not set, skipping direct connection test')
      console.log('💡 Get it from: Supabase Dashboard → Settings → Database → Connection string')
      return
    }
    
    // Note: This would require installing 'pg' package
    console.log('💡 Direct connection would require: npm install pg')
    console.log('💡 Then use: const { Client } = require("pg")')
    
  } catch (error) {
    console.error('❌ Direct connection error:', error.message)
  }
}

// Run tests
async function main() {
  await testSQLExecution()
  await testDirectConnection()
}

main().catch(console.error)