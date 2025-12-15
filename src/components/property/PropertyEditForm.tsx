'use client';

import React, { useState } from 'react';
import { Property, PropertyUpdate } from '@/types/property';
import { propertyService } from '@/lib/property';
import { ImageUploadManager } from './index';

interface PropertyEditFormProps {
  property: Property;
  onComplete: (property: Property) => void;
  onCancel: () => void;
}

export default function PropertyEditForm({ property, onComplete, onCancel }: PropertyEditFormProps) {
  const [formData, setFormData] = useState<PropertyUpdate>({
    title: property.title,
    description: property.description,
    price: property.price,
    deposit: property.deposit,
    amenities: [...property.amenities],
    policies: { ...property.policies },
    availability: { ...property.availability },
    isActive: property.isActive
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const updateFormData = (updates: Partial<PropertyUpdate>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updatePolicies = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      policies: {
        ...prev.policies!,
        [field]: value
      }
    }));
  };

  const updateAvailability = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability!,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedProperty = await propertyService.updateListing(property.id, formData);
      onComplete(updatedProperty);
    } catch (error) {
      console.error('Failed to update property:', error);
      alert('Failed to update property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'pricing', label: 'Pricing & Policies' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'availability', label: 'Availability' },
    { id: 'images', label: 'Images' }
  ];

  const commonAmenities = [
    'WiFi', 'Air Conditioning', 'Kitchen Access', 'Laundry', 'Parking',
    'Security', 'Gym', 'Swimming Pool', 'Balcony', 'Furnished',
    'Near MRT/LRT', 'Near Mall', 'Near Hospital', 'Near School'
  ];

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = formData.amenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    updateFormData({ amenities: updatedAmenities });
  };

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const toggleDay = (day: string) => {
    const currentDays = formData.availability?.availableDays || [];
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    updateAvailability('availableDays', updatedDays);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Property</h1>
        <p className="text-gray-600">Update your property information</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => updateFormData({ isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (visible to tenants)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Pricing & Policies Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rent (₱) *
                  </label>
                  <input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Deposit (₱) *
                  </label>
                  <input
                    type="number"
                    value={formData.deposit || 0}
                    onChange={(e) => updateFormData({ deposit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pet Policy
                </label>
                <textarea
                  value={formData.policies?.petPolicy || ''}
                  onChange={(e) => updatePolicies('petPolicy', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Smoking Policy
                </label>
                <textarea
                  value={formData.policies?.smokingPolicy || ''}
                  onChange={(e) => updatePolicies('smokingPolicy', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guest Policy
                </label>
                <textarea
                  value={formData.policies?.guestPolicy || ''}
                  onChange={(e) => updatePolicies('guestPolicy', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Policy
                </label>
                <textarea
                  value={formData.policies?.cancellationPolicy || ''}
                  onChange={(e) => updatePolicies('cancellationPolicy', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Amenities Tab */}
          {activeTab === 'amenities' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.amenities || []).includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available From
                  </label>
                  <input
                    type="date"
                    value={formData.availability?.startDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateAvailability('startDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.availability?.endDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateAvailability('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Occupancy
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.availability?.maxOccupancy || 1}
                    onChange={(e) => updateAvailability('maxOccupancy', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Occupancy
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.availability?.maxOccupancy || 1}
                    value={formData.availability?.currentOccupancy || 0}
                    onChange={(e) => updateAvailability('currentOccupancy', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Available Days
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {days.map((day) => (
                    <label key={day.key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.availability?.availableDays || []).includes(day.key)}
                        onChange={() => toggleDay(day.key)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <ImageUploadManager propertyId={property.id} currentImages={property.images} />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}