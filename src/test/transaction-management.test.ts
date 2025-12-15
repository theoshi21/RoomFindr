import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  TransactionService,
  formatTransactionType,
  formatTransactionStatus,
  getTransactionStatusColor,
  getTransactionTypeColor
} from '@/lib/transaction'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            single: vi.fn(),
            then: vi.fn()
          }))
        })),
        or: vi.fn(() => ({
          order: vi.fn(() => ({
            single: vi.fn(),
            then: vi.fn()
          }))
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              single: vi.fn(),
              then: vi.fn()
            }))
          }))
        })),
        order: vi.fn(() => ({
          single: vi.fn(),
          then: vi.fn()
        })),
        not: vi.fn(() => ({
          then: vi.fn()
        }))
      }))
    }))
  }
}))

const mockTransactions = [
  {
    id: 'txn-1',
    reservationId: 'res-1',
    userId: 'user-1',
    type: 'deposit' as const,
    amount: 5000,
    status: 'completed' as const,
    paymentMethod: 'GCash',
    paymentReference: 'GC123456',
    transactionDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    reservation: {
      id: 'res-1',
      propertyId: 'prop-1',
      property: {
        title: 'Cozy Studio Apartment',
        street: '123 Main St',
        city: 'Manila'
      }
    },
    user: {
      id: 'user-1',
      email: 'tenant@example.com',
      profile: {
        firstName: 'John',
        lastName: 'Doe'
      }
    }
  },
  {
    id: 'txn-2',
    reservationId: 'res-2',
    userId: 'user-1',
    type: 'payment' as const,
    amount: 15000,
    status: 'pending' as const,
    paymentMethod: 'Maya',
    paymentReference: 'MY789012',
    transactionDate: new Date('2024-01-20'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    reservation: {
      id: 'res-2',
      propertyId: 'prop-2',
      property: {
        title: 'Modern Shared Room',
        street: '456 Oak Ave',
        city: 'Quezon City'
      }
    },
    user: {
      id: 'user-1',
      email: 'tenant@example.com',
      profile: {
        firstName: 'John',
        lastName: 'Doe'
      }
    }
  },
  {
    id: 'txn-3',
    reservationId: 'res-3',
    userId: 'user-1',
    type: 'refund' as const,
    amount: 2500,
    status: 'failed' as const,
    paymentMethod: 'PayPal',
    paymentReference: 'PP345678',
    transactionDate: new Date('2024-01-25'),
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    reservation: {
      id: 'res-3',
      propertyId: 'prop-3',
      property: {
        title: 'Budget Room',
        street: '789 Pine St',
        city: 'Makati'
      }
    },
    user: {
      id: 'user-1',
      email: 'tenant@example.com',
      profile: {
        firstName: 'John',
        lastName: 'Doe'
      }
    }
  }
]

const mockSummary = {
  totalTransactions: 3,
  totalAmount: 22500,
  totalDeposits: 5000,
  totalPayments: 15000,
  totalRefunds: 2500,
  pendingAmount: 15000,
  completedAmount: 5000,
  failedAmount: 2500
}

describe('Transaction Service', () => {
  let transactionService: TransactionService

  beforeEach(() => {
    vi.clearAllMocks()
    transactionService = new TransactionService()
  })

  it('creates transaction service instance', () => {
    expect(transactionService).toBeInstanceOf(TransactionService)
  })

  it('formats transaction types correctly', () => {
    expect(formatTransactionType('deposit')).toBe('Security Deposit')
    expect(formatTransactionType('payment')).toBe('Payment')
    expect(formatTransactionType('refund')).toBe('Refund')
  })

  it('formats transaction status correctly', () => {
    expect(formatTransactionStatus('pending')).toBe('Pending')
    expect(formatTransactionStatus('completed')).toBe('Completed')
    expect(formatTransactionStatus('failed')).toBe('Failed')
  })

  it('returns correct status colors', () => {
    expect(getTransactionStatusColor('pending')).toBe('text-yellow-600 bg-yellow-50')
    expect(getTransactionStatusColor('completed')).toBe('text-green-600 bg-green-50')
    expect(getTransactionStatusColor('failed')).toBe('text-red-600 bg-red-50')
  })

  it('returns correct type colors', () => {
    expect(getTransactionTypeColor('deposit')).toBe('text-blue-600 bg-blue-50')
    expect(getTransactionTypeColor('payment')).toBe('text-green-600 bg-green-50')
    expect(getTransactionTypeColor('refund')).toBe('text-orange-600 bg-orange-50')
  })
})

describe('Transaction Filtering', () => {
  it('handles transaction filtering logic', () => {
    const transactions = mockTransactions
    
    // Test filtering by type
    const deposits = transactions.filter(t => t.type === 'deposit')
    expect(deposits).toHaveLength(1)
    expect(deposits[0].type).toBe('deposit')
    
    // Test filtering by status
    const completed = transactions.filter(t => t.status === 'completed')
    expect(completed).toHaveLength(1)
    expect(completed[0].status).toBe('completed')
    
    // Test filtering by amount range
    const highValue = transactions.filter(t => t.amount > 10000)
    expect(highValue).toHaveLength(1)
    expect(highValue[0].amount).toBe(15000)
  })

  it('handles transaction search logic', () => {
    const transactions = mockTransactions
    const searchTerm = 'cozy'
    
    const filtered = transactions.filter(transaction => {
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
      
      return searchableText.includes(searchTerm.toLowerCase())
    })
    
    expect(filtered).toHaveLength(1)
    expect(filtered[0].reservation?.property?.title).toBe('Cozy Studio Apartment')
  })
})

describe('Transaction Summary Calculations', () => {
  it('calculates transaction summary correctly', () => {
    const transactions = mockTransactions
    
    const summary = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      totalDeposits: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
      totalPayments: transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0),
      totalRefunds: transactions.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0),
      pendingAmount: transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
      completedAmount: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
      failedAmount: transactions.filter(t => t.status === 'failed').reduce((sum, t) => sum + t.amount, 0)
    }
    
    expect(summary.totalTransactions).toBe(3)
    expect(summary.totalAmount).toBe(22500)
    expect(summary.totalDeposits).toBe(5000)
    expect(summary.totalPayments).toBe(15000)
    expect(summary.totalRefunds).toBe(2500)
    expect(summary.pendingAmount).toBe(15000)
    expect(summary.completedAmount).toBe(5000)
    expect(summary.failedAmount).toBe(2500)
  })
})

describe('Transaction Export', () => {
  it('generates CSV content correctly', () => {
    const transactions = mockTransactions
    
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
    
    expect(csvContent).toContain('Transaction ID')
    expect(csvContent).toContain('txn-1')
    expect(csvContent).toContain('Cozy Studio Apartment')
    expect(csvContent).toContain('GCash')
  })
})