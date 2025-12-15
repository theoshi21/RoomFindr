'use client';

import { useState, useEffect } from 'react';
import { NotificationList, NotificationBell, AnnouncementCreator } from '../../components/notification';
import { clientNotificationService } from '../../lib/notification';

export default function DemoNotificationsPage() {
  const [demoUserId] = useState('demo-user-123');
  const [activeTab, setActiveTab] = useState<'list' | 'bell' | 'admin'>('list');

  const createDemoNotification = async () => {
    await clientNotificationService.createNotification({
      userId: demoUserId,
      type: 'announcement',
      title: 'Demo Notification',
      message: 'This is a demo notification to test the system',
      metadata: { demo: true }
    });
  };

  const createReservationDemo = async () => {
    await clientNotificationService.createReservationNotification(
      'demo-reservation-123',
      demoUserId,
      'demo-landlord-123',
      'created',
      'Beautiful Studio Apartment'
    );
  };

  const createPaymentDemo = async () => {
    await clientNotificationService.createPaymentNotification(
      demoUserId,
      'completed',
      5000,
      'Beautiful Studio Apartment',
      'demo-transaction-123'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification System Demo</h1>
          <p className="mt-2 text-gray-600">
            Test the real-time notification system components
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Demo Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={createDemoNotification}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Demo Notification
            </button>
            <button
              onClick={createReservationDemo}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Create Reservation Notification
            </button>
            <button
              onClick={createPaymentDemo}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Create Payment Notification
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notification List
            </button>
            <button
              onClick={() => setActiveTab('bell')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bell'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notification Bell
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Admin Announcements
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'list' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification List Component</h3>
              <NotificationList
                userId={demoUserId}
                compact={false}
                showFilters={true}
              />
            </div>
          )}

          {activeTab === 'bell' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Bell Component</h3>
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">Notification Bell:</span>
                  <NotificationBell userId={demoUserId} />
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Click the bell icon to see the dropdown notification list
              </p>
            </div>
          )}

          {activeTab === 'admin' && (
            <div>
              <AnnouncementCreator 
                onAnnouncementSent={() => {
                  console.log('Demo announcement sent');
                }}
              />
            </div>
          )}
        </div>

        {/* Integration Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Integration Notes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Real-time notifications work with Supabase Realtime subscriptions</li>
            <li>• Notification bell shows unread count and dropdown list</li>
            <li>• Admin announcement system broadcasts to multiple users</li>
            <li>• All notification types (reservation, payment, verification, announcement) are supported</li>
            <li>• Components are fully responsive and accessible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}