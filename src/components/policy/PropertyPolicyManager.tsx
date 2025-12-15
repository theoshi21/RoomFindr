'use client';

import React, { useState, useEffect } from 'react';
import { policyService } from '@/lib/policy';
import PolicyTemplateManager from './PolicyTemplateManager';
import type { PropertyPolicy, PolicyTemplate, PropertyPolicyFormData } from '@/types/policy';

interface PropertyPolicyManagerProps {
  propertyId: string;
  landlordId: string;
  mode?: 'create' | 'edit' | 'view';
  onSave?: (policies: PropertyPolicy[]) => void;
  onCancel?: () => void;
}

export default function PropertyPolicyManager({
  propertyId,
  landlordId,
  mode = 'edit',
  onSave,
  onCancel
}: PropertyPolicyManagerProps) {
  const [policies, setPolicies] = useState<PropertyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PropertyPolicy | null>(null);

  useEffect(() => {
    if (propertyId) {
      loadPolicies();
    }
  }, [propertyId]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const data = await policyService.getPropertyPolicies(propertyId);
      setPolicies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = async (template: PolicyTemplate) => {
    try {
      const policyData: PropertyPolicyFormData = {
        policyId: template.id,
        customValue: template.defaultValue,
        isActive: true
      };
      
      await policyService.addPolicyToProperty(propertyId, policyData);
      await loadPolicies();
      setShowTemplateSelector(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add policy');
    }
  };

  const handleUpdatePolicy = async (policyId: string, data: Partial<PropertyPolicyFormData>) => {
    try {
      await policyService.updatePropertyPolicy(policyId, data);
      await loadPolicies();
      setEditingPolicy(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update policy');
    }
  };

  const handleRemovePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to remove this policy?')) return;
    
    try {
      await policyService.removePropertyPolicy(policyId);
      await loadPolicies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove policy');
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(policies);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Policies</h2>
          <p className="text-gray-600">Manage custom policies for this property</p>
        </div>
        {mode !== 'view' && (
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Policy
          </button>
        )}
      </div>

      {/* Policies List */}
      {policies.length > 0 ? (
        <div className="space-y-4">
          {policies.map(policy => (
            <PropertyPolicyCard
              key={policy.id}
              policy={policy}
              mode={mode}
              onEdit={() => setEditingPolicy(policy)}
              onRemove={() => handleRemovePolicy(policy.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No policies added yet</p>
          {mode !== 'view' && (
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Your First Policy
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {mode !== 'view' && (onSave || onCancel) && (
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          {onSave && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          )}
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Policy Template</h3>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <PolicyTemplateManager
                landlordId={landlordId}
                mode="select"
                onTemplateSelect={handleAddPolicy}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <PolicyEditModal
          policy={editingPolicy}
          onSave={(data) => handleUpdatePolicy(editingPolicy.id, data)}
          onCancel={() => setEditingPolicy(null)}
        />
      )}
    </div>
  );
}

interface PropertyPolicyCardProps {
  policy: PropertyPolicy;
  mode: 'create' | 'edit' | 'view';
  onEdit: () => void;
  onRemove: () => void;
}

function PropertyPolicyCard({ policy, mode, onEdit, onRemove }: PropertyPolicyCardProps) {
  const categoryLabels: Record<string, string> = {
    rental_terms: 'Rental Terms',
    house_rules: 'House Rules',
    maintenance: 'Maintenance',
    security: 'Security',
    utilities: 'Utilities',
    guest_policy: 'Guest Policy',
    pet_policy: 'Pet Policy',
    smoking_policy: 'Smoking Policy',
    cleaning_policy: 'Cleaning Policy',
    cancellation_policy: 'Cancellation Policy',
    custom: 'Custom'
  };

  const categoryLabel = categoryLabels[policy.policy?.category || 'custom'] || 'Custom';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {policy.policy?.title || 'Unknown Policy'}
            </h3>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {categoryLabel}
            </span>
            {!policy.isActive && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {policy.policy?.description}
          </p>
        </div>
        
        {mode !== 'view' && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
            <button
              onClick={onRemove}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Policy Text:</h4>
        <p className="text-sm text-gray-900 whitespace-pre-wrap">
          {policy.customValue || policy.policy?.description || 'No policy text specified'}
        </p>
      </div>
    </div>
  );
}

interface PolicyEditModalProps {
  policy: PropertyPolicy;
  onSave: (data: Partial<PropertyPolicyFormData>) => void;
  onCancel: () => void;
}

function PolicyEditModal({ policy, onSave, onCancel }: PolicyEditModalProps) {
  const [customValue, setCustomValue] = useState(
    policy.customValue || policy.policy?.description || ''
  );
  const [isActive, setIsActive] = useState(policy.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ customValue, isActive });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h3 className="text-lg font-semibold mb-4">
          Edit Policy: {policy.policy?.title}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Text
            </label>
            <textarea
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the policy text for this property..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Policy is active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}