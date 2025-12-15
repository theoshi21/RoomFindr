import { describe, it, expect } from 'vitest'
import { 
  validateProfileData, 
  getDefaultPreferences,
  getUserProfile,
  updateUserProfile,
  createUserProfile
} from '../lib/profile-simple'
import type { ProfileUpdateData } from '../types/profile'

describe('Profile Management', () => {
  describe('validateProfileData', () => {
    it('should validate first name correctly', () => {
      const validData: ProfileUpdateData = { first_name: 'John' }
      const errors = validateProfileData(validData)
      expect(errors).toHaveLength(0)
    })

    it('should reject short first names', () => {
      const invalidData: ProfileUpdateData = { first_name: 'J' }
      const errors = validateProfileData(invalidData)
      expect(errors).toContain('First name must be at least 2 characters long')
    })

    it('should reject long first names', () => {
      const invalidData: ProfileUpdateData = { first_name: 'A'.repeat(51) }
      const errors = validateProfileData(invalidData)
      expect(errors).toContain('First name must be less than 50 characters')
    })

    it('should validate last name correctly', () => {
      const validData: ProfileUpdateData = { last_name: 'Doe' }
      const errors = validateProfileData(validData)
      expect(errors).toHaveLength(0)
    })

    it('should reject short last names', () => {
      const invalidData: ProfileUpdateData = { last_name: 'D' }
      const errors = validateProfileData(invalidData)
      expect(errors).toContain('Last name must be at least 2 characters long')
    })

    it('should validate phone numbers correctly', () => {
      const validData: ProfileUpdateData = { phone: '+1234567890' }
      const errors = validateProfileData(validData)
      expect(errors).toHaveLength(0)
    })

    it('should allow null phone numbers', () => {
      const validData: ProfileUpdateData = { phone: null }
      const errors = validateProfileData(validData)
      expect(errors).toHaveLength(0)
    })

    it('should validate bio length', () => {
      const validData: ProfileUpdateData = { bio: 'This is a valid bio' }
      const errors = validateProfileData(validData)
      expect(errors).toHaveLength(0)
    })

    it('should reject long bios', () => {
      const invalidData: ProfileUpdateData = { bio: 'A'.repeat(501) }
      const errors = validateProfileData(invalidData)
      expect(errors).toContain('Bio must be less than 500 characters')
    })
  })

  describe('getDefaultPreferences', () => {
    it('should return default preferences', () => {
      const preferences = getDefaultPreferences()
      
      expect(preferences).toEqual({
        notifications: true,
        emailUpdates: true,
        theme: 'light',
        language: 'en',
        timezone: expect.any(String)
      })
    })

    it('should include a valid timezone', () => {
      const preferences = getDefaultPreferences()
      expect(preferences.timezone).toBeDefined()
      expect(typeof preferences.timezone).toBe('string')
      if (preferences.timezone) {
        expect(preferences.timezone.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Profile API functions', () => {
    // These tests would require a database connection
    // For now, we'll test that the functions exist and have correct signatures
    
    it('should have getUserProfile function', () => {
      expect(typeof getUserProfile).toBe('function')
    })

    it('should have updateUserProfile function', () => {
      expect(typeof updateUserProfile).toBe('function')
    })

    it('should have createUserProfile function', () => {
      expect(typeof createUserProfile).toBe('function')
    })
  })


})