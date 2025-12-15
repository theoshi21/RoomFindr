import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Getting Pending Verifications ===')
    
    // Create admin client directly with environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.log('Missing environment variables')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    console.log('Creating Supabase client with service role...')
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get pending verifications with landlord info
    console.log('Fetching pending verifications...')
    const { data: verifications, error } = await adminClient
      .from('landlord_verifications')
      .select(`
        *,
        users!landlord_id (
          email,
          user_profiles (
            first_name,
            last_name,
            phone
          )
        ),
        verification_documents (*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }
    
    console.log(`Found ${verifications?.length || 0} pending verifications`)
    
    return NextResponse.json({ 
      success: true, 
      verifications: verifications || []
    })
  } catch (error) {
    console.error('Error getting pending verifications:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get pending verifications' 
      },
      { status: 500 }
    )
  }
}