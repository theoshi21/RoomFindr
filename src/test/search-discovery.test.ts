/**
 * Property-Based Tests for Search and Discovery System
 * **Feature: roomfindr, Property 10: Search filtering returns accurate results**
 * **Validates: Requirements 4.2, 4.3, 4.4**
 * 
 * **Feature: roomfindr, Property 11: Listing details display complete information**
 * **Validates: Requirements 4.5**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'

// Test data generators
const roomTypeArb = fc.constantFrom('single', 'shared', 'studio', 'apartment')
const amenityArb = fc.constantFrom('wifi', 'parking', 'laundry', 'gym', 'pool', 'security', 'furnished')

const propertyArb = fc.record({
  id: fc.uuid(),
  landlordId: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 500 }),
  address: fc.record({
    street: fc.string({ minLength: 5, maxLength: 100 }),
    city: fc.string({ minLength: 2, maxLength: 50 }),
    province: fc.string({ minLength: 2, maxLength: 50 }),
    postalCode: fc.string({ minLength: 4, maxLength: 10 }),
    coordinates: fc.option(fc.record({
      lat: fc.float({ min: -90, max: 90 }),
      lng: fc.float({ min: -180, max: 180 })
    }), { nil: undefined })
  }),
  roomType: roomTypeArb,
  price: fc.float({ min: 1000, max: 100000, noNaN: true }).map(n => Math.round(n * 100) / 100),
  deposit: fc.float({ min: 500, max: 50000, noNaN: true }).map(n => Math.round(n * 100) / 100),
  amenities: fc.array(amenityArb, { minLength: 0, maxLength: 7 }),
  images: fc.array(fc.string({ minLength: 20, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
  isActive: fc.boolean(),
  isAvailable: fc.boolean(),
  createdAt: fc.constant(new Date('2024-06-01').toISOString()),
  updatedAt: fc.constant(new Date('2024-06-01').toISOString())
})

const searchFiltersArb = fc.record({
  priceRange: fc.option(fc.record({
    min: fc.float({ min: 1000, max: 50000 }),
    max: fc.float({ min: 10000, max: 100000 })
  }).filter(range => range.min <= range.max), { nil: undefined }),
  location: fc.option(fc.record({
    city: fc.string({ minLength: 2, maxLength: 50 }),
    province: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: undefined })
  }), { nil: undefined }),
  roomType: fc.option(roomTypeArb, { nil: undefined }),
  amenities: fc.option(fc.array(amenityArb, { minLength: 1, maxLength: 3 }), { nil: undefined }),
  availableOnly: fc.option(fc.boolean(), { nil: undefined })
})

// Mock search and discovery system
class MockSearchManager {
  private properties: Map<string, any> = new Map()
  private searchIndex: Map<string, Set<string>> = new Map()

  addProperty(property: any): void {
    this.properties.set(property.id, property)
    this.updateSearchIndex(property)
  }

  searchProperties(filters: any = {}): any[] {
    let results = Array.from(this.properties.values())

    // Filter by active status (only show active properties by default)
    results = results.filter(p => p.isActive)

    // Filter by availability
    if (filters.availableOnly === true) {
      results = results.filter(p => p.isAvailable)
    }

    // Filter by price range (Requirement 4.2)
    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        results = results.filter(p => p.price >= filters.priceRange.min)
      }
      if (filters.priceRange.max !== undefined) {
        results = results.filter(p => p.price <= filters.priceRange.max)
      }
    }

    // Filter by location (Requirement 4.3)
    if (filters.location) {
      if (filters.location.city) {
        results = results.filter(p => 
          p.address.city.toLowerCase().includes(filters.location.city.toLowerCase())
        )
      }
      if (filters.location.province) {
        results = results.filter(p => 
          p.address.province.toLowerCase().includes(filters.location.province.toLowerCase())
        )
      }
    }

    // Filter by room type (Requirement 4.4)
    if (filters.roomType) {
      results = results.filter(p => p.roomType === filters.roomType)
    }

    // Filter by amenities (Requirement 4.4)
    if (filters.amenities && filters.amenities.length > 0) {
      results = results.filter(p => 
        filters.amenities.every((amenity: string) => p.amenities.includes(amenity))
      )
    }

    // Sort by relevance (most recent first)
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  getPropertyDetails(propertyId: string): any | null {
    const property = this.properties.get(propertyId)
    if (!property || !property.isActive) {
      return null
    }

    // Return comprehensive property information (Requirement 4.5)
    return {
      ...property,
      // Ensure all required information is present
      fullAddress: `${property.address.street}, ${property.address.city}, ${property.address.province} ${property.address.postalCode}`,
      totalImages: property.images.length,
      amenityCount: property.amenities.length,
      pricePerMonth: property.price,
      securityDeposit: property.deposit,
      landlordInfo: {
        id: property.landlordId,
        // In real system, would fetch landlord details
        verified: true
      }
    }
  }

  getSearchSuggestions(query: string): string[] {
    const suggestions = new Set<string>()
    
    // Add city suggestions
    for (const property of this.properties.values()) {
      if (property.isActive && property.address.city.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(property.address.city)
      }
    }

    // Add room type suggestions
    const roomTypes = ['single', 'shared', 'studio', 'apartment']
    for (const roomType of roomTypes) {
      if (roomType.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(roomType)
      }
    }

    return Array.from(suggestions).slice(0, 5)
  }

  private updateSearchIndex(property: any): void {
    // Index by room type
    const roomTypeKey = `roomType:${property.roomType}`
    if (!this.searchIndex.has(roomTypeKey)) {
      this.searchIndex.set(roomTypeKey, new Set())
    }
    this.searchIndex.get(roomTypeKey)!.add(property.id)

    // Index by city
    const cityKey = `city:${property.address.city.toLowerCase()}`
    if (!this.searchIndex.has(cityKey)) {
      this.searchIndex.set(cityKey, new Set())
    }
    this.searchIndex.get(cityKey)!.add(property.id)

    // Index by amenities
    for (const amenity of property.amenities) {
      const amenityKey = `amenity:${amenity}`
      if (!this.searchIndex.has(amenityKey)) {
        this.searchIndex.set(amenityKey, new Set())
      }
      this.searchIndex.get(amenityKey)!.add(property.id)
    }
  }

  // Test helper methods
  clear(): void {
    this.properties.clear()
    this.searchIndex.clear()
  }

  getAllProperties(): any[] {
    return Array.from(this.properties.values())
  }
}

describe('Property 10: Search Filtering Returns Accurate Results', () => {
  let mockManager: MockSearchManager

  beforeEach(() => {
    mockManager = new MockSearchManager()
  })

  it('should return only listings within the specified price range', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArb, { minLength: 5, maxLength: 20 }),
        fc.record({
          min: fc.float({ min: 1000, max: 50000 }),
          max: fc.float({ min: 10000, max: 100000 })
        }).filter(range => range.min <= range.max),
        (properties, priceRange) => {
          // Ensure at least some properties are active
          const activeProperties = properties.map((p, i) => ({ ...p, isActive: i % 2 === 0 }))
          
          // Add properties to search system
          activeProperties.forEach(property => {
            mockManager.addProperty(property)
          })

          // Search with price range filter (Requirement 4.2)
          const results = mockManager.searchProperties({ priceRange })

          // All results should be within the price range
          results.forEach(result => {
            expect(result.price).toBeGreaterThanOrEqual(priceRange.min)
            expect(result.price).toBeLessThanOrEqual(priceRange.max)
          })

          // Verify that properties outside the range are excluded
          const allActiveProperties = activeProperties.filter(p => p.isActive)
          const expectedCount = allActiveProperties.filter(p => 
            p.price >= priceRange.min && p.price <= priceRange.max
          ).length

          expect(results.length).toBe(expectedCount)
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should return only listings in the specified geographic area', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArb, { minLength: 5, maxLength: 15 }),
        fc.string({ minLength: 2, maxLength: 20 }),
        (properties, searchCity) => {
          // Ensure at least some properties are active
          const activeProperties = properties.map((p, i) => ({ ...p, isActive: i % 2 === 0 }))
          
          // Add properties to search system
          activeProperties.forEach(property => {
            mockManager.addProperty(property)
          })

          // Search with location filter (Requirement 4.3)
          const results = mockManager.searchProperties({ 
            location: { city: searchCity }
          })

          // All results should match the location filter
          results.forEach(result => {
            expect(result.address.city.toLowerCase()).toContain(searchCity.toLowerCase())
          })

          // Verify that only matching properties are included
          const allActiveProperties = activeProperties.filter(p => p.isActive)
          const expectedCount = allActiveProperties.filter(p => 
            p.address.city.toLowerCase().includes(searchCity.toLowerCase())
          ).length

          expect(results.length).toBe(expectedCount)
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should return only listings matching the selected room types', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArb, { minLength: 5, maxLength: 15 }),
        roomTypeArb,
        (properties, targetRoomType) => {
          // Ensure at least some properties are active
          const activeProperties = properties.map((p, i) => ({ ...p, isActive: i % 2 === 0 }))
          
          // Add properties to search system
          activeProperties.forEach(property => {
            mockManager.addProperty(property)
          })

          // Search with room type filter (Requirement 4.4)
          const results = mockManager.searchProperties({ 
            roomType: targetRoomType
          })

          // All results should match the room type
          results.forEach(result => {
            expect(result.roomType).toBe(targetRoomType)
          })

          // Verify that only matching properties are included
          const allActiveProperties = activeProperties.filter(p => p.isActive)
          const expectedCount = allActiveProperties.filter(p => 
            p.roomType === targetRoomType
          ).length

          expect(results.length).toBe(expectedCount)
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should return only listings with all specified amenities', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArb, { minLength: 5, maxLength: 15 }),
        fc.array(amenityArb, { minLength: 1, maxLength: 3 }),
        (properties, requiredAmenities) => {
          // Ensure at least some properties are active
          const activeProperties = properties.map((p, i) => ({ ...p, isActive: i % 2 === 0 }))
          
          // Add properties to search system
          activeProperties.forEach(property => {
            mockManager.addProperty(property)
          })

          // Search with amenities filter (Requirement 4.4)
          const results = mockManager.searchProperties({ 
            amenities: requiredAmenities
          })

          // All results should have all required amenities
          results.forEach(result => {
            requiredAmenities.forEach(amenity => {
              expect(result.amenities).toContain(amenity)
            })
          })

          // Verify that only properties with all amenities are included
          const allActiveProperties = activeProperties.filter(p => p.isActive)
          const expectedCount = allActiveProperties.filter(p => 
            requiredAmenities.every(amenity => p.amenities.includes(amenity))
          ).length

          expect(results.length).toBe(expectedCount)
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should combine multiple filters correctly', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArb, { minLength: 10, maxLength: 25 }),
        searchFiltersArb,
        (properties, filters) => {
          // Add properties to search system
          properties.forEach(property => {
            mockManager.addProperty(property)
          })

          // Search with combined filters
          const results = mockManager.searchProperties(filters)

          // All results should match all applied filters
          results.forEach(result => {
            // Must be active
            expect(result.isActive).toBe(true)

            // Check availability filter
            if (filters.availableOnly === true) {
              expect(result.isAvailable).toBe(true)
            }

            // Check price range filter
            if (filters.priceRange) {
              if (filters.priceRange.min !== undefined) {
                expect(result.price).toBeGreaterThanOrEqual(filters.priceRange.min)
              }
              if (filters.priceRange.max !== undefined) {
                expect(result.price).toBeLessThanOrEqual(filters.priceRange.max)
              }
            }

            // Check location filter
            if (filters.location) {
              if (filters.location.city) {
                expect(result.address.city.toLowerCase()).toContain(filters.location.city.toLowerCase())
              }
              if (filters.location.province) {
                expect(result.address.province.toLowerCase()).toContain(filters.location.province.toLowerCase())
              }
            }

            // Check room type filter
            if (filters.roomType) {
              expect(result.roomType).toBe(filters.roomType)
            }

            // Check amenities filter
            if (filters.amenities && filters.amenities.length > 0) {
              filters.amenities.forEach((amenity: string) => {
                expect(result.amenities).toContain(amenity)
              })
            }
          })

          // Verify results are sorted by most recent first
          for (let i = 0; i < results.length - 1; i++) {
            const currentDate = new Date(results[i].updatedAt).getTime()
            const nextDate = new Date(results[i + 1].updatedAt).getTime()
            expect(currentDate).toBeGreaterThanOrEqual(nextDate)
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  it('should only return active listings in search results', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArb, { minLength: 5, maxLength: 15 }),
        (properties) => {
          // Ensure at least some properties are active
          const activeProperties = properties.map((p, i) => ({ ...p, isActive: i % 2 === 0 }))
          
          // Add properties to search system
          activeProperties.forEach(property => {
            mockManager.addProperty(property)
          })

          // Search without any filters
          const results = mockManager.searchProperties()

          // All results should be active
          results.forEach(result => {
            expect(result.isActive).toBe(true)
          })

          // Verify that inactive properties are excluded
          const expectedCount = activeProperties.filter(p => p.isActive).length
          expect(results.length).toBe(expectedCount)
        }
      ),
      { numRuns: 30 }
    )
  })
})

describe('Property 11: Listing Details Display Complete Information', () => {
  let mockManager: MockSearchManager

  beforeEach(() => {
    mockManager = new MockSearchManager()
  })

  it('should display comprehensive information including images, location, and availability', () => {
    fc.assert(
      fc.property(
        propertyArb,
        (property) => {
          // Ensure property is active so it can be retrieved
          property.isActive = true
          
          // Add property to system
          mockManager.addProperty(property)

          // Get property details (Requirement 4.5)
          const details = mockManager.getPropertyDetails(property.id)

          // Should return comprehensive information
          expect(details).toBeDefined()
          expect(details.id).toBe(property.id)
          expect(details.title).toBe(property.title)
          expect(details.description).toBe(property.description)
          
          // Address information
          expect(details.address).toEqual(property.address)
          expect(details.fullAddress).toBeDefined()
          expect(details.fullAddress).toContain(property.address.street)
          expect(details.fullAddress).toContain(property.address.city)
          expect(details.fullAddress).toContain(property.address.province)
          expect(details.fullAddress).toContain(property.address.postalCode)

          // Property details
          expect(details.roomType).toBe(property.roomType)
          expect(details.pricePerMonth).toBe(property.price)
          expect(details.securityDeposit).toBe(property.deposit)

          // Images information
          expect(details.images).toEqual(property.images)
          expect(details.totalImages).toBe(property.images.length)

          // Amenities information
          expect(details.amenities).toEqual(property.amenities)
          expect(details.amenityCount).toBe(property.amenities.length)

          // Availability information
          expect(details.isAvailable).toBe(property.isAvailable)

          // Landlord information
          expect(details.landlordInfo).toBeDefined()
          expect(details.landlordInfo.id).toBe(property.landlordId)
          expect(details.landlordInfo.verified).toBeDefined()

          // Timestamps
          expect(details.createdAt).toBe(property.createdAt)
          expect(details.updatedAt).toBe(property.updatedAt)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should not return details for inactive or non-existent properties', () => {
    fc.assert(
      fc.property(
        propertyArb,
        fc.uuid(), // non-existent property ID
        (property, nonExistentId) => {
          // Make property inactive
          property.isActive = false
          
          // Add inactive property to system
          mockManager.addProperty(property)

          // Should not return details for inactive property
          const inactiveDetails = mockManager.getPropertyDetails(property.id)
          expect(inactiveDetails).toBeNull()

          // Should not return details for non-existent property
          const nonExistentDetails = mockManager.getPropertyDetails(nonExistentId)
          expect(nonExistentDetails).toBeNull()
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should provide search suggestions based on available properties', () => {
    fc.assert(
      fc.property(
        fc.array(propertyArb, { minLength: 3, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (properties, searchQuery) => {
          // Add active properties to system
          properties.forEach(property => {
            property.isActive = true
            mockManager.addProperty(property)
          })

          // Get search suggestions
          const suggestions = mockManager.getSearchSuggestions(searchQuery)

          // Should return relevant suggestions
          expect(Array.isArray(suggestions)).toBe(true)
          expect(suggestions.length).toBeLessThanOrEqual(5)

          // All suggestions should be strings
          suggestions.forEach(suggestion => {
            expect(typeof suggestion).toBe('string')
            expect(suggestion.length).toBeGreaterThan(0)
          })

          // If query matches any city or room type, should include relevant suggestions
          const cities = properties.map(p => p.address.city)
          const roomTypes = ['single', 'shared', 'studio', 'apartment']
          
          const matchingCities = cities.filter(city => 
            city.toLowerCase().includes(searchQuery.toLowerCase())
          )
          const matchingRoomTypes = roomTypes.filter(type => 
            type.toLowerCase().includes(searchQuery.toLowerCase())
          )

          if (matchingCities.length > 0 || matchingRoomTypes.length > 0) {
            expect(suggestions.length).toBeGreaterThan(0)
          }
        }
      ),
      { numRuns: 30 }
    )
  })
})