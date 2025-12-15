import { supabase } from '@/lib/supabase'
import { 
  Reservation, 
  ReservationData, 
  CancellationResult, 
  Transaction 
} from '@/types/reservation'
import type { Database } from '@/types/database'

type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

// Using imported supabase client

export interface ReservationAPI {
  createReservation(data: ReservationData): Promise<Reservation>
  confirmReservation(id: string): Promise<Reservation>
  cancelReservation(id: string, reason: string): Promise<CancellationResult>
  getReservations(userId: string): Promise<Reservation[]>
  getReservationById(id: string): Promise<Reservation | null>
  updateReservationStatus(id: string, status: Reservation['status']): Promise<Reservation>
  processPayment(reservationId: string, paymentMethod: string, paymentReference?: string): Promise<Transaction>
}

export class ReservationService implements ReservationAPI {
  
  async createReservation(data: ReservationData): Promise<Reservation> {
    try {
      // Get property details to validate and get landlord ID
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', data.propertyId)
        .single()

      if (propertyError || !property) {
        throw new Error('Property not found')
      }

      // Check availability
      if (property.current_occupancy >= property.max_occupancy) {
        throw new Error('Property is at full capacity')
      }

      // Create reservation record
      const reservationData: ReservationInsert = {
        property_id: data.propertyId,
        tenant_id: data.tenantId,
        landlord_id: property.landlord_id,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate?.toISOString() || null,
        status: 'pending',
        payment_status: 'pending',
        total_amount: data.totalAmount,
        deposit_amount: data.depositAmount
      }

      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert(reservationData)
        .select()
        .single()

      if (reservationError) {
        throw new Error(`Failed to create reservation: ${reservationError.message}`)
      }

      // Create notification for landlord
      await this.createNotification(
        property.landlord_id,
        'reservation',
        'New Reservation Request',
        `You have a new reservation request for ${property.title}`,
        { reservationId: reservation.id, propertyId: property.id }
      )

      return this.mapDatabaseReservation(reservation)
    } catch (error) {
      console.error('Error creating reservation:', error)
      throw error
    }
  }

  async confirmReservation(id: string): Promise<Reservation> {
    try {
      // Update reservation status
      const { data: reservation, error } = await supabase
        .from('reservations')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to confirm reservation: ${error.message}`)
      }

      // Update property occupancy
      const { data: property } = await supabase
        .from('properties')
        .select('current_occupancy')
        .eq('id', reservation.property_id)
        .single()
      
      if (property) {
        await supabase
          .from('properties')
          .update({ 
            current_occupancy: property.current_occupancy + 1
          })
          .eq('id', reservation.property_id)
      }

      // Create notifications
      await this.createNotification(
        reservation.tenant_id,
        'reservation',
        'Reservation Confirmed',
        'Your reservation has been confirmed by the landlord',
        { reservationId: reservation.id }
      )

      return this.mapDatabaseReservation(reservation)
    } catch (error) {
      console.error('Error confirming reservation:', error)
      throw error
    }
  }

  async cancelReservation(id: string, reason: string): Promise<CancellationResult> {
    try {
      // Get reservation details
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !reservation) {
        throw new Error('Reservation not found')
      }

      // Calculate refund amount based on cancellation policy
      const refundAmount = this.calculateRefundAmount(reservation, reason)

      // Update reservation status
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        throw new Error(`Failed to cancel reservation: ${updateError.message}`)
      }

      // Process refund if applicable
      if (refundAmount > 0 && reservation.payment_status === 'paid') {
        await this.processRefund(id, reservation.tenant_id, refundAmount)
      }

      // Create notifications
      await this.createNotification(
        reservation.tenant_id,
        'reservation',
        'Reservation Cancelled',
        `Your reservation has been cancelled. ${refundAmount > 0 ? `Refund of ₱${refundAmount.toLocaleString()} will be processed.` : ''}`,
        { reservationId: id, refundAmount }
      )

      await this.createNotification(
        reservation.landlord_id,
        'reservation',
        'Reservation Cancelled',
        'A reservation for your property has been cancelled',
        { reservationId: id }
      )

      return {
        success: true,
        refundAmount,
        message: refundAmount > 0 
          ? `Reservation cancelled. Refund of ₱${refundAmount.toLocaleString()} will be processed.`
          : 'Reservation cancelled.'
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error)
      return {
        success: false,
        refundAmount: 0,
        message: error instanceof Error ? error.message : 'Failed to cancel reservation'
      }
    }
  }

  async getReservations(userId: string): Promise<Reservation[]> {
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          *,
          properties (
            title,
            street,
            city,
            province,
            images
          )
        `)
        .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch reservations: ${error.message}`)
      }

      return reservations.map(this.mapDatabaseReservation)
    } catch (error) {
      console.error('Error fetching reservations:', error)
      throw error
    }
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          properties (
            title,
            street,
            city,
            province,
            images,
            landlord_id
          ),
          transactions (*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Failed to fetch reservation: ${error.message}`)
      }

      return this.mapDatabaseReservation(reservation)
    } catch (error) {
      console.error('Error fetching reservation:', error)
      throw error
    }
  }

  async updateReservationStatus(id: string, status: Reservation['status']): Promise<Reservation> {
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update reservation status: ${error.message}`)
      }

      return this.mapDatabaseReservation(reservation)
    } catch (error) {
      console.error('Error updating reservation status:', error)
      throw error
    }
  }

  async processPayment(
    reservationId: string, 
    paymentMethod: string, 
    paymentReference?: string
  ): Promise<Transaction> {
    try {
      // Get reservation details
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single()

      if (reservationError || !reservation) {
        throw new Error('Reservation not found')
      }

      // Create transaction record
      const transactionData: TransactionInsert = {
        reservation_id: reservationId,
        user_id: reservation.tenant_id,
        transaction_type: 'deposit',
        amount: reservation.deposit_amount,
        status: 'completed', // Mock payment always succeeds
        payment_method: paymentMethod,
        payment_reference: paymentReference || `MOCK_${Date.now()}`,
        transaction_date: new Date().toISOString()
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single()

      if (transactionError) {
        throw new Error(`Failed to create transaction: ${transactionError.message}`)
      }

      // Update reservation payment status
      await supabase
        .from('reservations')
        .update({ 
          payment_status: 'paid'
        })
        .eq('id', reservationId)

      // Create notification
      await this.createNotification(
        reservation.tenant_id,
        'payment',
        'Payment Successful',
        `Your deposit payment of ₱${reservation.deposit_amount.toLocaleString()} has been processed successfully`,
        { reservationId, transactionId: transaction.id }
      )

      return this.mapDatabaseTransaction(transaction)
    } catch (error) {
      console.error('Error processing payment:', error)
      throw error
    }
  }

  private async processRefund(reservationId: string, userId: string, amount: number): Promise<void> {
    const transactionData: TransactionInsert = {
      reservation_id: reservationId,
      user_id: userId,
      transaction_type: 'refund',
      amount: amount,
      status: 'completed',
      payment_method: 'refund',
      payment_reference: `REFUND_${Date.now()}`,
      transaction_date: new Date().toISOString()
    }

    await supabase
      .from('transactions')
      .insert(transactionData)

    // Update reservation payment status
    await supabase
      .from('reservations')
      .update({ payment_status: 'refunded' })
      .eq('id', reservationId)
  }

  private calculateRefundAmount(reservation: any, reason: string): number {
    // Simple refund calculation - in real app this would be more complex
    const now = new Date()
    const startDate = new Date(reservation.start_date)
    const daysDifference = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Full refund if cancelled more than 7 days before start date
    if (daysDifference > 7) {
      return reservation.deposit_amount
    }
    
    // 50% refund if cancelled 3-7 days before
    if (daysDifference > 3) {
      return reservation.deposit_amount * 0.5
    }
    
    // No refund if cancelled within 3 days
    return 0
  }

  private async createNotification(
    userId: string,
    type: NotificationInsert['notification_type'],
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const notificationData: NotificationInsert = {
      user_id: userId,
      notification_type: type,
      title,
      message,
      metadata: metadata || null
    }

    await supabase
      .from('notifications')
      .insert(notificationData)
  }

  private mapDatabaseReservation(dbReservation: any): Reservation {
    return {
      id: dbReservation.id,
      propertyId: dbReservation.property_id,
      tenantId: dbReservation.tenant_id,
      landlordId: dbReservation.landlord_id,
      startDate: new Date(dbReservation.start_date),
      endDate: dbReservation.end_date ? new Date(dbReservation.end_date) : undefined,
      status: dbReservation.status,
      paymentStatus: dbReservation.payment_status,
      totalAmount: dbReservation.total_amount,
      depositAmount: dbReservation.deposit_amount,
      createdAt: new Date(dbReservation.created_at),
      updatedAt: new Date(dbReservation.updated_at)
    }
  }

  private mapDatabaseTransaction(dbTransaction: any): Transaction {
    return {
      id: dbTransaction.id,
      reservationId: dbTransaction.reservation_id,
      userId: dbTransaction.user_id,
      type: dbTransaction.transaction_type,
      amount: dbTransaction.amount,
      status: dbTransaction.status,
      paymentMethod: dbTransaction.payment_method,
      transactionDate: new Date(dbTransaction.transaction_date)
    }
  }
}

// Export singleton instance
export const reservationService = new ReservationService()

// Export utility functions
export const calculateDepositAmount = (monthlyRent: number, depositMultiplier: number = 1): number => {
  return monthlyRent * depositMultiplier
}

export const calculateTotalUpfront = (monthlyRent: number, deposit: number): number => {
  return monthlyRent + deposit
}

export const formatReservationStatus = (status: Reservation['status']): string => {
  const statusMap = {
    pending: 'Pending Approval',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed'
  }
  return statusMap[status] || status
}

export const formatPaymentStatus = (status: Reservation['paymentStatus']): string => {
  const statusMap = {
    pending: 'Payment Pending',
    paid: 'Paid',
    refunded: 'Refunded'
  }
  return statusMap[status] || status
}