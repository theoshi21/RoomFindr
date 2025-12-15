import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here to ensure user is admin
    const { userId, reason } = await request.json()
    const adminClient = getAdminClient() as any

    const { data, error } = await adminClient
      .from('users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to suspend user: ${error.message}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error suspending user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to suspend user' },
      { status: 500 }
    )
  }
}