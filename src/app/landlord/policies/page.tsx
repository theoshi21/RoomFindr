'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PolicyTemplateManager } from '@/components/policy';

export default function LandlordPoliciesPage() {
  const { user } = useAuth();

  if (!user || user.user.role !== 'landlord') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only landlords can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Policy Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage custom policy templates for your properties
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <PolicyTemplateManager landlordId={user.user.id} mode="manage" />
        </div>
      </div>
    </div>
  );
}