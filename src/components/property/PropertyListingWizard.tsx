'use client';

import React, { useState } from 'react';
import { PropertyListing } from '@/types/property';
import { propertyService } from '@/lib/property';

interface Step {
  id: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Property title, description, and type'
  },
  {
    id: 'location',
    title: 'Location Details',
    description: 'Address and location information'
  },
  {
    id: 'pricing',
    title: 'Pricing & Policies',
    description: 'Rent, deposit, and rental policies'
  },
  {
    id: 'amenities',
    title: 'Amenities & Features',
    description: 'Property amenities and features'
  },
  {
    id: 'availability',
    title: 'Availability',
    description: 'Occupancy and availability schedule'
  },
  {
    id: 'images',
    title: 'Images',
    description: 'Upload property photos'
  }
];

interface PropertyListingWizardProps {
  onComplete: (property: any) => void;
  onCancel: () => void;
}

export default function PropertyListingWizard({ onComplete, onCancel }: PropertyListingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<PropertyListing>>({
    title: '',
    description: '',
    roomType: 'single',
    price: 0,
    deposit: 0,
    amenities: [],
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: ''
    },
    policies: {
      petPolicy: '',
      smokingPolicy: '',
      guestPolicy: '',
      cleaningPolicy: '',
      cancellationPolicy: '',
      customPolicies: []
    },
    availability: {
      startDate: new Date(),
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      maxOccupancy: 1,
      currentOccupancy: 0
    }
  });
  const [images, setImages] = useState<File[]>([]);

  const updateFormData = (updates: Partial<PropertyListing>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.address?.street) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const property = await propertyService.createListing(formData as PropertyListing);
      
      // Upload images if any
      if (images.length > 0) {
        await propertyService.uploadPropertyImages(property.id, images);
      }
      
      onComplete(property);
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert('Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'basic':
        return <BasicInfoStep formData={formData} updateFormData={updateFormData} />;
      case 'location':
        return <LocationStep formData={formData} updateFormData={updateFormData} />;
      case 'pricing':
        return <PricingStep formData={formData} updateFormData={updateFormData} />;
      case 'amenities':
        return <AmenitiesStep formData={formData} updateFormData={updateFormData} />;
      case 'availability':
        return <AvailabilityStep formData={formData} updateFormData={updateFormData} />;
      case 'images':
        return <ImagesStep images={images} setImages={setImages} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Property Listing</h1>
        <p className="text-gray-600">Follow the steps below to create your property listing</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <div className="ml-3 min-w-0">
                <p className={`text-sm font-medium ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-600">{steps[currentStep].description}</p>
        </div>
        
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Previous
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function BasicInfoStep({ formData, updateFormData }: any) {
  return (
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
          placeholder="e.g., Cozy Studio Apartment in Makati"
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
          placeholder="Describe your property, its features, and what makes it special..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Room Type *
        </label>
        <select
          value={formData.roomType || 'single'}
          onChange={(e) => updateFormData({ roomType: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="single">Single Room</option>
          <option value="shared">Shared Room</option>
          <option value="studio">Studio</option>
          <option value="apartment">Apartment</option>
        </select>
      </div>
    </div>
  );
}

function LocationStep({ formData, updateFormData }: any) {
  const updateAddress = (field: string, value: string) => {
    updateFormData({
      address: {
        ...formData.address,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Street Address *
        </label>
        <input
          type="text"
          value={formData.address?.street || ''}
          onChange={(e) => updateAddress('street', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 123 Main Street, Barangay San Antonio"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.address?.city || ''}
            onChange={(e) => updateAddress('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Makati"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Province *
          </label>
          <input
            type="text"
            value={formData.address?.province || ''}
            onChange={(e) => updateAddress('province', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Metro Manila"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Postal Code
        </label>
        <input
          type="text"
          value={formData.address?.postalCode || ''}
          onChange={(e) => updateAddress('postalCode', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 1200"
        />
      </div>
    </div>
  );
}

function PricingStep({ formData, updateFormData }: any) {
  const updatePolicies = (field: string, value: string) => {
    updateFormData({
      policies: {
        ...formData.policies,
        [field]: value
      }
    });
  };

  return (
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
            placeholder="15000"
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
            placeholder="15000"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-2">Basic Policies</h4>
        <p className="text-sm text-gray-600 mb-4">
          Set basic policies for your property. You can add more detailed custom policies after creating the listing.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pet Policy
            </label>
            <textarea
              value={formData.policies?.petPolicy || ''}
              onChange={(e) => updatePolicies('petPolicy', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Small pets allowed with additional deposit"
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
              placeholder="e.g., No smoking inside the property"
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
              placeholder="e.g., Guests allowed until 10 PM"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AmenitiesStep({ formData, updateFormData }: any) {
  const commonAmenities = [
    'WiFi', 'Air Conditioning', 'Kitchen Access', 'Laundry', 'Parking',
    'Security', 'Gym', 'Swimming Pool', 'Balcony', 'Furnished',
    'Near MRT/LRT', 'Near Mall', 'Near Hospital', 'Near School'
  ];

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = formData.amenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a: string) => a !== amenity)
      : [...currentAmenities, amenity];
    
    updateFormData({ amenities: updatedAmenities });
  };

  return (
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
  );
}

function AvailabilityStep({ formData, updateFormData }: any) {
  const updateAvailability = (field: string, value: any) => {
    updateFormData({
      availability: {
        ...formData.availability,
        [field]: value
      }
    });
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
      ? currentDays.filter((d: string) => d !== day)
      : [...currentDays, day];
    
    updateAvailability('availableDays', updatedDays);
  };

  return (
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
  );
}

function ImagesStep({ images, setImages }: any) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages([...images, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Images
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="text-gray-600">
              <p className="text-lg mb-2">Click to upload images</p>
              <p className="text-sm">PNG, JPG, GIF up to 10MB each</p>
            </div>
          </label>
        </div>
      </div>

      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Selected Images ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image: File, index: number) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">{image.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}