'use client';

import React, { useState, useEffect } from 'react';
import { policyService } from '@/lib/policy';
import type { PolicyUpdate } from '@/types/policy';

interface PolicyUpdateNotificationProps {
  propertyId: string;
  onClose?: () => void;
}

export default function PolicyUpdateNotification({ 
  propertyId, 
  onClose 
}: PolicyUpdateNotificationProps) {
  const [updates, setUpdates] = useState<PolicyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPolicyUpdates();
  }, [propertyId]);

  const loadPolicyUpdates = async () => {
    try {
      setLoading(true);
      const data = await policyService.getPolicyUpdates(propertyId);
      // Show only recent updates (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUpdates = data.filter(update => 
        new Date(update.updatedAt) > thirtyDaysAgo
      );
      setUpdates(recentUpdates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policy updates');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <p className="text-blue-800 text-sm">Loading policy updates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  if (updates.length === 0) {
    return null; // Don't show anything if no recent updates
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <span className="text-yellow-500 text-xl mr-2">⚠️</span>
          <div className="flex-1">
            <h3 className="text-yellow-800 font-medium mb-2">
              Recent Policy Updates
            </h3>
            <p className="text-yellow-700 text-sm mb-3">
              The landlord has updated {updates.length} {updates.length === 1 ? 'policy' : 'policies'} 
              for this property. Please review the changes below.
            </p>
            
            <div className="space-y-3">
              {updates.map(update => (
                <PolicyUpdateItem key={update.id} update={update} />
              ))}
            </div>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-yellow-400 hover:text-yellow-600 ml-4"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface PolicyUpdateItemProps {
  update: PolicyUpdate;
}

function PolicyUpdateItem({ update }: PolicyUpdateItemProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white border border-yellow-200 rounded-md p-3">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm">Policy Updated</h4>
        <span className="text-xs text-gray-500">
          {formatDate(update.updatedAt)}
        </span>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-600 mb-1">Previous:</p>
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <p className="text-sm text-gray-800 line-clamp-2">
              {update.oldValue || 'No previous value'}
            </p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 mb-1">Updated to:</p>
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <p className="text-sm text-gray-800 line-clamp-2">
              {update.newValue}
            </p>
          </div>
        </div>
      </div>
      
      {(update.oldValue.length > 100 || update.newValue.length > 100) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-800 mt-2"
        >
          {expanded ? 'Show Less' : 'Show Full Changes'}
        </button>
      )}
      
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Full Previous Value:</p>
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {update.oldValue || 'No previous value'}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Full Updated Value:</p>
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {update.newValue}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for use in notifications list
export function CompactPolicyUpdateNotification({ 
  propertyId, 
  className = '' 
}: { 
  propertyId: string; 
  className?: string; 
}) {
  const [updateCount, setUpdateCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpdateCount();
  }, [propertyId]);

  const loadUpdateCount = async () => {
    try {
      const updates = await policyService.getPolicyUpdates(propertyId);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCount = updates.filter(update => 
        new Date(update.updatedAt) > thirtyDaysAgo
      ).length;
      setUpdateCount(recentCount);
    } catch (err) {
      console.error('Failed to load policy update count:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || updateCount === 0) {
    return null;
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs ${className}`}>
      <span className="mr-1">⚠️</span>
      {updateCount} policy update{updateCount !== 1 ? 's' : ''}
    </div>
  );
}