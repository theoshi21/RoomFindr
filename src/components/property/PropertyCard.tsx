'use client';

import React from 'react';
import { Property } from '@/types/property';

interface PropertyCardProps {
  property: Property;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
  showManagementActions?: boolean;
  onClick?: () => void;
}

export default function PropertyCard({ 
  property, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  showManagementActions = false,
  onClick 
}: PropertyCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getRoomTypeLabel = (roomType: string) => {
    const labels = {
      single: 'Single Room',
      shared: 'Shared Room',
      studio: 'Studio',
      apartment: 'Apartment'
    };
    return labels[roomType as keyof typeof labels] || roomType;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.isActive)}`}>
            {property.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Image Count */}
        {property.images && property.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
            +{property.images.length - 1} more
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {property.title}
          </h3>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {property.description}
        </p>

        {/* Location */}
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">
            {property.address.city}, {property.address.province}
          </span>
        </div>

        {/* Room Type and Occupancy */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span className="bg-gray-100 px-2 py-1 rounded">
            {getRoomTypeLabel(property.roomType)}
          </span>
          <span>
            {property.availability.currentOccupancy}/{property.availability.maxOccupancy} occupied
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(property.price)}
            </span>
            <span className="text-gray-600 text-sm">/month</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Deposit</div>
            <div className="font-semibold text-gray-900">
              {formatPrice(property.deposit)}
            </div>
          </div>
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {property.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                >
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="text-gray-500 text-xs px-2 py-1">
                  +{property.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Management Actions */}
        {showManagementActions && (
          <div className="flex space-x-2 pt-3 border-t">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive?.();
              }}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                property.isActive
                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {property.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="px-3 py-2 bg-red-50 text-red-700 rounded text-sm font-medium hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}