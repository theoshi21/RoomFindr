import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, rateLimits } from '@/lib/rateLimit'

async function analyticsHandler(request: NextRequest) {
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
    
    // Get user statistics
    const { data: userStats } = await adminClient
      .from('users')
      .select('role, is_active, created_at')

    const totalUsers = userStats?.length || 0
    const activeUsers = userStats?.filter((u: any) => u.is_active).length || 0
    const usersByRole = {
      admin: userStats?.filter((u: any) => u.role === 'admin').length || 0,
      tenant: userStats?.filter((u: any) => u.role === 'tenant').length || 0,
      landlord: userStats?.filter((u: any) => u.role === 'landlord').length || 0
    }

    // Get basic statistics (simplified for testing)
    const totalLandlords = usersByRole.landlord
    const verifiedLandlords = 0 // Simplified for now
    const pendingVerifications = 0 // Simplified for now
    const totalProperties = 0 // Simplified for now
    const activeProperties = 0 // Simplified for now
    const totalReservations = 0 // Simplified for now
    const completedReservations = 0 // Simplified for now
    const totalRevenue = 0 // Simplified for now

    // Calculate monthly growth (simplified)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentUsers = userStats?.filter((u: any) => new Date(u.created_at) > thirtyDaysAgo).length || 0

    const analytics = {
      totalUsers,
      activeUsers,
      totalLandlords,
      verifiedLandlords,
      pendingVerifications,
      totalProperties,
      activeProperties,
      totalReservations,
      completedReservations,
      totalRevenue,
      monthlyGrowth: {
        users: 0,
        properties: 0,
        reservations: 0,
        revenue: 0
      },
      usersByRole,
      recentActivity: {
        newUsers: recentUsers,
        newProperties: 0,
        newReservations: 0
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching system analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system analytics' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(analyticsHandler, rateLimits.admin);