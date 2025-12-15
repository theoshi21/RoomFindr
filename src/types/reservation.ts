// Reservation Types
export interface Reservation {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  startDate: Date;
  endDate?: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  totalAmount: number;
  depositAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationData {
  propertyId: string;
  startDate: Date;
  endDate?: Date;
  tenantId: string;
  depositAmount: number;
  totalAmount: number;
}

export interface CancellationResult {
  success: boolean;
  refundAmount: number;
  message: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  reservationId: string;
  userId: string;
  type: 'deposit' | 'payment' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  transactionDate: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'reservation' | 'payment' | 'announcement' | 'verification';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, string | number | boolean>;
}

