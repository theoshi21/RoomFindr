'use client'

import React, { useState, useEffect } from 'react'
import { 
  transactionService, 
  type TransactionWithDetails, 
  type TransactionFilters,
  formatTransactionType,
  formatTransactionStatus,
  getTransactionStatusColor,
  getTransactionTypeColor
} from '@/lib/transaction'
import { TransactionSummary } from './TransactionSummary'
import { TransactionDetailModal } from './TransactionDetailModal'

interface TransactionManagementProps {
  userId?: string
  userRole?: 'admin' | 'tenant' | 'landlord'
  compact?: boolean
  showSummary?: boolean
  maxTransactions?: number
}

export function TransactionManagement({ 
  userId, 
  userRole = 'tenant',
  compact = false,
  showSummary = true,
  maxTransactions = 10
}: TransactionManagementProps) {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null)

  useEffect(() => {
    loadRecentTransactions()
  }, [userId])

  const loadRecentTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: TransactionFilters = { userId }
      const result = await transactionService.getTransactions(filters)
      
      // Limit to recent transactions
      setTransactions(result.slice(0, maxTransactions))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    if (compact) {
      return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric'
      }).format(date)
    }
    
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {showSummary && (
          <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
        )}
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {showSummary && (
        <TransactionSummary userId={userId} />
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Transactions
            </h3>
            {!compact && (
              <a
                href="/transactions"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </a>
            )}
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No transactions found</p>
              {userRole === 'tenant' && (
                <p className="text-sm mt-2">
                  Make your first reservation to see transactions here
                </p>
              )}
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                        {formatTransactionType(transaction.type)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionStatusColor(transaction.status)}`}>
                        {formatTransactionStatus(transaction.status)}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.reservation?.property?.title || 'Transaction'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.transactionDate)} • {transaction.paymentMethod}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </p>
                    {!compact && (
                      <p className="text-xs text-gray-500">
                        {transaction.paymentReference || 'No reference'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {transactions.length > 0 && compact && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <a
              href="/transactions"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all transactions →
            </a>
          </div>
        )}
      </div>

      {/* Quick Actions for Admins */}
      {userRole === 'admin' && !compact && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900">Pending Transactions</h4>
              <p className="text-sm text-gray-600 mt-1">
                Review transactions awaiting approval
              </p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900">Generate Report</h4>
              <p className="text-sm text-gray-600 mt-1">
                Create financial reports for analysis
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  )
}