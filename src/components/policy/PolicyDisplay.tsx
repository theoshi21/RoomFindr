'use client';

import React, { useState, useEffect } from 'react';
import { policyService } from '@/lib/policy';
import type { PropertyPolicy, PolicyCategory } from '@/types/policy';

interface PolicyDisplayProps {
  propertyId: string;
  mode?: 'listing' | 'reservation' | 'agreement';
  showCategory?: boolean;
  compact?: boolean;
  className?: string;
}

const CATEGORY_ICONS: Record<PolicyCategory, string> = {
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

const CATEGORY_LABELS: Record<PolicyCategory, string> = {
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

export default function PolicyDisplay({
  propertyId,
  mode = 'listing',
  showCategory = true,
  compact = false,
  className = ''
}: PolicyDisplayProps) {
  const [policies, setPolicies] = useState<PropertyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPolicies, setExpandedPolicies] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPolicies();
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

  const toggleExpanded = (policyId: string) => {
    const newExpanded = new Set(expandedPolicies);
    if (newExpanded.has(policyId)) {
      newExpanded.delete(policyId);
    } else {
      newExpanded.add(policyId);
    }
    setExpandedPolicies(newExpanded);
  };

  const groupedPolicies = policies.reduce((groups, policy) => {
    const category = policy.policy?.category || 'custom';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(policy);
    return groups;
  }, {} as Record<PolicyCategory, PropertyPolicy[]>);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-gray-500 text-sm">No policies specified for this property.</p>
      </div>
    );
  }

  const renderModeTitle = () => {
    switch (mode) {
      case 'listing':
        return 'Property Policies';
      case 'reservation':
        return 'Rental Policies & Terms';
      case 'agreement':
        return 'Rental Agreement Terms';
      default:
        return 'Policies';
    }
  };

  const renderCompactView = () => (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">{renderModeTitle()}</h3>
      <div className="grid gap-2 md:grid-cols-2">
        {policies.map(policy => (
          <div key={policy.id} className="bg-gray-50 rounded-md p-3">
            <div className="flex items-center space-x-2 mb-1">
              {showCategory && policy.policy?.category && (
                <span className="text-lg">
                  {CATEGORY_ICONS[policy.policy.category]}
                </span>
              )}
              <h4 className="font-medium text-gray-900 text-sm">
                {policy.policy?.title}
              </h4>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">
              {policy.customValue || policy.policy?.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFullView = () => (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">{renderModeTitle()}</h3>
        <span className="text-sm text-gray-500">
          {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
        </span>
      </div>

      {showCategory ? (
        <div className="space-y-6">
          {Object.entries(groupedPolicies).map(([category, categoryPolicies]) => (
            <div key={category}>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">{CATEGORY_ICONS[category as PolicyCategory]}</span>
                <h4 className="text-lg font-medium text-gray-900">
                  {CATEGORY_LABELS[category as PolicyCategory]}
                </h4>
              </div>
              <div className="space-y-3">
                {categoryPolicies.map(policy => (
                  <PolicyCard
                    key={policy.id}
                    policy={policy}
                    mode={mode}
                    isExpanded={expandedPolicies.has(policy.id)}
                    onToggleExpanded={() => toggleExpanded(policy.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map(policy => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              mode={mode}
              isExpanded={expandedPolicies.has(policy.id)}
              onToggleExpanded={() => toggleExpanded(policy.id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return compact ? renderCompactView() : renderFullView();
}

interface PolicyCardProps {
  policy: PropertyPolicy;
  mode: 'listing' | 'reservation' | 'agreement';
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

function PolicyCard({ policy, mode, isExpanded, onToggleExpanded }: PolicyCardProps) {
  const policyText = policy.customValue || policy.policy?.description || '';
  const shouldTruncate = policyText.length > 200;
  const displayText = isExpanded || !shouldTruncate 
    ? policyText 
    : `${policyText.substring(0, 200)}...`;

  const getCardStyle = () => {
    switch (mode) {
      case 'agreement':
        return 'border-l-4 border-l-blue-500 bg-blue-50 border border-blue-200';
      case 'reservation':
        return 'border-l-4 border-l-green-500 bg-green-50 border border-green-200';
      default:
        return 'bg-white border border-gray-200';
    }
  };

  return (
    <div className={`rounded-lg p-4 ${getCardStyle()}`}>
      <div className="flex justify-between items-start mb-2">
        <h5 className="font-medium text-gray-900">
          {policy.policy?.title || 'Policy'}
        </h5>
        {mode === 'agreement' && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            Required
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
        {displayText}
      </p>
      
      {shouldTruncate && (
        <button
          onClick={onToggleExpanded}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </div>
  );
}

// Specialized components for different contexts
export function ListingPolicyDisplay({ propertyId, className }: { propertyId: string; className?: string }) {
  return (
    <PolicyDisplay
      propertyId={propertyId}
      mode="listing"
      showCategory={true}
      compact={false}
      className={className}
    />
  );
}

export function ReservationPolicyDisplay({ propertyId, className }: { propertyId: string; className?: string }) {
  return (
    <PolicyDisplay
      propertyId={propertyId}
      mode="reservation"
      showCategory={true}
      compact={false}
      className={className}
    />
  );
}

export function CompactPolicyDisplay({ propertyId, className }: { propertyId: string; className?: string }) {
  return (
    <PolicyDisplay
      propertyId={propertyId}
      mode="listing"
      showCategory={false}
      compact={true}
      className={className}
    />
  );
}