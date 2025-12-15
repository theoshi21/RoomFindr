'use client'

import { useState, useEffect } from 'react'
import { SearchFilters } from '@/types/property'
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

interface SearchInterfaceProps {
  onSearch: (filters: SearchFilters) => void
  onFiltersChange: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
}

export default function SearchInterface({ onSearch, onFiltersChange, initialFilters }: SearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {})

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleSearch = () => {
    const searchFilters: SearchFilters = {
      ...filters,
      location: {
        ...filters.location,
        city: searchQuery || filters.location?.city
      }
    }
    onSearch(searchFilters)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePriceRangeChange = (min?: number, max?: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min: min || 0, max: max || 100000 }
    }))
  }

  const handleLocationChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }))
  }

  const handleRoomTypeChange = (roomType: string, checked: boolean) => {
    setFilters(prev => {
      const currentTypes = prev.roomType || []
      if (checked) {
        return {
          ...prev,
          roomType: [...currentTypes, roomType as any]
        }
      } else {
        return {
          ...prev,
          roomType: currentTypes.filter(type => type !== roomType)
        }
      }
    })
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFilters(prev => {
      const currentAmenities = prev.amenities || []
      if (checked) {
        return {
          ...prev,
          amenities: [...currentAmenities, amenity]
        }
      } else {
        return {
          ...prev,
          amenities: currentAmenities.filter(a => a !== amenity)
        }
      }
    })
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const roomTypes = ['single', 'shared', 'studio', 'apartment']
  const commonAmenities = [
    'WiFi', 'Air Conditioning', 'Parking', 'Laundry', 'Kitchen Access',
    'Furnished', 'Security', 'Gym', 'Pool', 'Balcony'
  ]

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Main Search Bar */}
        <div className="flex gap-4 items-center mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by city, location, or property name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (₱)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange?.min || ''}
                    onChange={(e) => handlePriceRangeChange(
                      e.target.value ? parseInt(e.target.value) : undefined,
                      filters.priceRange?.max
                    )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange?.max || ''}
                    onChange={(e) => handlePriceRangeChange(
                      filters.priceRange?.min,
                      e.target.value ? parseInt(e.target.value) : undefined
                    )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={filters.location?.city || ''}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Province"
                    value={filters.location?.province || ''}
                    onChange={(e) => handleLocationChange('province', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type
                </label>
                <div className="space-y-2">
                  {roomTypes.map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.roomType?.includes(type as any) || false}
                        onChange={(e) => handleRoomTypeChange(type, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {commonAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.amenities?.includes(amenity) || false}
                        onChange={(e) => handleAmenityChange(amenity, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear All Filters
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}