'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationList, NotificationPreferences } from '../../components/notification';
import { supabase } from '../../lib/supabase';

export default function NotificationsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-600">
            Manage your notifications and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preferences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Preferences
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow p-6">
              <NotificationList
                userId={user.id}
                compact={false}
                showFilters={true}
              />
            </div>
          )}

          {activeTab === 'preferences' && (
            <NotificationPreferences
              userId={user.id}
              onSave={(preferences) => {
                console.log('Saving preferences:', preferences);
                // In a real implementation, save to user profile
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}