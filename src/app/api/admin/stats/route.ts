import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check here to ensure user is admin
    
    // Create admin client only when needed to avoid build-time environment variable issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get pending verifications count
    const { data: pendingVerifications } = await adminClient
      .from('landlord_verifications')
      .select('id')
      .eq('status', 'pending')

    // Get active users count
    const { data: activeUsers } = await adminClient
      .from('users')
      .select('id')
      .eq('is_active', true)

    // Get total properties count
    const { data: totalProperties } = await adminClient
      .from('properties')
      .select('id')

    // Get recent transactions
    const { data: recentTransactions } = await adminClient
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    // Generate system alerts (simplified)
    const systemAlerts = []
    
    if ((pendingVerifications?.length || 0) > 10) {
      systemAlerts.push({
        type: 'warning' as const,
        message: 'High number of pending verifications',
        count: pendingVerifications?.length || 0
      })
    }

    const stats = {
      pendingVerifications: pendingVerifications?.length || 0,
      activeUsers: activeUsers?.length || 0,
      totalProperties: totalProperties?.length || 0,
      recentTransactions: recentTransactions || [],
      systemAlerts
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}