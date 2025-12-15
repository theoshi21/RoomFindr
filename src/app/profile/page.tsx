'use client'

import React from 'react'
import { ProfileManager } from '../../components/profile/ProfileManager'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-2 text-gray-600">
              Manage your profile information, avatar, and preferences.
            </p>
          </div>
          
          <ProfileManager 
            showEmail={true}
            showRole={true}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}