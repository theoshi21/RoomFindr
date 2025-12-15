import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check here to ensure user is admin
    const { searchParams } = new URL(request.url)
    
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const offset = (page - 1) * limit
    const adminClient = getAdminClient() as any

    let query = adminClient
      .from('users')
      .select('*', { count: 'exact' })

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    } else if (status === 'pending_verification') {
      query = query.eq('role', 'landlord').eq('is_verified', false)
    }

    if (search) {
      query = query.ilike('email', `%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    // For now, return users without profiles and verifications to avoid complex joins
    const users = (data || []).map((user: any) => ({
      ...user,
      profile: undefined,
      verification: undefined
    }))

    const result = {
      users,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // TODO: Add authentication check here to ensure user is admin
    const { userId, updates } = await request.json()
    const adminClient = getAdminClient() as any

    // Build update payload with only defined fields
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }
    
    if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active
    if (updates.role !== undefined) updatePayload.role = updates.role
    if (updates.is_verified !== undefined) updatePayload.is_verified = updates.is_verified

    const { data, error } = await adminClient
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user account: ${error.message}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}