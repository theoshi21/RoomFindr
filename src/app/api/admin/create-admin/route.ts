import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here to ensure user is admin
    const adminData = await request.json()
    const adminClient = getAdminClient() as any

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    })

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    // Create user record
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminData.email,
        role: 'admin',
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      throw new Error(`Failed to create user record: ${userError.message}`)
    }

    // Create profile record
    const { data: profileData, error: profileError } = await adminClient
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        phone: adminData.phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      throw new Error(`Failed to create profile record: ${profileError.message}`)
    }

    return NextResponse.json({ 
      user: userData, 
      profile: profileData 
    })
  } catch (error) {
    console.error('Error creating admin account:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create admin account' },
      { status: 500 }
    )
  }
}