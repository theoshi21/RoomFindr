'use client'

import { useState } from 'react'
import { Property } from '@/types/property'
import PropertyCard from '@/components/property/PropertyCard'
import { 
  Squares2X2Icon, 
  ListBulletIcon, 
  MapIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline'

interface SearchResultsProps {
  properties: Property[]
  loading?: boolean
  onPropertySelect?: (property: Property) => void
  onShowMap?: () => void
  showMapView?: boolean
}

type ViewMode = 'grid' | 'list' | 'map'

export default function SearchResults({ 
  properties, 
  loading = false, 
  onPropertySelect,
  onShowMap,
  showMapView = false
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortedProperties = [...properties].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'price':
        comparison = a.price - b.price
        break
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'rating':
        // For now, use a placeholder rating based on property ID
        comparison = 0
        break
      default:
        comparison = 0
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Search Results
          </h2>
          <p className="text-gray-600 mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
                setSortBy(newSortBy)
                setSortOrder(newSortOrder)
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              } transition-colors`}
              title="Grid View"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 border-l border-gray-300 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              } transition-colors`}
              title="List View"
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
            {onShowMap && (
              <button
                onClick={onShowMap}
                className={`p-2 border-l border-gray-300 ${
                  showMapView
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                } transition-colors`}
                title="Map View"
              >
                <MapIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Content */}
      {properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or filters to find more results.
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onClick={() => onPropertySelect?.(property)}
                />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-4">
              {sortedProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onPropertySelect?.(property)}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Property Image */}
                    <div className="sm:w-64 h-48 sm:h-auto">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-t-lg sm:rounded-l-lg sm:rounded-t-none">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {property.title}
                        </h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            ₱{property.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">per month</div>
                        </div>
                      </div>

                      <div className="text-gray-600 mb-2">
                        {property.address.city}, {property.address.province}
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {property.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {property.roomType}
                        </span>
                        {property.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{property.amenities.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <div>
                          Available: {property.availability.currentOccupancy}/{property.availability.maxOccupancy} occupied
                        </div>
                        <div>
                          Listed {new Date(property.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}