'use client'

import { useState, useEffect } from 'react'
import { Property } from '@/types/property'

interface MapViewProps {
  properties: Property[]
  onPropertySelect?: (property: Property) => void
  selectedProperty?: Property | null
}

// Mock map component since we don't have a real map integration yet
export default function MapView({ properties, onPropertySelect, selectedProperty }: MapViewProps) {
  const [mapCenter, setMapCenter] = useState({ lat: 14.5995, lng: 120.9842 }) // Manila coordinates
  const [zoom, setZoom] = useState(11)

  // Group properties by city for better visualization
  const propertiesByCity = properties.reduce((acc, property) => {
    const city = property.address.city
    if (!acc[city]) {
      acc[city] = []
    }
    acc[city].push(property)
    return acc
  }, {} as Record<string, Property[]>)

  const handlePropertyClick = (property: Property) => {
    onPropertySelect?.(property)
    // Center map on selected property if coordinates are available
    if (property.address.coordinates) {
      setMapCenter({
        lat: property.address.coordinates.lat,
        lng: property.address.coordinates.lng
      })
      setZoom(15)
    }
  }

  return (
    <div className="h-96 bg-gray-100 rounded-lg relative overflow-hidden">
      {/* Mock Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setZoom(Math.min(zoom + 1, 18))}
          className="bg-white shadow-md rounded px-3 py-1 text-lg font-bold hover:bg-gray-50 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setZoom(Math.max(zoom - 1, 1))}
          className="bg-white shadow-md rounded px-3 py-1 text-lg font-bold hover:bg-gray-50 transition-colors"
        >
          −
        </button>
      </div>

      {/* Property Markers */}
      <div className="absolute inset-0 p-8">
        {Object.entries(propertiesByCity).map(([city, cityProperties], cityIndex) => (
          <div key={city} className="relative">
            {cityProperties.map((property, propertyIndex) => {
              const isSelected = selectedProperty?.id === property.id
              // Calculate position based on city and property index for demo purposes
              const x = 20 + (cityIndex * 150) + (propertyIndex * 30)
              const y = 50 + (cityIndex * 80) + (propertyIndex * 20)
              
              return (
                <div
                  key={property.id}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}px`, top: `${y}px` }}
                  onClick={() => handlePropertyClick(property)}
                >
                  {/* Property Marker */}
                  <div
                    className={`relative ${
                      isSelected
                        ? 'bg-red-500 border-red-600'
                        : 'bg-blue-500 border-blue-600'
                    } text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 shadow-lg hover:scale-110 transition-transform`}
                  >
                    ₱{Math.round(property.price / 1000)}k
                  </div>

                  {/* Property Info Popup */}
                  {isSelected && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg p-3 min-w-64 z-20">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900 mb-1">
                          {property.title}
                        </div>
                        <div className="text-gray-600 mb-2">
                          {property.address.city}, {property.address.province}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-600 font-bold">
                            ₱{property.price.toLocaleString()}/mo
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {property.roomType}
                          </span>
                        </div>
                      </div>
                      {/* Arrow pointing down */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-sm">
        <div className="font-semibold text-gray-900 mb-2">Map Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Available Properties</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Selected Property</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Zoom: {zoom}x | Properties: {properties.length}
        </div>
      </div>

      {/* No Properties Message */}
      {properties.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">No properties to display</div>
            <div className="text-sm">Adjust your search filters to see properties on the map</div>
          </div>
        </div>
      )}

      {/* Mock Map Attribution */}
      <div className="absolute bottom-1 right-1 text-xs text-gray-400 bg-white bg-opacity-75 px-1 rounded">
        Mock Map View
      </div>
    </div>
  )
}