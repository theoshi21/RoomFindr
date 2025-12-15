import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Verification Review API Called ===')
    
    const data = await request.json()
    console.log('Request data:', data)
    
    // Validate required fields
    if (!data.verificationId || !data.status) {
      console.log('Missing required fields')
      return NextResponse.json(
        { success: false, error: 'Missing required fields: verificationId and status' },
        { status: 400 }
      )
    }
    
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
      db: {
        schema: 'public'
      }
    })

    // Update verification status
    console.log('Updating verification with ID:', data.verificationId)
    
    const updateData = {
      status: data.status,
      reviewed_by: data.reviewedBy || 'd5fd8882-c6b2-4618-a20b-e50bab31ec09', // Default to admin user
      reviewed_at: new Date().toISOString(),
      feedback: data.feedback || null,
      updated_at: new Date().toISOString()
    }
    
    console.log('Update data:', updateData)
    
    const { data: updateResult, error: updateError } = await adminClient
      .from('landlord_verifications')
      .update(updateData)
      .eq('id', data.verificationId)
      .select()

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { success: false, error: `Database error: ${updateError.message}` },
        { status: 500 }
      )
    }
    
    console.log('Update successful:', updateResult)

    // For now, skip the notification system to avoid additional complexity
    // Just return success since the main update worked
    console.log('Verification review completed successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: `Verification ${data.status} successfully`,
      verificationId: data.verificationId 
    })
  } catch (error) {
    console.error('Error reviewing verification:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to review verification' 
      },
      { status: 500 }
    )
  }
}