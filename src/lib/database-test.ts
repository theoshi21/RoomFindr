// Database connection test for RoomFindr
import { supabase } from './supabase';

export async function testDatabaseConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection failed:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Database connection successful');
    return { success: true, data };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { success: false, error: String(error) };
  }
}

export async function checkDatabaseTables() {
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
  
  const results = [];
  
  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .limit(1);
      
      results.push({
        table,
        accessible: !error,
        error: error?.message
      });
    } catch (error) {
      results.push({
        table,
        accessible: false,
        error: String(error)
      });
    }
  }
  
  return results;
}