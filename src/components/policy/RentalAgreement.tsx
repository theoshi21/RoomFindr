'use client';

import React, { useState, useEffect } from 'react';
import { policyService } from '@/lib/policy';
import type { RentalAgreement, RentalAgreementPolicy } from '@/types/policy';

interface RentalAgreementProps {
  reservationId: string;
  mode?: 'create' | 'view' | 'sign';
  onAccept?: (agreement: RentalAgreement) => void;
  onCancel?: () => void;
}

export default function RentalAgreementComponent({
  reservationId,
  mode = 'view',
  onAccept,
  onCancel
}: RentalAgreementProps) {
  const [agreement, setAgreement] = useState<RentalAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [checkedPolicies, setCheckedPolicies] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAgreement();
  }, [reservationId]);

  const loadAgreement = async () => {
    try {
      setLoading(true);
      let agreementData = await policyService.getRentalAgreement(reservationId);
      
      if (!agreementData && mode === 'create') {
        agreementData = await policyService.createRentalAgreement(reservationId);
      }
      
      setAgreement(agreementData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rental agreement');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAgreement = async () => {
    if (!agreement) return;

    // Check that all required policies are acknowledged
    const requiredPolicies = agreement.policies.filter(p => p.isRequired);
    const allRequiredChecked = requiredPolicies.every(p => checkedPolicies.has(p.policyId));

    if (!allRequiredChecked) {
      setError('Please acknowledge all required policies before accepting the agreement.');
      return;
    }

    try {
      setAccepting(true);
      const updatedAgreement = await policyService.acceptRentalAgreement(agreement.id);
      setAgreement(updatedAgreement);
      if (onAccept) {
        onAccept(updatedAgreement);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept rental agreement');
    } finally {
      setAccepting(false);
    }
  };

  const togglePolicyCheck = (policyId: string) => {
    const newChecked = new Set(checkedPolicies);
    if (newChecked.has(policyId)) {
      newChecked.delete(policyId);
    } else {
      newChecked.add(policyId);
    }
    setCheckedPolicies(newChecked);
  };

  const groupedPolicies = agreement?.policies.reduce((groups, policy) => {
    if (!groups[policy.category]) {
      groups[policy.category] = [];
    }
    groups[policy.category].push(policy);
    return groups;
  }, {} as Record<string, RentalAgreementPolicy[]>) || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="text-red-600 hover:text-red-800 text-sm mt-2"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No rental agreement found.</p>
        {mode === 'create' && (
          <button
            onClick={loadAgreement}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Agreement
          </button>
        )}
      </div>
    );
  }

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
    custom: 'Custom Policies'
  };

  const categoryIcons: Record<string, string> = {
    rental_terms: '📋',
    house_rules: '🏠',
    maintenance: '🔧',
    security: '🔒',
    utilities: '💡',
    guest_policy: '👥',
    pet_policy: '🐕',
    smoking_policy: '🚭',
    cleaning_policy: '🧹',
    cancellation_policy: '❌',
    custom: '📝'
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rental Agreement</h1>
        <p className="text-gray-600">
          Please review all terms and policies before {agreement.termsAccepted ? 'viewing' : 'accepting'} this agreement.
        </p>
        
        {agreement.termsAccepted && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-green-500 text-xl mr-2">✓</span>
              <div>
                <p className="text-green-800 font-medium">Agreement Accepted</p>
                <p className="text-green-700 text-sm">
                  Accepted on {agreement.acceptedAt?.toLocaleDateString()} at {agreement.acceptedAt?.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Agreement Content */}
      <div className="space-y-8">
        {Object.entries(groupedPolicies).map(([category, policies]) => (
          <div key={category} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">{categoryIcons[category] || '📝'}</span>
              <h2 className="text-xl font-semibold text-gray-900">
                {categoryLabels[category] || 'Custom Policies'}
              </h2>
            </div>
            
            <div className="space-y-4">
              {policies.map(policy => (
                <div key={policy.policyId} className="border-l-4 border-l-blue-500 bg-blue-50 p-4 rounded-r-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{policy.title}</h3>
                    {policy.isRequired && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{policy.description}</p>
                  
                  <div className="bg-white rounded-md p-3 mb-3">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{policy.value}</p>
                  </div>

                  {mode === 'sign' && !agreement.termsAccepted && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`policy-${policy.policyId}`}
                        checked={checkedPolicies.has(policy.policyId)}
                        onChange={() => togglePolicyCheck(policy.policyId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label 
                        htmlFor={`policy-${policy.policyId}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        I acknowledge and agree to this {policy.isRequired ? 'required ' : ''}policy
                      </label>
                    </div>
                  )}

                  {policy.acceptedAt && (
                    <div className="flex items-center text-sm text-green-600 mt-2">
                      <span className="mr-1">✓</span>
                      Accepted on {new Date(policy.acceptedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Agreement Summary */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreement Summary</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Policies: <span className="font-medium text-gray-900">{agreement.policies.length}</span></p>
            <p className="text-gray-600">Required Policies: <span className="font-medium text-gray-900">{agreement.policies.filter(p => p.isRequired).length}</span></p>
          </div>
          <div>
            <p className="text-gray-600">Created: <span className="font-medium text-gray-900">{agreement.createdAt.toLocaleDateString()}</span></p>
            <p className="text-gray-600">Status: <span className={`font-medium ${agreement.termsAccepted ? 'text-green-600' : 'text-yellow-600'}`}>
              {agreement.termsAccepted ? 'Accepted' : 'Pending'}
            </span></p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {mode === 'sign' && !agreement.termsAccepted && (
        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleAcceptAgreement}
            disabled={accepting || agreement.policies.filter(p => p.isRequired).some(p => !checkedPolicies.has(p.policyId))}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? 'Accepting...' : 'Accept Agreement'}
          </button>
        </div>
      )}

      {mode === 'view' && agreement.termsAccepted && onCancel && (
        <div className="flex justify-end mt-8 pt-6 border-t">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}