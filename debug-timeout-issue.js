#!/usr/bin/env node

/**
 * Debug Timeout Issue Script
 * 
 * This script helps diagnose Supabase connection timeout issues
 * by testing different connection methods and timeouts.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Debugging Supabase Connection Timeouts\n')

console.log('Environment Check:')
console.log('  SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('  ANON_KEY:', anonKey ? '✅ Set' : '❌ Missing')
console.log('  SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Set' : '❌ Missing')
console.log('')

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Test with different timeout configurations
const testConfigs = [
  {
    name: 'Default Client',
    client: createClient(supabaseUrl, anonKey)
  },
  {
    name: 'Client with Custom Timeout',
    client: createClient(supabaseUrl, anonKey, {
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(5000) // 5 second timeout
          })
        }
      }
    })
  }
]

if (serviceRoleKey) {
  testConfigs.push({
    name: 'Service Role Client',
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  })
}

async function testConnection(name, client, timeoutMs = 3000) {
  console.log(`🔄 Testing ${name}...`)
  
  try {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    })
    
    // Test basic connection
    const healthPromise = client.from('users').select('count', { count: 'exact', head: true })
    
    const result = await Promise.race([healthPromise, timeoutPromise])
    
    if (result.error) {
      console.log(`  ❌ ${name}: ${result.error.message}`)
    } else {
      console.log(`  ✅ ${name}: Connected successfully`)
    }
    
  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.log(`  ⏰ ${name}: ${error.message}`)
    } else if (error.message.includes('SSL')) {
      console.log(`  🔒 ${name}: SSL Error - ${error.message}`)
    } else if (error.message.includes('CORS')) {
      console.log(`  🌐 ${name}: CORS Error - ${error.message}`)
    } else if (error.message.includes('Network')) {
      console.log(`  📡 ${name}: Network Error - ${error.message}`)
    } else {
      console.log(`  ❌ ${name}: ${error.message}`)
    }
  }
}

async function testAuthFlow() {
  console.log('\n🔐 Testing Auth Flow...')
  
  const client = createClient(supabaseUrl, anonKey)
  
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth timeout after 3 seconds')), 3000)
    })
    
    const authPromise = client.auth.getUser()
    const result = await Promise.race([authPromise, timeoutPromise])
    
    if (result.error) {
      console.log(`  ❌ Auth Error: ${result.error.message}`)
    } else {
      console.log(`  ✅ Auth: ${result.data.user ? 'User found' : 'No user (expected)'}`)
    }
    
  } catch (error) {
    console.log(`  ⏰ Auth: ${error.message}`)
  }
}

async function testDatabaseQueries() {
  console.log('\n📊 Testing Database Queries...')
  
  const client = createClient(supabaseUrl, anonKey)
  
  const queries = [
    {
      name: 'Simple Count',
      query: () => client.from('users').select('count', { count: 'exact', head: true })
    },
    {
      name: 'Table List',
      query: () => client.from('information_schema.tables').select('table_name').limit(1)
    }
  ]
  
  for (const { name, query } of queries) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${name} timeout after 2 seconds`)), 2000)
      })
      
      const result = await Promise.race([query(), timeoutPromise])
      
      if (result.error) {
        console.log(`  ❌ ${name}: ${result.error.message}`)
      } else {
        console.log(`  ✅ ${name}: Success`)
      }
      
    } catch (error) {
      console.log(`  ⏰ ${name}: ${error.message}`)
    }
  }
}

async function main() {
  // Test different client configurations
  for (const config of testConfigs) {
    await testConnection(config.name, config.client)
  }
  
  // Test auth flow
  await testAuthFlow()
  
  // Test database queries
  await testDatabaseQueries()
  
  console.log('\n💡 Recommendations:')
  console.log('  1. If all tests timeout: Check network connectivity and Supabase URL')
  console.log('  2. If SSL errors: Verify Supabase project URL is correct')
  console.log('  3. If CORS errors: Check domain configuration in Supabase dashboard')
  console.log('  4. If auth works but queries fail: Check RLS policies')
  console.log('  5. Consider using API routes for database operations to avoid client-side timeouts')
}

main().catch(console.error)