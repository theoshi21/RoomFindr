#!/usr/bin/env node

// Simple Supabase connection test
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

console.log('Environment Variables:');
console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('- URL Domain:', supabaseUrl ? new URL(supabaseUrl).hostname : 'N/A');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  try {
    console.log('🔄 Testing basic connection...');
    
    // Test 1: Basic health check
    const startTime = Date.now();
    const { data, error } = await Promise.race([
      supabase.from('users').select('count').limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      )
    ]);
    const duration = Date.now() - startTime;
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('   Error details:', error);
      
      // Check if it's an SSL/network error
      if (error.message.includes('SSL') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log('\n🔧 Possible Solutions:');
        console.log('1. Check your internet connection');
        console.log('2. Try disabling VPN if you\'re using one');
        console.log('3. Check if your firewall is blocking the connection');
        console.log('4. Verify the Supabase URL is correct');
        console.log('5. Check if Supabase service is down: https://status.supabase.com/');
      }
    } else {
      console.log(`✅ Connection successful! (${duration}ms)`);
      console.log('   Response:', data);
    }
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\n🔧 Connection timeout detected. Possible causes:');
      console.log('1. Network connectivity issues');
      console.log('2. Firewall blocking HTTPS connections');
      console.log('3. DNS resolution problems');
      console.log('4. Supabase service outage');
    }
  }
}

// Test auth endpoint specifically
async function testAuth() {
  try {
    console.log('\n🔄 Testing auth endpoint...');
    
    const startTime = Date.now();
    const { data, error } = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout after 5 seconds')), 5000)
      )
    ]);
    const duration = Date.now() - startTime;
    
    if (error) {
      console.log('❌ Auth test failed:', error.message);
    } else {
      console.log(`✅ Auth endpoint accessible! (${duration}ms)`);
      console.log('   Session:', data.session ? 'Active session found' : 'No active session');
    }
    
  } catch (error) {
    console.log('❌ Auth test failed:', error.message);
  }
}

// Run tests
testConnection().then(() => testAuth()).then(() => {
  console.log('\n🏁 Connection test complete');
});