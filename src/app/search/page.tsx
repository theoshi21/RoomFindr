'use client'

import { useState, useEffect, useCallback } from 'react'
import { Property, SearchFilters } from '@/types/property'
import { propertyService } from '@/lib/property'
import SearchInterface from '@/components/search/SearchInterface'
import SearchResults from '@/components/search/SearchResults'
import PropertyDetailView from '@/components/search/PropertyDetailView'
import MapView from '@/components/search/MapView'

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showMapView, setShowMapView] = useState(false)

  // Load initial properties on page load
  useEffect(() => {
    handleSearch({})
  }, [])

  const handleSearch = useCallback(async (searchFilters: SearchFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const results = await propertyService.searchProperties(searchFilters)
      setProperties(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search properties')
      setProperties([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
  }, [])

  const handlePropertySelect = useCallback((property: Property) => {
    setSelectedProperty(property)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedProperty(null)
  }, [])

  const handleReserve = useCallback((property: Property) => {
    // TODO: Implement reservation logic
    console.log('Reserve property:', property.id)
    alert('Reservation functionality will be implemented in the next task!')
  }, [])

  const handleShowMap = useCallback(() => {
    setShowMapView(!showMapView)
  }, [showMapView])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Interface */}
      <SearchInterface
        onSearch={handleSearch}
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Map View */}
      {showMapView && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Map View</h2>
              <button
                onClick={handleShowMap}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close Map
              </button>
            </div>
            <MapView
              properties={properties}
              onPropertySelect={handlePropertySelect}
              selectedProperty={selectedProperty}
            />
          </div>
        </div>
      )}

      {/* Search Results */}
      {!showMapView && (
        <SearchResults
          properties={properties}
          loading={loading}
          onPropertySelect={handlePropertySelect}
          onShowMap={handleShowMap}
          showMapView={showMapView}
        />
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailView
          property={selectedProperty}
          onClose={handleCloseDetail}
          onReserve={handleReserve}
        />
      )}
    </div>
  )
}