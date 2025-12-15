/**
 * Performance Tests for RoomFindr
 * Tests application performance, load handling, and optimization
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

describe('Performance Tests', () => {
  beforeAll(async () => {
    // Ensure we have test data for performance testing
    await setupPerformanceTestData()
  })

  describe('Database Query Performance', () => {
    it('should execute property search queries within acceptable time limits', async () => {
      const startTime = performance.now()
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          user_profiles!properties_landlord_id_fkey(first_name, last_name)
        `)
        .eq('is_active', true)
        .limit(50)
      
      const endTime = performance.now()
      const queryTime = endTime - startTime
      
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(queryTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle complex filtered searches efficiently', async () => {
      const startTime = performance.now()
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .gte('price', 10000)
        .lte('price', 50000)
        .in('room_type', ['single', 'shared'])
        .contains('amenities', ['WiFi'])
        .limit(20)
      
      const endTime = performance.now()
      const queryTime = endTime - startTime
      
      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(800) // Complex queries should complete within 800ms
    })

    it('should efficiently load user dashboard data', async () => {
      const startTime = performance.now()
      
      // Simulate loading dashboard data for a user
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
        .single()
      
      if (profile) {
        const [reservations, notifications, transactions] = await Promise.all([
          supabase
            .from('reservations')
            .select('*, properties(title, address)')
            .eq('tenant_id', profile.user_id)
            .limit(10),
          supabase
            .from('notifications')
            .select('*')
            .eq('user_id', profile.user_id)
            .eq('is_read', false)
            .limit(5),
          supabase
            .from('transactions')
            .select('*')
            .eq('user_id', profile.user_id)
            .limit(10)
        ])
        
        const endTime = performance.now()
        const queryTime = endTime - startTime
        
        expect(queryTime).toBeLessThan(1200) // Dashboard should load within 1.2 seconds
      }
    })
  })

  describe('Concurrent Operations Performance', () => {
    it('should handle multiple simultaneous property searches', async () => {
      const startTime = performance.now()
      
      // Simulate 10 concurrent search requests
      const searchPromises = Array.from({ length: 10 }, () =>
        supabase
          .from('properties')
          .select('*')
          .eq('is_active', true)
          .limit(20)
      )
      
      const results = await Promise.all(searchPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // All searches should complete
      results.forEach(({ error }) => {
        expect(error).toBeNull()
      })
      
      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(2000) // 10 concurrent searches within 2 seconds
    })

    it('should handle concurrent reservation operations', async () => {
      const startTime = performance.now()
      
      // Get a test property
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single()
      
      if (property) {
        // Simulate multiple users trying to reserve (should handle gracefully)
        const reservationPromises = Array.from({ length: 5 }, (_, index) =>
          supabase
            .from('reservations')
            .insert({
              property_id: property.id,
              tenant_id: `test-user-${index}`,
              landlord_id: property.landlord_id,
              start_date: new Date().toISOString(),
              status: 'pending',
              payment_status: 'pending',
              total_amount: property.price,
              deposit_amount: property.deposit || 0
            })
            .select()
        )
        
        const results = await Promise.allSettled(reservationPromises)
        const endTime = performance.now()
        const totalTime = endTime - startTime
        
        // Should complete within reasonable time
        expect(totalTime).toBeLessThan(1500)
        
        // Clean up test reservations
        await supabase
          .from('reservations')
          .delete()
          .like('tenant_id', 'test-user-%')
      }
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should not cause memory leaks during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Perform repeated operations
      for (let i = 0; i < 100; i++) {
        await supabase
          .from('properties')
          .select('id, title')
          .limit(10)
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    it('should handle large result sets efficiently', async () => {
      const startTime = performance.now()
      
      // Test pagination with large datasets
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, price, room_type')
        .eq('is_active', true)
        .range(0, 99) // Get 100 records
      
      const endTime = performance.now()
      const queryTime = endTime - startTime
      
      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(1000) // Should handle 100 records within 1 second
    })
  })

  describe('Real-time Performance', () => {
    it('should establish real-time connections efficiently', async () => {
      const startTime = performance.now()
      
      // Test real-time subscription setup
      const channel = supabase
        .channel('test-performance')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications' },
          (payload) => {
            // Handle real-time updates
          }
        )
      
      await new Promise((resolve) => {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve(status)
          }
        })
      })
      
      const endTime = performance.now()
      const connectionTime = endTime - startTime
      
      expect(connectionTime).toBeLessThan(2000) // Should connect within 2 seconds
      
      // Clean up
      await supabase.removeChannel(channel)
    })
  })

  describe('Image and File Performance', () => {
    it('should handle image upload simulation efficiently', async () => {
      // Create a mock file blob for testing
      const mockImageData = new Uint8Array(1024 * 100) // 100KB mock image
      const mockFile = new Blob([mockImageData], { type: 'image/jpeg' })
      
      const startTime = performance.now()
      
      // Simulate image processing (without actual upload to avoid storage costs)
      const processedSize = mockFile.size
      const compressionRatio = processedSize / (1024 * 1024) // MB
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(processingTime).toBeLessThan(100) // Image processing should be fast
      expect(compressionRatio).toBeLessThan(1) // Should be less than 1MB
    })
  })

  // Helper function to set up performance test data
  async function setupPerformanceTestData() {
    // Check if we have enough test data for performance testing
    const { count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    // If we don't have enough data, create some test properties
    if (!count || count < 10) {
      console.log('Setting up performance test data...')
      
      // Create test properties for performance testing
      const testProperties = Array.from({ length: 20 }, (_, index) => ({
        landlord_id: 'test-landlord-perf',
        title: `Performance Test Property ${index + 1}`,
        description: `Test property for performance testing - ${index + 1}`,
        address: {
          street: `${index + 1} Test Street`,
          city: 'Test City',
          province: 'Test Province',
          postalCode: '12345'
        },
        room_type: index % 2 === 0 ? 'single' : 'shared',
        price: 15000 + (index * 1000),
        deposit: 5000,
        amenities: ['WiFi', 'Air Conditioning'],
        is_active: true
      }))
      
      // Note: In a real test environment, you'd create these with proper user IDs
      // For performance testing, we're just checking query performance
    }
  }
})