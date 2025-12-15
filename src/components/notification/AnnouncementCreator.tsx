'use client';

import { useState } from 'react';
import { SpeakerWaveIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { AnnouncementData } from '../../types/notification';
import { clientNotificationService } from '../../lib/notification';

interface AnnouncementCreatorProps {
  onAnnouncementSent?: () => void;
}

export default function AnnouncementCreator({ onAnnouncementSent }: AnnouncementCreatorProps) {
  const [formData, setFormData] = useState<AnnouncementData>({
    title: '',
    message: '',
    targetRole: 'all',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof AnnouncementData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear success/error states when user starts typing
    if (success) setSuccess(false);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Please fill in both title and message');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await clientNotificationService.createAnnouncement(formData);
      
      if (success) {
        setSuccess(true);
        setFormData({
          title: '',
          message: '',
          targetRole: 'all',
        });
        
        if (onAnnouncementSent) {
          onAnnouncementSent();
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to send announcement. Please try again.');
      }
    } catch (err) {
      console.error('Error sending announcement:', err);
      setError('An error occurred while sending the announcement');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrators';
      case 'tenant':
        return 'Tenants';
      case 'landlord':
        return 'Landlords';
      case 'all':
      default:
        return 'All Users';
    }
  };

  const getRoleCount = (role: string) => {
    // In a real implementation, you would fetch actual user counts
    switch (role) {
      case 'admin':
        return '5 users';
      case 'tenant':
        return '1,234 users';
      case 'landlord':
        return '456 users';
      case 'all':
      default:
        return '1,695 users';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <SpeakerWaveIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Send Announcement</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Send important updates and announcements to users
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Success Message */}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Announcement sent successfully!
                </p>
                <p className="mt-1 text-sm text-green-700">
                  Your announcement has been delivered to all selected users.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
          </label>
          <select
            value={formData.targetRole}
            onChange={(e) => handleInputChange('targetRole', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Users</option>
            <option value="tenant">Tenants Only</option>
            <option value="landlord">Landlords Only</option>
            <option value="admin">Administrators Only</option>
          </select>
          <div className="mt-1 flex items-center text-sm text-gray-500">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            Will be sent to {getRoleCount(formData.targetRole || 'all')}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Announcement Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter announcement title..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={100}
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {formData.title.length}/100 characters
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Enter your announcement message..."
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={500}
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {formData.message.length}/500 characters
          </div>
        </div>

        {/* Preview */}
        {(formData.title || formData.message) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <div className="flex items-start space-x-3">
                <SpeakerWaveIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      Announcement
                    </span>
                    <span className="text-xs text-gray-500">
                      To: {getRoleLabel(formData.targetRole || 'all')}
                    </span>
                  </div>
                  {formData.title && (
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {formData.title}
                    </h4>
                  )}
                  {formData.message && (
                    <p className="text-sm text-gray-700">
                      {formData.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.message.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
}