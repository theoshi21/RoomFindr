import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type TransactionRow = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export interface Transaction {
  id: string
  reservationId: string
  userId: string
  type: 'deposit' | 'payment' | 'refund'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  paymentMethod: string
  paymentReference: string | null
  transactionDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface TransactionWithDetails extends Transaction {
  reservation?: {
    id: string
    propertyId: string
    property?: {
      title: string
      street: string
      city: string
    }
  }
  user?: {
    id: string
    email: string
    profile?: {
      firstName: string
      lastName: string
    }
  }
}

export interface TransactionFilters {
  userId?: string
  type?: Transaction['type']
  status?: Transaction['status']
  dateFrom?: Date
  dateTo?: Date
  amountMin?: number
  amountMax?: number
  paymentMethod?: string
}

export interface TransactionSummary {
  totalTransactions: number
  totalAmount: number
  totalDeposits: number
  totalPayments: number
  totalRefunds: number
  pendingAmount: number
  completedAmount: number
  failedAmount: number
}

export interface DisputeReport {
  transactionId: string
  userId: string
  reason: string
  description: string
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  createdAt: Date
}

export class TransactionService {
  
  async getTransactions(filters: TransactionFilters = {}): Promise<TransactionWithDetails[]> {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          reservations (
            id,
            property_id,
            properties (
              title,
              street,
              city
            )
          ),
          users (
            id,
            email,
            user_profiles (
              first_name,
              last_name
            )
          )
        `)
        .order('transaction_date', { ascending: false })

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      
      if (filters.type) {
        query = query.eq('transaction_type', filters.type)
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom.toISOString())
      }
      
      if (filters.dateTo) {
        query = query.lte('transaction_date', filters.dateTo.toISOString())
      }
      
      if (filters.amountMin) {
        query = query.gte('amount', filters.amountMin)
      }
      
      if (filters.amountMax) {
        query = query.lte('amount', filters.amountMax)
      }
      
      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod)
      }

      const { data: transactions, error } = await query

      if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`)
      }

      return transactions.map(this.mapDatabaseTransaction)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  }

  async getTransactionById(id: string): Promise<TransactionWithDetails | null> {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select(`
          *,
          reservations (
            id,
            property_id,
            tenant_id,
            landlord_id,
            start_date,
            end_date,
            status,
            properties (
              title,
              street,
              city,
              province
            )
          ),
          users (
            id,
            email,
            user_profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Failed to fetch transaction: ${error.message}`)
      }

      return this.mapDatabaseTransaction(transaction)
    } catch (error) {
      console.error('Error fetching transaction:', error)
      throw error
    }
  }

  async getTransactionSummary(userId?: string, dateFrom?: Date, dateTo?: Date): Promise<TransactionSummary> {
    try {
      let query = supabase
        .from('transactions')
        .select('transaction_type, status, amount')

      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      if (dateFrom) {
        query = query.gte('transaction_date', dateFrom.toISOString())
      }
      
      if (dateTo) {
        query = query.lte('transaction_date', dateTo.toISOString())
      }

      const { data: transactions, error } = await query

      if (error) {
        throw new Error(`Failed to fetch transaction summary: ${error.message}`)
      }

      const summary: TransactionSummary = {
        totalTransactions: transactions.length,
        totalAmount: 0,
        totalDeposits: 0,
        totalPayments: 0,
        totalRefunds: 0,
        pendingAmount: 0,
        completedAmount: 0,
        failedAmount: 0
      }

      transactions.forEach(transaction => {
        summary.totalAmount += transaction.amount

        // By type
        switch (transaction.transaction_type) {
          case 'deposit':
            summary.totalDeposits += transaction.amount
            break
          case 'payment':
            summary.totalPayments += transaction.amount
            break
          case 'refund':
            summary.totalRefunds += transaction.amount
            break
        }

        // By status
        switch (transaction.status) {
          case 'pending':
            summary.pendingAmount += transaction.amount
            break
          case 'completed':
            summary.completedAmount += transaction.amount
            break
          case 'failed':
            summary.failedAmount += transaction.amount
            break
        }
      })

      return summary
    } catch (error) {
      console.error('Error calculating transaction summary:', error)
      throw error
    }
  }

  async searchTransactions(
    searchTerm: string, 
    filters: TransactionFilters = {}
  ): Promise<TransactionWithDetails[]> {
    try {
      // First get transactions with filters
      const transactions = await this.getTransactions(filters)
      
      // Then filter by search term
      const searchLower = searchTerm.toLowerCase()
      
      return transactions.filter(transaction => {
        const searchableText = [
          transaction.id,
          transaction.paymentReference,
          transaction.paymentMethod,
          transaction.reservation?.property?.title,
          transaction.reservation?.property?.street,
          transaction.reservation?.property?.city,
          transaction.user?.email,
          transaction.user?.profile?.firstName,
          transaction.user?.profile?.lastName
        ].filter(Boolean).join(' ').toLowerCase()
        
        return searchableText.includes(searchLower)
      })
    } catch (error) {
      console.error('Error searching transactions:', error)
      throw error
    }
  }

  async createTransaction(data: Omit<TransactionInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          ...data,
          transaction_date: data.transaction_date || new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create transaction: ${error.message}`)
      }

      return this.mapDatabaseTransaction(transaction)
    } catch (error) {
      console.error('Error creating transaction:', error)
      throw error
    }
  }

  async updateTransactionStatus(
    id: string, 
    status: Transaction['status'], 
    paymentReference?: string
  ): Promise<Transaction> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (paymentReference) {
        updateData.payment_reference = paymentReference
      }

      const { data: transaction, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update transaction: ${error.message}`)
      }

      return this.mapDatabaseTransaction(transaction)
    } catch (error) {
      console.error('Error updating transaction:', error)
      throw error
    }
  }

  async getPaymentMethods(): Promise<string[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('payment_method')
        .not('payment_method', 'is', null)

      if (error) {
        throw new Error(`Failed to fetch payment methods: ${error.message}`)
      }

      const uniqueMethods = [...new Set(transactions.map(t => t.payment_method))]
      return uniqueMethods.sort()
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      return ['GCash', 'Maya', 'PayPal', 'Bank Transfer', 'Cash']
    }
  }

  async exportTransactions(filters: TransactionFilters = {}): Promise<string> {
    try {
      const transactions = await this.getTransactions(filters)
      
      const csvHeaders = [
        'Transaction ID',
        'Date',
        'Type',
        'Amount',
        'Status',
        'Payment Method',
        'Reference',
        'User Email',
        'Property Title',
        'Property Address'
      ]

      const csvRows = transactions.map(transaction => [
        transaction.id,
        transaction.transactionDate.toISOString().split('T')[0],
        transaction.type,
        transaction.amount.toString(),
        transaction.status,
        transaction.paymentMethod,
        transaction.paymentReference || '',
        transaction.user?.email || '',
        transaction.reservation?.property?.title || '',
        `${transaction.reservation?.property?.street || ''}, ${transaction.reservation?.property?.city || ''}`
      ])

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      return csvContent
    } catch (error) {
      console.error('Error exporting transactions:', error)
      throw error
    }
  }

  private mapDatabaseTransaction(dbTransaction: any): TransactionWithDetails {
    return {
      id: dbTransaction.id,
      reservationId: dbTransaction.reservation_id,
      userId: dbTransaction.user_id,
      type: dbTransaction.transaction_type,
      amount: dbTransaction.amount,
      status: dbTransaction.status,
      paymentMethod: dbTransaction.payment_method,
      paymentReference: dbTransaction.payment_reference,
      transactionDate: new Date(dbTransaction.transaction_date),
      createdAt: new Date(dbTransaction.created_at),
      updatedAt: new Date(dbTransaction.updated_at),
      reservation: dbTransaction.reservations ? {
        id: dbTransaction.reservations.id,
        propertyId: dbTransaction.reservations.property_id,
        property: dbTransaction.reservations.properties ? {
          title: dbTransaction.reservations.properties.title,
          street: dbTransaction.reservations.properties.street,
          city: dbTransaction.reservations.properties.city
        } : undefined
      } : undefined,
      user: dbTransaction.users ? {
        id: dbTransaction.users.id,
        email: dbTransaction.users.email,
        profile: dbTransaction.users.user_profiles ? {
          firstName: dbTransaction.users.user_profiles.first_name,
          lastName: dbTransaction.users.user_profiles.last_name
        } : undefined
      } : undefined
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService()

// Utility functions
export const formatTransactionType = (type: Transaction['type']): string => {
  const typeMap = {
    deposit: 'Security Deposit',
    payment: 'Payment',
    refund: 'Refund'
  }
  return typeMap[type] || type
}

export const formatTransactionStatus = (status: Transaction['status']): string => {
  const statusMap = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed'
  }
  return statusMap[status] || status
}

export const getTransactionStatusColor = (status: Transaction['status']): string => {
  const colorMap = {
    pending: 'text-yellow-600 bg-yellow-50',
    completed: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50'
  }
  return colorMap[status] || 'text-gray-600 bg-gray-50'
}

export const getTransactionTypeColor = (type: Transaction['type']): string => {
  const colorMap = {
    deposit: 'text-blue-600 bg-blue-50',
    payment: 'text-green-600 bg-green-50',
    refund: 'text-orange-600 bg-orange-50'
  }
  return colorMap[type] || 'text-gray-600 bg-gray-50'
}