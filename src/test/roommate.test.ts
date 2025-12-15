// Roommate Profile System Tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { 
  createRoommateProfile, 
  getSharedRoomInfo, 
  calculateCompatibilityScore,
  searchRoommateProfiles 
} from '@/lib/roommate'
import type { 
  RoommateProfile, 
  RoommateProfileFormData,
  LifestylePreferences,
  CompatibilityPreferences,
  PrivacySettings 
} from '@/types/roommate'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

describe('Roommate Profile System', () => {
  let testPropertyId: string
  let testUserId: string
  let testUserProfile: any

  beforeEach(async () => {
    console.log('Setting up test environment...')
    
    // Create test user
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-roommate-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })
    
    if (authData.user) {
      testUserId = authData.user.id
      
      // Create user record
      await supabase.from('users').insert({
        id: testUserId,
        email: authData.user.email,
        role: 'tenant',
        is_active: true,
        is_verified: true
      })
      
      // Create user profile
      await supabase.from('user_profiles').insert({
        user_id: testUserId,
        first_name: 'Test',
        last_name: 'User'
      })
      
      // Create test landlord
      const { data: landlordData } = await supabase.auth.admin.createUser({
        email: `landlord-${Date.now()}@example.com`,
        password: 'testpassword123',
        email_confirm: true
      })
      
      if (landlordData.user) {
        await supabase.from('users').insert({
          id: landlordData.user.id,
          email: landlordData.user.email,
          role: 'landlord',
          is_active: true,
          is_verified: true
        })
        
        // Create test property
        const { data: propertyData } = await supabase.from('properties').insert({
          landlord_id: landlordData.user.id,
          title: 'Test Shared Room',
          description: 'A test shared room for roommate testing',
          street: '123 Test St',
          city: 'Test City',
          province: 'Test Province',
          postal_code: '12345',
          room_type: 'shared',
          price: 1000,
          deposit: 500,
          max_occupancy: 4,
          current_occupancy: 0,
          is_active: true
        }).select().single()
        
        if (propertyData) {
          testPropertyId = propertyData.id
        }
      }
    }
  })

  afterEach(async () => {
    console.log('Cleaning up test environment...')
    
    // Clean up test data
    if (testPropertyId) {
      await supabase.from('roommate_profiles').delete().eq('property_id', testPropertyId)
      await supabase.from('properties').delete().eq('id', testPropertyId)
    }
    
    if (testUserId) {
      await supabase.from('user_profiles').delete().eq('user_id', testUserId)
      await supabase.from('users').delete().eq('id', testUserId)
      await supabase.auth.admin.deleteUser(testUserId)
    }
  })

  describe('Roommate Profile Creation', () => {
    it('should create a roommate profile successfully', async () => {
      const profileData: RoommateProfileFormData = {
        bio: 'I am a clean and friendly roommate',
        age: 25,
        occupation: 'Software Engineer',
        lifestyle: {
          sleepSchedule: 'normal',
          cleanliness: 'clean',
          socialLevel: 'moderate',
          noiseLevel: 'quiet',
          guestPolicy: 'occasional',
          smokingPreference: 'non_smoker',
          petPreference: 'no_pets'
        },
        compatibility: {
          preferredAgeRange: { min: 20, max: 35 },
          preferredGender: 'any',
          preferredOccupation: [],
          dealBreakers: [],
          importantQualities: []
        },
        privacySettings: {
          showFullName: true,
          showAge: true,
          showOccupation: true,
          showBio: true,
          showLifestyle: true,
          showCompatibility: false,
          showContactInfo: false
        }
      }

      // Mock authentication
      const originalGetUser = supabase.auth.getUser
      supabase.auth.getUser = async () => ({
        data: { user: { id: testUserId } },
        error: null
      })

      const { profile, error } = await createRoommateProfile(testPropertyId, profileData)

      // Restore original method
      supabase.auth.getUser = originalGetUser

      expect(error).toBeNull()
      expect(profile).toBeDefined()
      expect(profile?.bio).toBe(profileData.bio)
      expect(profile?.age).toBe(profileData.age)
      expect(profile?.occupation).toBe(profileData.occupation)
    })

    it('should prevent creating duplicate profiles for the same property', async () => {
      const profileData: RoommateProfileFormData = {
        bio: 'Test bio',
        age: 25,
        occupation: 'Test Job',
        lifestyle: {
          sleepSchedule: 'normal',
          cleanliness: 'clean',
          socialLevel: 'moderate',
          noiseLevel: 'quiet',
          guestPolicy: 'occasional',
          smokingPreference: 'non_smoker',
          petPreference: 'no_pets'
        },
        compatibility: {
          preferredAgeRange: { min: 20, max: 35 },
          preferredGender: 'any',
          preferredOccupation: [],
          dealBreakers: [],
          importantQualities: []
        },
        privacySettings: {
          showFullName: true,
          showAge: true,
          showOccupation: true,
          showBio: true,
          showLifestyle: true,
          showCompatibility: false,
          showContactInfo: false
        }
      }

      // Mock authentication
      const originalGetUser = supabase.auth.getUser
      supabase.auth.getUser = async () => ({
        data: { user: { id: testUserId } },
        error: null
      })

      // Create first profile
      const { profile: firstProfile, error: firstError } = await createRoommateProfile(testPropertyId, profileData)
      expect(firstError).toBeNull()
      expect(firstProfile).toBeDefined()

      // Try to create second profile for same property
      const { profile: secondProfile, error: secondError } = await createRoommateProfile(testPropertyId, profileData)
      expect(secondError).toBeDefined()
      expect(secondProfile).toBeNull()

      // Restore original method
      supabase.auth.getUser = originalGetUser
    })
  })

  describe('Shared Room Information', () => {
    it('should get shared room information correctly', async () => {
      const { roomInfo, error } = await getSharedRoomInfo(testPropertyId)

      expect(error).toBeNull()
      expect(roomInfo).toBeDefined()
      expect(roomInfo?.totalSlots).toBe(4)
      expect(roomInfo?.occupiedSlots).toBe(0)
      expect(roomInfo?.availableSlots).toBe(4)
      expect(roomInfo?.roommateSlots).toHaveLength(4)
    })

    it('should return error for non-existent property', async () => {
      const fakePropertyId = '00000000-0000-0000-0000-000000000000'
      const { roomInfo, error } = await getSharedRoomInfo(fakePropertyId)

      expect(error).toBeDefined()
      expect(roomInfo).toBeNull()
    })
  })

  describe('Compatibility Calculation', () => {
    it('should calculate compatibility score correctly', () => {
      const userProfile: RoommateProfile = {
        id: '1',
        userId: 'user1',
        propertyId: testPropertyId,
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Test bio',
        age: 25,
        occupation: 'Engineer',
        lifestyle: {
          sleepSchedule: 'normal',
          cleanliness: 'clean',
          socialLevel: 'moderate',
          noiseLevel: 'quiet',
          guestPolicy: 'occasional',
          smokingPreference: 'non_smoker',
          petPreference: 'no_pets'
        },
        compatibility: {
          preferredAgeRange: { min: 20, max: 35 },
          preferredGender: 'any',
          preferredOccupation: [],
          dealBreakers: [],
          importantQualities: []
        },
        privacySettings: {
          showFullName: true,
          showAge: true,
          showOccupation: true,
          showBio: true,
          showLifestyle: true,
          showCompatibility: false,
          showContactInfo: false
        },
        moveInDate: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const targetProfile: RoommateProfile = {
        ...userProfile,
        id: '2',
        userId: 'user2',
        age: 27, // Within preferred age range
        lifestyle: {
          ...userProfile.lifestyle,
          sleepSchedule: 'normal', // Same as user
          cleanliness: 'clean', // Same as user
          socialLevel: 'moderate', // Same as user
          noiseLevel: 'quiet', // Same as user
          guestPolicy: 'occasional', // Same as user
          smokingPreference: 'non_smoker', // Same as user
          petPreference: 'no_pets' // Same as user
        }
      }

      const score = calculateCompatibilityScore(userProfile, targetProfile)

      expect(score.userId).toBe('user2')
      expect(score.score).toBeGreaterThan(80) // High compatibility
      expect(score.matchingFactors.length).toBeGreaterThan(0)
      expect(score.conflictingFactors.length).toBe(0)
    })

    it('should identify conflicts in compatibility', () => {
      const userProfile: RoommateProfile = {
        id: '1',
        userId: 'user1',
        propertyId: testPropertyId,
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Test bio',
        age: 25,
        occupation: 'Engineer',
        lifestyle: {
          sleepSchedule: 'normal',
          cleanliness: 'clean',
          socialLevel: 'moderate',
          noiseLevel: 'quiet',
          guestPolicy: 'occasional',
          smokingPreference: 'non_smoker',
          petPreference: 'no_pets'
        },
        compatibility: {
          preferredAgeRange: { min: 20, max: 35 },
          preferredGender: 'any',
          preferredOccupation: [],
          dealBreakers: [],
          importantQualities: []
        },
        privacySettings: {
          showFullName: true,
          showAge: true,
          showOccupation: true,
          showBio: true,
          showLifestyle: true,
          showCompatibility: false,
          showContactInfo: false
        },
        moveInDate: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const conflictingProfile: RoommateProfile = {
        ...userProfile,
        id: '2',
        userId: 'user2',
        age: 45, // Outside preferred age range
        lifestyle: {
          ...userProfile.lifestyle,
          smokingPreference: 'smoker', // Conflicts with non_smoker
          cleanliness: 'relaxed' // Different from clean
        }
      }

      const score = calculateCompatibilityScore(userProfile, conflictingProfile)

      expect(score.userId).toBe('user2')
      expect(score.score).toBeLessThan(50) // Low compatibility due to conflicts
      expect(score.conflictingFactors.length).toBeGreaterThan(0)
    })
  })

  describe('Roommate Search', () => {
    it('should search roommate profiles with filters', async () => {
      // This test would require setting up multiple profiles
      // For now, just test that the function doesn't error
      const { profiles, error } = await searchRoommateProfiles(testPropertyId, {
        ageRange: { min: 20, max: 30 }
      })

      expect(error).toBeNull()
      expect(Array.isArray(profiles)).toBe(true)
    })
  })
})