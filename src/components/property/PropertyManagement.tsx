'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { propertyService } from '@/lib/property';
import PropertyListingWizard from './PropertyListingWizard';
import PropertyEditForm from './PropertyEditForm';
import PropertyCard from './PropertyCard';

interface PropertyManagementProps {
  landlordId: string;
}

export default function PropertyManagement({ landlordId }: PropertyManagementProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, [landlordId]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getLandlordProperties(landlordId);
      setProperties(data);
    } catch (err) {
      setError('Failed to load properties');
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplete = (property: Property) => {
    setProperties([property, ...properties]);
    setShowCreateWizard(false);
  };

  const handleEditComplete = (updatedProperty: Property) => {
    setProperties(properties.map(p => 
      p.id === updatedProperty.id ? updatedProperty : p
    ));
    setEditingProperty(null);
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    try {
      await propertyService.deleteProperty(propertyId);
      setProperties(properties.filter(p => p.id !== propertyId));
    } catch (err) {
      alert('Failed to delete property');
      console.error('Error deleting property:', err);
    }
  };

  const handleToggleActive = async (property: Property) => {
    try {
      const updatedProperty = await propertyService.updateListing(property.id, {
        isActive: !property.isActive
      });
      setProperties(properties.map(p => 
        p.id === property.id ? updatedProperty : p
      ));
    } catch (err) {
      alert('Failed to update property status');
      console.error('Error updating property:', err);
    }
  };

  if (showCreateWizard) {
    return (
      <PropertyListingWizard
        onComplete={handleCreateComplete}
        onCancel={() => setShowCreateWizard(false)}
      />
    );
  }

  if (editingProperty) {
    return (
      <PropertyEditForm
        property={editingProperty}
        onComplete={handleEditComplete}
        onCancel={() => setEditingProperty(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-600 mt-2">
            Manage your property listings and availability
          </p>
        </div>
        <button
          onClick={() => setShowCreateWizard(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Create New Listing
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first property listing</p>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={() => setEditingProperty(property)}
              onDelete={() => handleDelete(property.id)}
              onToggleActive={() => handleToggleActive(property)}
              showManagementActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}