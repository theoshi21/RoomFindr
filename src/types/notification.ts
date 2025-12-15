export interface Notification {
  id: string;
  userId: string;
  type: 'reservation' | 'payment' | 'announcement' | 'verification';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  reservationUpdates: boolean;
  paymentNotifications: boolean;
  announcements: boolean;
  verificationUpdates: boolean;
}

export interface CreateNotificationData {
  userId: string;
  type: 'reservation' | 'payment' | 'announcement' | 'verification';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  type?: 'reservation' | 'payment' | 'announcement' | 'verification';
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export interface AnnouncementData {
  title: string;
  message: string;
  targetRole?: 'admin' | 'tenant' | 'landlord' | 'all';
  metadata?: Record<string, any>;
}