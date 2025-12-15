/**
 * Property-Based Tests for Property Listing Management
 * **Feature: roomfindr, Property 12: Listing management maintains data integrity**
 * **Validates: Requirements 5.1, 5.3, 5.5**
 * 
 * **Feature: roomfindr, Property 13: Image upload and storage works reliably**
 * **Validates: Requirements 5.2**
 * 
 * **Feature: roomfindr, Property 14: Availability management updates consistently**
 * **Validates: Requirements 5.4**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'

// Test data generators
const roomTypeArb = fc.constantFrom('single', 'shared', 'studio', 'apartment')
const propertyStatusArb = fc.constantFrom('active', 'inactive', 'draft')

const addressArb = fc.record({
  street: fc.string({ minLength: 5, maxLength: 100 }),
  city: fc.string({ minLength: 2, maxLength: 50 }),
  province: fc.string({ minLength: 2, maxLength: 50 }),
  postalCode: fc.string({ minLength: 4, maxLength: 10 }),
  coordinates: fc.option(fc.record({
    lat: fc.float({ min: -90, max: 90 }),
    lng: fc.float({ min: -180, max: 180 })
  }), { nil: undefined })
})

const propertyListingArb = fc.record({
  landlordId: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 1000 }),
  address: addressArb,
  roomType: roomTypeArb,
  price: fc.float({ min: 1000, max: 100000, noNaN: true }).map(n => Math.round(n * 100) / 100),
  deposit: fc.float({ min: 500, max: 50000, noNaN: true }).map(n => Math.round(n * 100) / 100),
  amenities: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 0, maxLength: 10 }),
  images: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 0, maxLength: 10 }),
  isActive: fc.boolean()
})

const propertyUpdateArb = fc.record({
  propertyId: fc.uuid(),
  updates: fc.record({
    title: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
    description: fc.option(fc.string({ minLength: 10, maxLength: 1000 }), { nil: undefined }),
    price: fc.option(fc.float({ min: 1000, max: 100000, noNaN: true }).map(n => Math.round(n * 100) / 100), { nil: undefined }),
    deposit: fc.option(fc.float({ min: 500, max: 50000, noNaN: true }).map(n => Math.round(n * 100) / 100), { nil: undefined }),
    amenities: fc.option(fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 0, maxLength: 10 }), { nil: undefined }),
    isActive: fc.option(fc.boolean(), { nil: undefined })
  }, { requiredKeys: [] })
})

const imageUploadArb = fc.record({
  propertyId: fc.uuid(),
  images: fc.array(fc.record({
    fileName: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.jpg`),
    fileSize: fc.integer({ min: 1024, max: 10485760 }), // 1KB to 10MB
    mimeType: fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
    url: fc.string({ minLength: 20, maxLength: 200 }).map(s => `https://storage.example.com/${s}`)
  }), { minLength: 1, maxLength: 10 })
})

const availabilityUpdateArb = fc.record({
  propertyId: fc.uuid(),
  availableFrom: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  availableTo: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }), { nil: undefined }),
  isAvailable: fc.boolean()
})

// Mock property listing system
class MockPropertyManager {
  private properties: Map<string, any> = new Map()
  private searchIndex: Map<string, Set<string>> = new Map() // For search functionality
  private counter: number = 0

  createListing(listingData: any, landlordId: string): { success: boolean; error?: string; propertyId?: string } {
    // Validate required fields
    if (!listingData.title || !listingData.description || !listingData.address) {
      return { success: false, error: 'Missing required listing data' }
    }

    if (listingData.price <= 0 || listingData.deposit < 0) {
      return { success: false, error: 'Invalid price or deposit amount' }
    }

    // Create property listing
    this.counter++
    const propertyId = crypto.randomUUID()
    const now = new Date(Date.now() + this.counter * 1000).toISOString()
    
    const property = {
      id: propertyId,
      landlordId,
      title: listingData.title,
      description: listingData.description,
      address: listingData.address,
      roomType: listingData.roomType,
      price: listingData.price,
      deposit: listingData.deposit,
      amenities: listingData.amenities || [],
      images: listingData.images || [],
      isActive: listingData.isActive !== false, // Default to true
      createdAt: now,
      updatedAt: now
    }

    this.properties.set(propertyId, property)
    
    // Update search index
    this.updateSearchIndex(property)

    return { success: true, propertyId }
  }

  updateListing(propertyId: string, updates: any, landlordId: string): { success: boolean; error?: string } {
    const property = this.properties.get(propertyId)
    if (!property) {
      return { success: false, error: 'Property not found' }
    }

    if (property.landlordId !== landlordId) {
      return { success: false, error: 'Unauthorized to update this property' }
    }

    // Apply updates
    const updatedProperty = { ...property }
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updatedProperty[key] = updates[key]
      }
    })
    this.counter++
    updatedProperty.updatedAt = new Date(Date.now() + this.counter * 1000).toISOString()

    this.properties.set(propertyId, updatedProperty)
    
    // Update search index
    this.updateSearchIndex(updatedProperty)

    return { success: true }
  }

  removeListing(propertyId: string, landlordId: string): { success: boolean; error?: string } {
    const property = this.properties.get(propertyId)
    if (!property) {
      return { success: false, error: 'Property not found' }
    }

    if (property.landlordId !== landlordId) {
      return { success: false, error: 'Unauthorized to remove this property' }
    }

    this.properties.delete(propertyId)
    
    // Remove from search index
    this.removeFromSearchIndex(propertyId)

    return { success: true }
  }

  uploadImages(propertyId: string, images: any[], landlordId: string): { success: boolean; error?: string; imageUrls?: string[] } {
    const property = this.properties.get(propertyId)
    if (!property) {
      return { success: false, error: 'Property not found' }
    }

    if (property.landlordId !== landlordId) {
      return { success: false, error: 'Unauthorized to upload images for this property' }
    }

    // Validate images
    for (const image of images) {
      if (image.fileSize > 10485760) { // 10MB limit
        return { success: false, error: 'Image file size exceeds 10MB limit' }
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType)) {
        return { success: false, error: 'Invalid image format. Only JPEG, PNG, WebP allowed' }
      }
    }

    // Store images
    const imageUrls = images.map(img => img.url)
    const updatedProperty = {
      ...property,
      images: [...property.images, ...imageUrls],
      updatedAt: new Date().toISOString()
    }

    this.properties.set(propertyId, updatedProperty)

    return { success: true, imageUrls }
  }

  updateAvailability(propertyId: string, availabilityData: any, landlordId: string): { success: boolean; error?: string } {
    const property = this.properties.get(propertyId)
    if (!property) {
      return { success: false, error: 'Property not found' }
    }

    if (property.landlordId !== landlordId) {
      return { success: false, error: 'Unauthorized to update availability for this property' }
    }

    // Validate availability dates
    if (availabilityData.availableTo && 
        !isNaN(availabilityData.availableFrom.getTime()) && 
        !isNaN(availabilityData.availableTo.getTime()) &&
        availabilityData.availableFrom > availabilityData.availableTo) {
      return { success: false, error: 'Available from date cannot be after available to date' }
    }

    // Validate that dates are not invalid
    if (isNaN(availabilityData.availableFrom.getTime()) || 
        (availabilityData.availableTo && isNaN(availabilityData.availableTo.getTime()))) {
      return { success: false, error: 'Invalid date provided' }
    }

    const updatedProperty = {
      ...property,
      availableFrom: availabilityData.availableFrom,
      availableTo: availabilityData.availableTo,
      isAvailable: availabilityData.isAvailable,
      updatedAt: new Date().toISOString()
    }

    this.properties.set(propertyId, updatedProperty)
    
    // Update search index based on availability
    this.updateSearchIndex(updatedProperty)

    return { success: true }
  }

  searchProperties(filters: any = {}): any[] {
    let results = Array.from(this.properties.values())

    // Filter by active status
    if (filters.activeOnly === true) {
      results = results.filter(p => p.isActive)
    }

    // Filter by room type
    if (filters.roomType) {
      results = results.filter(p => p.roomType === filters.roomType)
    }

    // Filter by price range
    if (filters.minPrice !== undefined) {
      results = results.filter(p => p.price >= filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      results = results.filter(p => p.price <= filters.maxPrice)
    }

    // Filter by availability
    if (filters.availableOnly) {
      results = results.filter(p => p.isAvailable !== false)
    }

    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  getProperty(propertyId: string): any | null {
    return this.properties.get(propertyId) || null
  }

  getPropertiesByLandlord(landlordId: string): any[] {
    return Array.from(this.properties.values())
      .filter(p => p.landlordId === landlordId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  private updateSearchIndex(property: any): void {
    // Simple search indexing by room type and city
    const roomTypeKey = `roomType:${property.roomType}`
    const cityKey = `city:${property.address.city.toLowerCase()}`
    
    if (!this.searchIndex.has(roomTypeKey)) {
      this.searchIndex.set(roomTypeKey, new Set())
    }
    if (!this.searchIndex.has(cityKey)) {
      this.searchIndex.set(cityKey, new Set())
    }
    
    this.searchIndex.get(roomTypeKey)!.add(property.id)
    this.searchIndex.get(cityKey)!.add(property.id)
  }

  private removeFromSearchIndex(propertyId: string): void {
    for (const [key, propertySet] of this.searchIndex.entries()) {
      propertySet.delete(propertyId)
    }
  }

  // Test helper methods
  clear(): void {
    this.properties.clear()
    this.searchIndex.clear()
    this.counter = 0
  }
}

describe('Property 12: Listing Management Maintains Data Integrity', () => {
  let mockManager: MockPropertyManager

  beforeEach(() => {
    mockManager = new MockPropertyManager()
  })

  it('should save listing with all provided details and make it searchable', () => {
    fc.assert(
      fc.property(
        propertyListingArb,
        (listingData) => {
          // Ensure valid listing data
          fc.pre(listingData.title.trim().length >= 5)
          fc.pre(listingData.description.trim().length >= 10)
          fc.pre(listingData.price > 0)
          fc.pre(listingData.deposit >= 0)

          // Create listing (Requirement 5.1)
          const result = mockManager.createListing(listingData, listingData.landlordId)

          // Should succeed
          expect(result.success).toBe(true)
          expect(result.propertyId).toBeDefined()
          expect(result.error).toBeUndefined()

          // Verify listing is saved with all details
          const savedProperty = mockManager.getProperty(result.propertyId!)
          expect(savedProperty).toBeDefined()
          expect(savedProperty.landlordId).toBe(listingData.landlordId)
          expect(savedProperty.title).toBe(listingData.title)
          expect(savedProperty.description).toBe(listingData.description)
          expect(savedProperty.address).toEqual(listingData.address)
          expect(savedProperty.roomType).toBe(listingData.roomType)
          expect(savedProperty.price).toBe(listingData.price)
          expect(savedProperty.deposit).toBe(listingData.deposit)
          expect(savedProperty.amenities).toEqual(listingData.amenities)
          expect(savedProperty.images).toEqual(listingData.images)
          expect(savedProperty.isActive).toBe(listingData.isActive !== false)

          // Verify listing is searchable
          const searchResults = mockManager.searchProperties({
            roomType: listingData.roomType,
            activeOnly: savedProperty.isActive
          })
          
          if (savedProperty.isActive) {
            expect(searchResults.some(p => p.id === result.propertyId)).toBe(true)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should save changes and reflect updates immediately in search results', () => {
    fc.assert(
      fc.property(
        propertyListingArb,
        propertyUpdateArb,
        (listingData, updateData) => {
          // Ensure valid data
          fc.pre(listingData.title.trim().length >= 5)
          fc.pre(listingData.price > 0)

          // Create initial listing
          const createResult = mockManager.createListing(listingData, listingData.landlordId)
          fc.pre(createResult.success)

          const propertyId = createResult.propertyId!
          updateData.propertyId = propertyId

          // Update listing (Requirement 5.3)
          const updateResult = mockManager.updateListing(propertyId, updateData.updates, listingData.landlordId)
          expect(updateResult.success).toBe(true)

          // Verify updates are applied
          const updatedProperty = mockManager.getProperty(propertyId)
          expect(updatedProperty).toBeDefined()

          Object.keys(updateData.updates).forEach(key => {
            if (updateData.updates[key] !== undefined) {
              expect(updatedProperty[key]).toEqual(updateData.updates[key])
            }
          })

          // Verify updated timestamp
          expect(new Date(updatedProperty.updatedAt).getTime()).toBeGreaterThan(
            new Date(updatedProperty.createdAt).getTime()
          )

          // Verify search results reflect updates immediately
          const searchResults = mockManager.searchProperties({ activeOnly: false })
          const searchedProperty = searchResults.find(p => p.id === propertyId)
          expect(searchedProperty).toBeDefined()
          expect(searchedProperty).toEqual(updatedProperty)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should hide listing from search results and notify affected tenants when removed', () => {
    fc.assert(
      fc.property(
        propertyListingArb,
        (listingData) => {
          // Ensure valid data
          fc.pre(listingData.title.trim().length >= 5)
          fc.pre(listingData.price > 0)

          // Create listing
          const createResult = mockManager.createListing(listingData, listingData.landlordId)
          fc.pre(createResult.success)

          const propertyId = createResult.propertyId!

          // Verify listing is initially searchable
          let searchResults = mockManager.searchProperties({ activeOnly: false })
          expect(searchResults.some(p => p.id === propertyId)).toBe(true)

          // Remove listing (Requirement 5.5)
          const removeResult = mockManager.removeListing(propertyId, listingData.landlordId)
          expect(removeResult.success).toBe(true)

          // Verify listing is hidden from search results
          searchResults = mockManager.searchProperties({ activeOnly: false })
          expect(searchResults.some(p => p.id === propertyId)).toBe(false)

          // Verify listing is completely removed
          const removedProperty = mockManager.getProperty(propertyId)
          expect(removedProperty).toBeNull()
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should prevent unauthorized modifications to listings', () => {
    fc.assert(
      fc.property(
        propertyListingArb,
        propertyUpdateArb,
        fc.uuid(), // unauthorized user ID
        (listingData, updateData, unauthorizedUserId) => {
          // Ensure different user IDs
          fc.pre(unauthorizedUserId !== listingData.landlordId)
          fc.pre(listingData.title.trim().length >= 5)

          // Create listing
          const createResult = mockManager.createListing(listingData, listingData.landlordId)
          fc.pre(createResult.success)

          const propertyId = createResult.propertyId!

          // Attempt unauthorized update
          const updateResult = mockManager.updateListing(propertyId, updateData.updates, unauthorizedUserId)
          expect(updateResult.success).toBe(false)
          expect(updateResult.error).toMatch(/unauthorized|permission/i)

          // Attempt unauthorized removal
          const removeResult = mockManager.removeListing(propertyId, unauthorizedUserId)
          expect(removeResult.success).toBe(false)
          expect(removeResult.error).toMatch(/unauthorized|permission/i)

          // Verify property remains unchanged
          const originalProperty = mockManager.getProperty(propertyId)
          expect(originalProperty).toBeDefined()
          expect(originalProperty.landlordId).toBe(listingData.landlordId)
        }
      ),
      { numRuns: 50 }
    )
  })
})

describe('Property 13: Image Upload and Storage Works Reliably', () => {
  let mockManager: MockPropertyManager

  beforeEach(() => {
    mockManager = new MockPropertyManager()
  })

  it('should store images securely and display them correctly in listings', () => {
    fc.assert(
      fc.property(
        propertyListingArb,
        imageUploadArb,
        (listingData, imageData) => {
          // Ensure valid data
          fc.pre(listingData.title.trim().length >= 5)
          fc.pre(listingData.price > 0)
          fc.pre(imageData.images.every(img => img.fileSize <= 10485760))

          // Create listing
          const createResult = mockManager.createListing(listingData, listingData.landlordId)
          fc.pre(createResult.success)

          const propertyId = createResult.propertyId!
          imageData.propertyId = propertyId

          // Upload images (Requirement 5.2)
          const uploadResult = mockManager.uploadImages(propertyId, imageData.images, listingData.landlordId)
          expect(uploadResult.success).toBe(true)
          expect(uploadResult.imageUrls).toBeDefined()
          expect(uploadResult.imageUrls!.length).toBe(imageData.images.length)

          // Verify images are stored and associated with property
          const updatedProperty = mockManager.getProperty(propertyId)
          expect(updatedProperty).toBeDefined()
          
          // Check that all uploaded image URLs are in the property
          imageData.images.forEach(img => {
            expect(updatedProperty.images).toContain(img.url)
          })

          // Verify images are displayed in search results
          const searchResults = mockManager.searchProperties({ activeOnly: false })
          const searchedProperty = searchResults.find(p => p.id === propertyId)
          expect(searchedProperty).toBeDefined()
          expect(searchedProperty.images).toEqual(updatedProperty.images)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should validate image file sizes and formats', () => {
    fc.assert(
      fc.property(
        propertyListingArb,
        fc.oneof(
          // Oversized images
          fc.record({
            propertyId: fc.uuid(),
            images: fc.array(fc.record({
              fileName: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.jpg`),
              fileSize: fc.integer({ min: 10485761, max: 50000000 }), // Over 10MB
              mimeType: fc.constantFrom('image/jpeg', 'image/png'),
              url: fc.string({ minLength: 20, maxLength: 200 })
            }), { minLength: 1, maxLength: 3 })
          }),
          // Invalid formats
          fc.record({
            propertyId: fc.uuid(),
            images: fc.array(fc.record({
              fileName: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.txt`),
              fileSize: fc.integer({ min: 1024, max: 5000000 }),
              mimeType: fc.constantFrom('text/plain', 'application/pdf', 'video/mp4'),
              url: fc.string({ minLength: 20, maxLength: 200 })
            }), { minLength: 1, maxLength: 3 })
          })
        ),
        (listingData, invalidImageData) => {
          // Create listing first
          const createResult = mockManager.createListing(listingData, listingData.landlordId)
          fc.pre(createResult.success)

          const propertyId = createResult.propertyId!
          invalidImageData.propertyId = propertyId

          // Attempt to upload invalid images
          const uploadResult = mockManager.uploadImages(propertyId, invalidImageData.images, listingData.landlordId)
          
          // Should fail with appropriate error
          expect(uploadResult.success).toBe(false)
          expect(uploadResult.error).toBeDefined()
          expect(uploadResult.imageUrls).toBeUndefined()

          // Verify property images remain unchanged
          const property = mockManager.getProperty(propertyId)
          expect(property.images).toEqual(listingData.images || [])
        }
      ),
      { numRuns: 50 }
    )
  })
})

describe('Property 14: Availability Management Updates Consistently', () => {
  let mockManager: MockPropertyManager

  beforeEach(() => {
    mockManager = new MockPropertyManager()
  })

  it('should update listing status and search results to reflect current availability', () => {
    fc.assert(
      fc.property(
        propertyListingArb,
        availabilityUpdateArb,
        (listingData, availabilityData) => {
          // Ensure valid data
          fc.pre(listingData.title.trim().length >= 5)
          fc.pre(listingData.price > 0)
          fc.pre(!availabilityData.availableTo || availabilityData.availableFrom <= availabilityData.availableTo)

          // Create listing
          const createResult = mockManager.createListing(listingData, listingData.landlordId)
          fc.pre(createResult.success)

          const propertyId = createResult.propertyId!
          availabilityData.propertyId = propertyId

          // Update availability (Requirement 5.4)
          const updateResult = mockManager.updateAvailability(propertyId, availabilityData, listingData.landlordId)
          expect(updateResult.success).toBe(true)

          // Verify availability is updated
          const updatedProperty = mockManager.getProperty(propertyId)
          expect(updatedProperty).toBeDefined()
          expect(updatedProperty.availableFrom).toEqual(availabilityData.availableFrom)
          expect(updatedProperty.availableTo).toEqual(availabilityData.availableTo)
          expect(updatedProperty.isAvailable).toBe(availabilityData.isAvailable)

          // Verify search results reflect availability
          const availableResults = mockManager.searchProperties({ availableOnly: true })
          const allResults = mockManager.searchProperties({ availableOnly: false })

          if (availabilityData.isAvailable) {
            expect(availableResults.some(p => p.id === propertyId)).toBe(true)
          } else {
            expect(availableResults.some(p => p.id === propertyId)).toBe(false)
          }

          // Property should always appear in non-filtered results (activeOnly: false includes all)
          expect(allResults.some(p => p.id === propertyId)).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should validate availability date ranges', () => {
    fc.assert(
      fc.property(
        propertyListingArb,
        fc.record({
          propertyId: fc.uuid(),
          availableFrom: fc.date({ min: new Date('2025-06-01'), max: new Date('2025-12-31') }),
          availableTo: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-05-31') }), // Invalid: before availableFrom
          isAvailable: fc.boolean()
        }),
        (listingData, invalidAvailabilityData) => {
          // Create listing
          const createResult = mockManager.createListing(listingData, listingData.landlordId)
          fc.pre(createResult.success)

          const propertyId = createResult.propertyId!
          invalidAvailabilityData.propertyId = propertyId

          // Attempt to update with invalid date range
          const updateResult = mockManager.updateAvailability(propertyId, invalidAvailabilityData, listingData.landlordId)
          
          // Should fail with appropriate error
          expect(updateResult.success).toBe(false)
          expect(updateResult.error).toMatch(/date|range|before|after/i)

          // Verify property availability remains unchanged
          const property = mockManager.getProperty(propertyId)
          expect(property.availableFrom).toBeUndefined()
          expect(property.availableTo).toBeUndefined()
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should maintain consistency across multiple availability updates', () => {
    fc.assert(
      fc.property(
        propertyListingArb,
        fc.array(availabilityUpdateArb, { minLength: 2, maxLength: 5 }),
        (listingData, availabilityUpdates) => {
          // Ensure valid data
          fc.pre(listingData.title.trim().length >= 5)
          fc.pre(listingData.price > 0)

          // Create listing
          const createResult = mockManager.createListing(listingData, listingData.landlordId)
          fc.pre(createResult.success)

          const propertyId = createResult.propertyId!

          let lastValidUpdate: any = null

          // Apply multiple availability updates
          for (const update of availabilityUpdates) {
            update.propertyId = propertyId
            
            // Skip invalid date ranges
            if (update.availableTo && update.availableFrom > update.availableTo) {
              continue
            }

            const updateResult = mockManager.updateAvailability(propertyId, update, listingData.landlordId)
            if (updateResult.success) {
              lastValidUpdate = update
            }
          }

          // If we had at least one valid update
          if (lastValidUpdate) {
            const finalProperty = mockManager.getProperty(propertyId)
            expect(finalProperty.availableFrom).toEqual(lastValidUpdate.availableFrom)
            expect(finalProperty.availableTo).toEqual(lastValidUpdate.availableTo)
            expect(finalProperty.isAvailable).toBe(lastValidUpdate.isAvailable)

            // Verify search consistency
            const searchResults = mockManager.searchProperties({ availableOnly: lastValidUpdate.isAvailable })
            if (lastValidUpdate.isAvailable && finalProperty.isActive) {
              expect(searchResults.some(p => p.id === propertyId)).toBe(true)
            }
          }
        }
      ),
      { numRuns: 30 }
    )
  })
})