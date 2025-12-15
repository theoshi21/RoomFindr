'use client';

import { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import NotificationItem from './NotificationItem';
import type { Notification, NotificationFilters } from '../../types/notification';
import { clientNotificationService } from '../../lib/notification';

interface NotificationListProps {
  userId: string;
  compact?: boolean;
  maxItems?: number;
  showFilters?: boolean;
  onNotificationUpdate?: () => void;
}

export default function NotificationList({ 
  userId, 
  compact = false, 
  maxItems,
  showFilters = true,
  onNotificationUpdate 
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [userId, filters]);

  useEffect(() => {
    // Subscribe to real-time notifications
    const subscription = clientNotificationService.subscribeToNotifications(
      userId,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        if (onNotificationUpdate) {
          onNotificationUpdate();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, onNotificationUpdate]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const fetchFilters = { ...filters };
      if (maxItems) {
        fetchFilters.limit = maxItems;
      }
      
      const data = await clientNotificationService.getUserNotifications(userId, fetchFilters);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    if (onNotificationUpdate) {
      onNotificationUpdate();
    }
  };

  const handleDelete = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
    if (onNotificationUpdate) {
      onNotificationUpdate();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      const success = await clientNotificationService.markAllAsRead(userId);
      if (success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        if (onNotificationUpdate) {
          onNotificationUpdate();
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<NotificationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Actions */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} new
                </span>
              )}
            </h3>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
            >
              <CheckIcon className="h-3 w-3 mr-1" />
              Mark all read
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      {showFilters && !compact && (
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange({ 
              type: e.target.value as any || undefined 
            })}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All types</option>
            <option value="reservation">Reservations</option>
            <option value="payment">Payments</option>
            <option value="verification">Verification</option>
            <option value="announcement">Announcements</option>
          </select>
          
          <select
            value={filters.isRead === undefined ? '' : filters.isRead.toString()}
            onChange={(e) => handleFilterChange({ 
              isRead: e.target.value === '' ? undefined : e.target.value === 'true'
            })}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All notifications</option>
            <option value="false">Unread only</option>
            <option value="true">Read only</option>
          </select>
        </div>
      )}

      {/* Notifications List */}
      <div className={compact ? 'space-y-0 divide-y divide-gray-200' : 'space-y-3'}>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              compact={compact}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {!compact && notifications.length > 0 && (!maxItems || notifications.length >= maxItems) && (
        <div className="text-center">
          <button
            onClick={() => handleFilterChange({ 
              limit: (filters.limit || 10) + 10 
            })}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Load more notifications
          </button>
        </div>
      )}
    </div>
  );
}