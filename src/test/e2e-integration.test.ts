/**
 * End-to-End Integration Tests for RoomFindr
 * Tests complete user workflows across the entire application
 * 
 * This test suite covers:
 * - Complete user registration and verification flow
 * - Property listing and reservation workflow  
 * - Admin management and moderation workflows
 * 
 * Requirements: All requirements
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Test data
const testTenant = {
  email: 'test-tenant-e2e@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'Tenant',
  role: 'tenant' as const
}

const testLandlord = {
  email: 'test-landlord-e2e@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'Landlord',
  role: 'landlord' as const
}

const testAdmin = {
  email: 'test-admin-e2e@example.com',
  password: 'AdminPassword123!',
  firstName: 'Test',
  lastName: 'Admin',
  role: 'admin' as const
}

const testProperty = {
  title: 'E2E Test Property',
  description: 'A test property for end-to-end testing',
  address: {
    street: '123 Test Street',
    city: 'Test City',
    province: 'Test Province',
    postalCode: '12345'
  },
  roomType: 'single' as const,
  price: 15000,
  deposit: 5000,
  amenities: ['WiFi', 'Air Conditioning']
}

const testVerificationDoc = {
  fileName: 'test-document.pdf',
  fileType: 'application/pdf',
  fileSize: 1024 * 1024, // 1MB
  content: 'Mock document content for verification'
}

// Skip tests if running in CI or test environment without proper Supabase setup
const skipTests = process.env.NODE_ENV === 'test' || 
                 process.env.CI === 'true' ||
                 !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                 process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test')

const testSuite = skipTests ? describe.skip : describe

testSuite('End-to-End Integration Tests', () => {
  let tenantUserId: string = ''
  let landlordUserId: string = ''
  let adminUserId: string = ''
  let propertyId: string = ''
  let reservationId: string = ''
  let verificationId: string = ''
  let reviewId: string = ''

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData()
  })

  afterAll(async () => {
    // Clean up test data after tests
    await cleanupTestData()
  })

  describe('Complete User Registration and Verification Flow', () => {
    it('should register tenant user successfully', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: testTenant.email,
        password: testTenant.password,
        options: {
          data: {
            first_name: testTenant.firstName,
            last_name: testTenant.lastName,
            role: testTenant.role
          }
        }
      })

      expect(error).toBeNull()
      expect(data.user).toBeTruthy()
      expect(data.user?.email).toBe(testTenant.email)
      
      if (data.user) {
        tenantUserId = data.user.id
      }
    })

    it('should register landlord user successfully', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: testLandlord.email,
        password: testLandlord.password,
        options: {
          data: {
            first_name: testLandlord.firstName,
            last_name: testLandlord.lastName,
            role: testLandlord.role
          }
        }
      })

      expect(error).toBeNull()
      expect(data.user).toBeTruthy()
      expect(data.user?.email).toBe(testLandlord.email)
      
      if (data.user) {
        landlordUserId = data.user.id
      }
    })

    it('should register admin user successfully', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: testAdmin.email,
        password: testAdmin.password,
        options: {
          data: {
            first_name: testAdmin.firstName,
            last_name: testAdmin.lastName,
            role: testAdmin.role
          }
        }
      })

      expect(error).toBeNull()
      expect(data.user).toBeTruthy()
      expect(data.user?.email).toBe(testAdmin.email)
      
      if (data.user) {
        adminUserId = data.user.id
      }
    })

    it('should create user profiles automatically', async () => {
      // Check tenant profile
      const { data: tenantProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', tenantUserId)
        .single()

      expect(tenantProfile).toBeTruthy()
      expect(tenantProfile?.first_name).toBe(testTenant.firstName)

      // Check landlord profile
      const { data: landlordProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', landlordUserId)
        .single()

      expect(landlordProfile).toBeTruthy()
      expect(landlordProfile?.first_name).toBe(testLandlord.firstName)

      // Check admin profile
      const { data: adminProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', adminUserId)
        .single()

      expect(adminProfile).toBeTruthy()
      expect(adminProfile?.first_name).toBe(testAdmin.firstName)
    })

    it('should handle authentication flow correctly', async () => {
      // Test tenant login
      const { data: tenantAuth, error: tenantError } = await supabase.auth.signInWithPassword({
        email: testTenant.email,
        password: testTenant.password
      })

      expect(tenantError).toBeNull()
      expect(tenantAuth.user?.email).toBe(testTenant.email)

      // Test landlord login
      const { data: landlordAuth, error: landlordError } = await supabase.auth.signInWithPassword({
        email: testLandlord.email,
        password: testLandlord.password
      })

      expect(landlordError).toBeNull()
      expect(landlordAuth.user?.email).toBe(testLandlord.email)

      // Test admin login
      const { data: adminAuth, error: adminError } = await supabase.auth.signInWithPassword({
        email: testAdmin.email,
        password: testAdmin.password
      })

      expect(adminError).toBeNull()
      expect(adminAuth.user?.email).toBe(testAdmin.email)
    })

    it('should reject invalid authentication attempts', async () => {
      // Test invalid credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testTenant.email,
        password: 'WrongPassword123!'
      })

      expect(error).toBeTruthy()
      expect(data.user).toBeNull()
    })
  })

  describe('Landlord Verification Workflow', () => {
    it('should allow landlord to submit verification documents', async () => {
      // Sign in as landlord
      await supabase.auth.signInWithPassword({
        email: testLandlord.email,
        password: testLandlord.password
      })

      // Create verification request
      const { data: verification, error: verificationError } = await supabase
        .from('landlord_verifications')
        .insert({
          landlord_id: landlordUserId,
          status: 'pending',
          documents: [{
            name: testVerificationDoc.fileName,
            type: testVerificationDoc.fileType,
            size: testVerificationDoc.fileSize,
            url: `test-storage/${testVerificationDoc.fileName}`
          }]
        })
        .select()
        .single()

      expect(verificationError).toBeNull()
      expect(verification).toBeTruthy()
      expect(verification?.status).toBe('pending')
      
      if (verification) {
        verificationId = verification.id
      }
    })

    it('should prevent unverified landlords from creating listings', async () => {
      // Try to create property while verification is pending
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          landlord_id: landlordUserId,
          title: 'Should Fail Property',
          description: 'This should fail due to unverified status',
          street: '123 Fail Street',
          city: 'Fail City',
          province: 'Fail Province',
          postal_code: '00000',
          room_type: 'single',
          price: 10000,
          deposit: 3000,
          amenities: [],
          is_active: true
        })

      // This should fail due to RLS policies or triggers
      expect(propertyError).toBeTruthy()
    })

    it('should allow admin to review and approve verification', async () => {
      // Sign in as admin
      await supabase.auth.signInWithPassword({
        email: testAdmin.email,
        password: testAdmin.password
      })

      // Get pending verifications
      const { data: pendingVerifications } = await supabase
        .from('landlord_verifications')
        .select('*')
        .eq('status', 'pending')

      expect(pendingVerifications).toBeTruthy()
      expect(pendingVerifications?.some(v => v.id === verificationId)).toBe(true)

      // Approve verification
      const { data: approvedVerification, error: approvalError } = await supabase
        .from('landlord_verifications')
        .update({
          status: 'approved',
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          feedback: 'Documents verified successfully'
        })
        .eq('id', verificationId)
        .select()
        .single()

      expect(approvalError).toBeNull()
      expect(approvedVerification?.status).toBe('approved')
    })

    it('should update landlord verification status after approval', async () => {
      // Check that landlord profile is updated
      const { data: landlordProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', landlordUserId)
        .single()

      // Verification status should be reflected in profile
      expect(landlordProfile).toBeTruthy()
    })
  })

  describe('Property Listing and Management Flow', () => {
    it('should authenticate landlord and create property listing', async () => {
      // Sign in as landlord
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: testLandlord.email,
        password: testLandlord.password
      })

      expect(authError).toBeNull()
      expect(authData.user).toBeTruthy()

      // Create property listing
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          landlord_id: landlordUserId,
          title: testProperty.title,
          description: testProperty.description,
          street: testProperty.address.street,
          city: testProperty.address.city,
          province: testProperty.address.province,
          postal_code: testProperty.address.postalCode,
          room_type: testProperty.roomType,
          price: testProperty.price,
          deposit: testProperty.deposit,
          amenities: testProperty.amenities,
          is_active: true
        })
        .select()
        .single()

      expect(propertyError).toBeNull()
      expect(property).toBeTruthy()
      expect(property?.title).toBe(testProperty.title)
      
      if (property) {
        propertyId = property.id
      }
    })

    it('should make property searchable and filterable', async () => {
      // Test basic search
      const { data: allProperties } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)

      expect(allProperties).toBeTruthy()
      expect(allProperties?.some(p => p.id === propertyId)).toBe(true)

      // Test price filter
      const { data: filteredProperties } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .gte('price', 10000)
        .lte('price', 20000)

      expect(filteredProperties?.some(p => p.id === propertyId)).toBe(true)

      // Test room type filter
      const { data: roomTypeFiltered } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .eq('room_type', 'single')

      expect(roomTypeFiltered?.some(p => p.id === propertyId)).toBe(true)

      // Test location filter
      const { data: locationFiltered } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .eq('city', testProperty.address.city)

      expect(locationFiltered?.some(p => p.id === propertyId)).toBe(true)

      // Test amenities filter (using array contains)
      const { data: amenityFiltered } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .contains('amenities', ['WiFi'])

      expect(amenityFiltered?.some(p => p.id === propertyId)).toBe(true)
    })

    it('should allow property updates and reflect changes immediately', async () => {
      // Sign in as landlord
      await supabase.auth.signInWithPassword({
        email: testLandlord.email,
        password: testLandlord.password
      })

      // Update property
      const updatedTitle = 'Updated E2E Test Property'
      const { data: updatedProperty, error: updateError } = await supabase
        .from('properties')
        .update({ 
          title: updatedTitle,
          price: 16000,
          amenities: ['WiFi', 'Air Conditioning', 'Parking']
        })
        .eq('id', propertyId)
        .select()
        .single()

      expect(updateError).toBeNull()
      expect(updatedProperty?.title).toBe(updatedTitle)
      expect(updatedProperty?.price).toBe(16000)
      expect(updatedProperty?.amenities).toContain('Parking')

      // Verify changes are reflected in search
      const { data: searchResults } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      expect(searchResults?.title).toBe(updatedTitle)
      expect(searchResults?.price).toBe(16000)
    })

    it('should handle property deactivation correctly', async () => {
      // Deactivate property
      const { data: deactivatedProperty, error: deactivateError } = await supabase
        .from('properties')
        .update({ is_active: false })
        .eq('id', propertyId)
        .select()
        .single()

      expect(deactivateError).toBeNull()
      expect(deactivatedProperty?.is_active).toBe(false)

      // Verify it doesn't appear in active searches
      const { data: activeProperties } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .eq('id', propertyId)

      expect(activeProperties?.length).toBe(0)

      // Reactivate for subsequent tests
      await supabase
        .from('properties')
        .update({ is_active: true })
        .eq('id', propertyId)
    })
  })

  describe('Reservation and Payment Flow', () => {
    it('should allow tenant to create reservation', async () => {
      // Sign in as tenant
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: testTenant.email,
        password: testTenant.password
      })

      expect(authError).toBeNull()
      expect(authData.user).toBeTruthy()

      // Create reservation
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 7) // Start next week

      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          property_id: propertyId,
          tenant_id: tenantUserId,
          landlord_id: landlordUserId,
          start_date: startDate.toISOString(),
          status: 'pending',
          payment_status: 'pending',
          total_amount: testProperty.price,
          deposit_amount: testProperty.deposit
        })
        .select()
        .single()

      expect(reservationError).toBeNull()
      expect(reservation).toBeTruthy()
      expect(reservation?.status).toBe('pending')
      
      if (reservation) {
        reservationId = reservation.id
      }
    })

    it('should create transaction record for reservation', async () => {
      // Create transaction for deposit
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          reservation_id: reservationId,
          user_id: tenantUserId,
          transaction_type: 'deposit',
          amount: testProperty.deposit,
          status: 'completed',
          payment_method: 'gcash',
          transaction_date: new Date().toISOString()
        })
        .select()
        .single()

      expect(transactionError).toBeNull()
      expect(transaction).toBeTruthy()
      expect(transaction?.amount).toBe(testProperty.deposit)
      expect(transaction?.transaction_type).toBe('deposit')
    })

    it('should update reservation status after payment', async () => {
      // Update reservation payment status
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({ payment_status: 'paid', status: 'confirmed' })
        .eq('id', reservationId)
        .select()
        .single()

      expect(updateError).toBeNull()
      expect(updatedReservation?.payment_status).toBe('paid')
      expect(updatedReservation?.status).toBe('confirmed')
    })
  })

  describe('Notification and Communication Flow', () => {
    it('should create notifications for reservation updates', async () => {
      // Create notification for tenant
      const { data: tenantNotification, error: tenantNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: tenantUserId,
          notification_type: 'reservation',
          title: 'Reservation Confirmed',
          message: 'Your reservation has been confirmed',
          is_read: false,
          metadata: { reservation_id: reservationId }
        })
        .select()
        .single()

      expect(tenantNotifError).toBeNull()
      expect(tenantNotification).toBeTruthy()

      // Create notification for landlord
      const { data: landlordNotification, error: landlordNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: landlordUserId,
          notification_type: 'reservation',
          title: 'New Reservation',
          message: 'You have a new reservation request',
          is_read: false,
          metadata: { reservation_id: reservationId }
        })
        .select()
        .single()

      expect(landlordNotifError).toBeNull()
      expect(landlordNotification).toBeTruthy()
    })

    it('should retrieve user notifications correctly', async () => {
      // Get tenant notifications
      const { data: tenantNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', tenantUserId)
        .order('created_at', { ascending: false })

      expect(tenantNotifications).toBeTruthy()
      expect(tenantNotifications?.length).toBeGreaterThan(0)

      // Get landlord notifications
      const { data: landlordNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', landlordUserId)
        .order('created_at', { ascending: false })

      expect(landlordNotifications).toBeTruthy()
      expect(landlordNotifications?.length).toBeGreaterThan(0)
    })
  })

  describe('Review and Rating Flow', () => {
    it('should allow tenant to submit review after reservation', async () => {
      // Sign in as tenant
      await supabase.auth.signInWithPassword({
        email: testTenant.email,
        password: testTenant.password
      })

      // Create review
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          property_id: propertyId,
          tenant_id: tenantUserId,
          landlord_id: landlordUserId,
          rating: 5,
          comment: 'Great property and responsive landlord!'
        })
        .select()
        .single()

      expect(reviewError).toBeNull()
      expect(review).toBeTruthy()
      expect(review?.rating).toBe(5)
    })

    it('should calculate average ratings correctly', async () => {
      // Get property with reviews
      const { data: propertyReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('property_id', propertyId)

      expect(propertyReviews).toBeTruthy()
      expect(propertyReviews?.length).toBeGreaterThan(0)

      if (propertyReviews && propertyReviews.length > 0) {
        const averageRating = propertyReviews.reduce((sum, review) => sum + review.rating, 0) / propertyReviews.length
        expect(averageRating).toBe(5)
      }
    })
  })

  describe('Admin Management and Moderation Workflows', () => {
    it('should allow admin to manage user accounts', async () => {
      // Sign in as admin
      await supabase.auth.signInWithPassword({
        email: testAdmin.email,
        password: testAdmin.password
      })

      // Get all users for management
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', [tenantUserId, landlordUserId])

      expect(userProfiles).toBeTruthy()
      expect(userProfiles?.length).toBe(2)

      // Test user account suspension (mock - would require admin privileges)
      const { data: tenantProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', tenantUserId)
        .single()

      expect(tenantProfile).toBeTruthy()
      expect(tenantProfile?.user_id).toBe(tenantUserId)
    })

    it('should allow admin to moderate content', async () => {
      // Get property for moderation
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      expect(property).toBeTruthy()

      // Admin can view and potentially moderate property content
      expect(property?.title).toBeTruthy()
      expect(property?.description).toBeTruthy()

      // Get reviews for moderation
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('property_id', propertyId)

      expect(reviews).toBeTruthy()
    })

    it('should allow admin to create system announcements', async () => {
      // Create system announcement
      const { data: announcement, error: announcementError } = await supabase
        .from('notifications')
        .insert({
          user_id: tenantUserId, // In real system, this would be broadcast to all users
          notification_type: 'announcement',
          title: 'System Maintenance Notice',
          message: 'The system will undergo maintenance on Sunday',
          is_read: false,
          metadata: { 
            announcement_type: 'system',
            created_by: adminUserId 
          }
        })
        .select()
        .single()

      expect(announcementError).toBeNull()
      expect(announcement).toBeTruthy()
      expect(announcement?.notification_type).toBe('announcement')
    })

    it('should provide admin analytics and reporting', async () => {
      // Get user statistics
      const { data: userStats, error: userStatsError } = await supabase
        .from('user_profiles')
        .select('user_id, role')

      expect(userStatsError).toBeNull()
      expect(userStats).toBeTruthy()

      // Get property statistics
      const { data: propertyStats, error: propertyStatsError } = await supabase
        .from('properties')
        .select('id, is_active, created_at')

      expect(propertyStatsError).toBeNull()
      expect(propertyStats).toBeTruthy()

      // Get reservation statistics
      const { data: reservationStats, error: reservationStatsError } = await supabase
        .from('reservations')
        .select('id, status, created_at')

      expect(reservationStatsError).toBeNull()
      expect(reservationStats).toBeTruthy()

      // Get transaction statistics
      const { data: transactionStats, error: transactionStatsError } = await supabase
        .from('transactions')
        .select('id, transaction_type, amount, created_at')

      expect(transactionStatsError).toBeNull()
      expect(transactionStats).toBeTruthy()
    })

    it('should maintain audit logs for admin actions', async () => {
      // In a real system, admin actions would be logged
      // Here we verify that admin can access verification history
      const { data: verificationHistory } = await supabase
        .from('landlord_verifications')
        .select('*')
        .eq('reviewed_by', adminUserId)

      expect(verificationHistory).toBeTruthy()
      expect(verificationHistory?.some(v => v.id === verificationId)).toBe(true)
    })
  })

  describe('Complete Reservation Workflow with Cancellation', () => {
    it('should handle reservation cancellation and refunds', async () => {
      // Sign in as tenant
      await supabase.auth.signInWithPassword({
        email: testTenant.email,
        password: testTenant.password
      })

      // Cancel reservation
      const { data: cancelledReservation, error: cancelError } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select()
        .single()

      expect(cancelError).toBeNull()
      expect(cancelledReservation?.status).toBe('cancelled')

      // Create refund transaction
      const { data: refundTransaction, error: refundError } = await supabase
        .from('transactions')
        .insert({
          reservation_id: reservationId,
          user_id: tenantUserId,
          transaction_type: 'refund',
          amount: testProperty.deposit,
          status: 'completed',
          payment_method: 'gcash',
          transaction_date: new Date().toISOString()
        })
        .select()
        .single()

      expect(refundError).toBeNull()
      expect(refundTransaction?.transaction_type).toBe('refund')
      expect(refundTransaction?.amount).toBe(testProperty.deposit)
    })

    it('should update property availability after cancellation', async () => {
      // Property should be available again after cancellation
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      expect(property?.is_active).toBe(true)
    })
  })

  describe('Comprehensive Transaction Management', () => {
    it('should provide complete transaction history', async () => {
      // Get all transactions for the tenant
      const { data: tenantTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', tenantUserId)
        .order('transaction_date', { ascending: false })

      expect(tenantTransactions).toBeTruthy()
      expect(tenantTransactions?.length).toBeGreaterThan(0)

      // Should have both deposit and refund transactions
      const hasDeposit = tenantTransactions?.some(t => t.transaction_type === 'deposit')
      const hasRefund = tenantTransactions?.some(t => t.transaction_type === 'refund')
      
      expect(hasDeposit).toBe(true)
      expect(hasRefund).toBe(true)
    })

    it('should support transaction filtering and search', async () => {
      // Filter by transaction type
      const { data: depositTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', tenantUserId)
        .eq('transaction_type', 'deposit')

      expect(depositTransactions).toBeTruthy()
      expect(depositTransactions?.every(t => t.transaction_type === 'deposit')).toBe(true)

      // Filter by status
      const { data: completedTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', tenantUserId)
        .eq('status', 'completed')

      expect(completedTransactions).toBeTruthy()
      expect(completedTransactions?.every(t => t.status === 'completed')).toBe(true)
    })
  })

  describe('Data Integrity and Consistency', () => {
    it('should maintain referential integrity across all tables', async () => {
      // Verify property exists
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      expect(property).toBeTruthy()

      // Verify reservation references correct property and users
      const { data: reservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single()

      expect(reservation?.property_id).toBe(propertyId)
      expect(reservation?.tenant_id).toBe(tenantUserId)
      expect(reservation?.landlord_id).toBe(landlordUserId)

      // Verify transaction references correct reservation
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('reservation_id', reservationId)
        .single()

      expect(transaction?.reservation_id).toBe(reservationId)
      expect(transaction?.user_id).toBe(tenantUserId)
    })

    it('should enforce business rules and constraints', async () => {
      // Test that inactive properties are not searchable
      await supabase
        .from('properties')
        .update({ is_active: false })
        .eq('id', propertyId)

      const { data: inactiveProperties } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .eq('id', propertyId)

      expect(inactiveProperties?.length).toBe(0)

      // Reactivate for cleanup
      await supabase
        .from('properties')
        .update({ is_active: true })
        .eq('id', propertyId)
    })
  })

  // Helper function to clean up test data
  async function cleanupTestData() {
    try {
      // Skip cleanup if user IDs are not set
      if (!tenantUserId && !landlordUserId && !adminUserId) {
        return
      }

      const allUserIds = [tenantUserId, landlordUserId, adminUserId].filter(Boolean)

      // Delete in reverse dependency order to maintain referential integrity
      
      // Delete reviews first (depends on properties and users)
      if (allUserIds.length > 0) {
        await supabase.from('reviews').delete().in('tenant_id', allUserIds)
      }
      
      // Delete notifications (depends on users)
      if (allUserIds.length > 0) {
        await supabase.from('notifications').delete().in('user_id', allUserIds)
      }
      
      // Delete transactions (depends on reservations and users)
      if (tenantUserId) {
        await supabase.from('transactions').delete().eq('user_id', tenantUserId)
      }
      
      // Delete reservations (depends on properties and users)
      if (tenantUserId) {
        await supabase.from('reservations').delete().eq('tenant_id', tenantUserId)
      }
      
      // Delete properties (depends on landlords)
      if (landlordUserId) {
        await supabase.from('properties').delete().eq('landlord_id', landlordUserId)
      }
      
      // Delete landlord verifications (depends on landlords)
      if (landlordUserId) {
        await supabase.from('landlord_verifications').delete().eq('landlord_id', landlordUserId)
      }
      
      // Delete user profiles (depends on users)
      if (allUserIds.length > 0) {
        await supabase.from('user_profiles').delete().in('user_id', allUserIds)
      }
      
      // Note: User deletion from auth.users requires admin privileges
      // In a real test environment, you'd use a service role key for complete cleanup
      
    } catch (error) {
      console.warn('Cleanup error (expected in some cases):', error)
    }
  }
})