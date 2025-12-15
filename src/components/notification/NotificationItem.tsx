'use client';

import { useState } from 'react';
import { 
  BellIcon, 
  CreditCardIcon, 
  HomeIcon, 
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  BellIcon as BellSolidIcon,
  CreditCardIcon as CreditCardSolidIcon,
  HomeIcon as HomeSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon
} from '@heroicons/react/24/solid';
import type { Notification } from '../../types/notification';
import { clientNotificationService } from '../../lib/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export default function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  compact = false 
}: NotificationItemProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getNotificationIcon = (type: string, isRead: boolean) => {
    const iconClass = `h-5 w-5 ${isRead ? 'text-gray-400' : 'text-blue-500'}`;
    
    switch (type) {
      case 'reservation':
        return isRead ? 
          <HomeSolidIcon className={iconClass} /> : 
          <HomeIcon className={iconClass} />;
      case 'payment':
        return isRead ? 
          <CreditCardSolidIcon className={iconClass} /> : 
          <CreditCardIcon className={iconClass} />;
      case 'verification':
        return isRead ? 
          <CheckCircleSolidIcon className={iconClass} /> : 
          <CheckCircleIcon className={iconClass} />;
      case 'announcement':
      default:
        return isRead ? 
          <BellSolidIcon className={iconClass} /> : 
          <BellIcon className={iconClass} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'reservation':
        return 'Reservation';
      case 'payment':
        return 'Payment';
      case 'verification':
        return 'Verification';
      case 'announcement':
        return 'Announcement';
      default:
        return 'Notification';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async () => {
    if (notification.isRead || isLoading) return;
    
    setIsLoading(true);
    try {
      const success = await clientNotificationService.markAsRead(notification.id);
      if (success && onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const success = await clientNotificationService.deleteNotification(notification.id);
      if (success && onDelete) {
        onDelete(notification.id);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div 
        className={`flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
          !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
        }`}
        onClick={handleMarkAsRead}
      >
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type, notification.isRead)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${
            notification.isRead ? 'text-gray-600' : 'text-gray-900'
          }`}>
            {notification.title}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {notification.message}
          </p>
        </div>
        <div className="flex-shrink-0 text-xs text-gray-400">
          {formatTimeAgo(notification.createdAt)}
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      !notification.isRead 
        ? 'bg-blue-50 border-blue-200 shadow-sm' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type, notification.isRead)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                notification.isRead 
                  ? 'bg-gray-100 text-gray-600' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {getTypeLabel(notification.type)}
              </span>
              <div className="flex items-center text-xs text-gray-500">
                <ClockIcon className="h-3 w-3 mr-1" />
                {formatTimeAgo(notification.createdAt)}
              </div>
            </div>
            
            <h4 className={`text-sm font-medium mb-1 ${
              notification.isRead ? 'text-gray-700' : 'text-gray-900'
            }`}>
              {notification.title}
            </h4>
            
            <p className={`text-sm ${
              notification.isRead ? 'text-gray-600' : 'text-gray-700'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {!notification.isRead && (
            <button
              onClick={handleMarkAsRead}
              disabled={isLoading}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              title="Mark as read"
            >
              Mark read
            </button>
          )}
          
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Delete notification"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}