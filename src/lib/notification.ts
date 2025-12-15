import { supabase, createClientComponentClient } from './supabase';
import type { 
  Notification, 
  CreateNotificationData, 
  NotificationFilters, 
  AnnouncementData,
  NotificationPreferences 
} from '../types/notification';
import type { Database } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export class NotificationService {
  private client: SupabaseClient<Database>;

  constructor(clientSide = false) {
    this.client = clientSide ? createClientComponentClient() : supabase;
  }

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData): Promise<Notification | null> {
    try {
      const { data: notification, error } = await this.client
        .from('notifications')
        .insert({
          user_id: data.userId,
          notification_type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata || null,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return this.mapDatabaseNotification(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string, 
    filters: NotificationFilters = {}
  ): Promise<Notification[]> {
    try {
      let query = this.client
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters.type) {
        query = query.eq('notification_type', filters.type);
      }

      if (filters.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data: notifications, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return notifications?.map(this.mapDatabaseNotification) || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.client
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToNotifications(
    userId: string, 
    callback: (notification: Notification) => void
  ) {
    return this.client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const notification = this.mapDatabaseNotification(payload.new as any);
          callback(notification);
        }
      )
      .subscribe();
  }

  /**
   * Create announcement for multiple users
   */
  async createAnnouncement(data: AnnouncementData): Promise<boolean> {
    try {
      // Get users based on target role
      let userQuery = this.client.from('users').select('id');
      
      if (data.targetRole && data.targetRole !== 'all') {
        userQuery = userQuery.eq('role', data.targetRole);
      }

      const { data: users, error: userError } = await userQuery;

      if (userError) {
        console.error('Error fetching users for announcement:', userError);
        return false;
      }

      if (!users || users.length === 0) {
        return true; // No users to notify
      }

      // Create notifications for all target users
      const notifications = users.map((user: any) => ({
        user_id: user.id,
        notification_type: 'announcement' as const,
        title: data.title,
        message: data.message,
        metadata: data.metadata || null,
        is_read: false,
      }));

      const { error } = await this.client
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating announcement notifications:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating announcement:', error);
      return false;
    }
  }

  /**
   * Create reservation-related notifications
   */
  async createReservationNotification(
    reservationId: string,
    tenantId: string,
    landlordId: string,
    type: 'created' | 'confirmed' | 'cancelled' | 'completed',
    propertyTitle: string
  ): Promise<boolean> {
    try {
      const notifications: CreateNotificationData[] = [];

      switch (type) {
        case 'created':
          notifications.push({
            userId: landlordId,
            type: 'reservation',
            title: 'New Reservation Request',
            message: `You have a new reservation request for "${propertyTitle}"`,
            metadata: { reservationId, propertyTitle, action: 'created' }
          });
          notifications.push({
            userId: tenantId,
            type: 'reservation',
            title: 'Reservation Submitted',
            message: `Your reservation request for "${propertyTitle}" has been submitted`,
            metadata: { reservationId, propertyTitle, action: 'created' }
          });
          break;

        case 'confirmed':
          notifications.push({
            userId: tenantId,
            type: 'reservation',
            title: 'Reservation Confirmed',
            message: `Your reservation for "${propertyTitle}" has been confirmed`,
            metadata: { reservationId, propertyTitle, action: 'confirmed' }
          });
          break;

        case 'cancelled':
          notifications.push({
            userId: tenantId,
            type: 'reservation',
            title: 'Reservation Cancelled',
            message: `Your reservation for "${propertyTitle}" has been cancelled`,
            metadata: { reservationId, propertyTitle, action: 'cancelled' }
          });
          notifications.push({
            userId: landlordId,
            type: 'reservation',
            title: 'Reservation Cancelled',
            message: `A reservation for "${propertyTitle}" has been cancelled`,
            metadata: { reservationId, propertyTitle, action: 'cancelled' }
          });
          break;

        case 'completed':
          notifications.push({
            userId: tenantId,
            type: 'reservation',
            title: 'Reservation Completed',
            message: `Your stay at "${propertyTitle}" has been completed`,
            metadata: { reservationId, propertyTitle, action: 'completed' }
          });
          notifications.push({
            userId: landlordId,
            type: 'reservation',
            title: 'Reservation Completed',
            message: `The reservation for "${propertyTitle}" has been completed`,
            metadata: { reservationId, propertyTitle, action: 'completed' }
          });
          break;
      }

      // Create all notifications
      for (const notificationData of notifications) {
        await this.createNotification(notificationData);
      }

      return true;
    } catch (error) {
      console.error('Error creating reservation notifications:', error);
      return false;
    }
  }

  /**
   * Create payment-related notifications
   */
  async createPaymentNotification(
    userId: string,
    type: 'completed' | 'failed' | 'refunded',
    amount: number,
    propertyTitle: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      let title: string;
      let message: string;

      switch (type) {
        case 'completed':
          title = 'Payment Successful';
          message = `Your payment of ₱${amount.toLocaleString()} for "${propertyTitle}" has been processed successfully`;
          break;
        case 'failed':
          title = 'Payment Failed';
          message = `Your payment of ₱${amount.toLocaleString()} for "${propertyTitle}" could not be processed`;
          break;
        case 'refunded':
          title = 'Refund Processed';
          message = `Your refund of ₱${amount.toLocaleString()} for "${propertyTitle}" has been processed`;
          break;
      }

      await this.createNotification({
        userId,
        type: 'payment',
        title,
        message,
        metadata: { transactionId, amount, propertyTitle, action: type }
      });

      return true;
    } catch (error) {
      console.error('Error creating payment notification:', error);
      return false;
    }
  }

  /**
   * Create verification-related notifications
   */
  async createVerificationNotification(
    landlordId: string,
    type: 'submitted' | 'approved' | 'rejected',
    feedback?: string
  ): Promise<boolean> {
    try {
      let title: string;
      let message: string;

      switch (type) {
        case 'submitted':
          title = 'Verification Documents Submitted';
          message = 'Your verification documents have been submitted and are under review';
          break;
        case 'approved':
          title = 'Verification Approved';
          message = 'Your landlord verification has been approved. You can now create property listings';
          break;
        case 'rejected':
          title = 'Verification Rejected';
          message = feedback 
            ? `Your verification was rejected: ${feedback}` 
            : 'Your verification was rejected. Please resubmit with correct documents';
          break;
      }

      await this.createNotification({
        userId: landlordId,
        type: 'verification',
        title,
        message,
        metadata: { action: type, feedback }
      });

      return true;
    } catch (error) {
      console.error('Error creating verification notification:', error);
      return false;
    }
  }

  /**
   * Map database notification to application notification
   */
  private mapDatabaseNotification(dbNotification: any): Notification {
    return {
      id: dbNotification.id,
      userId: dbNotification.user_id,
      type: dbNotification.notification_type,
      title: dbNotification.title,
      message: dbNotification.message,
      isRead: dbNotification.is_read,
      metadata: dbNotification.metadata,
      createdAt: new Date(dbNotification.created_at),
    };
  }
}

// Export singleton instances
export const notificationService = new NotificationService();
export const clientNotificationService = new NotificationService(true);