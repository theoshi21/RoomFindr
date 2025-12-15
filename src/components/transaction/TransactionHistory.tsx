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
import { TransactionFilters as FilterComponent } from './TransactionFilters'
import { TransactionDetailModal } from './TransactionDetailModal'

interface TransactionHistoryProps {
  userId?: string
  showFilters?: boolean
  showExport?: boolean
  maxHeight?: string
}

export function TransactionHistory({ 
  userId, 
  showFilters = true, 
  showExport = true,
  maxHeight = 'max-h-96'
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TransactionFilters>({ userId })
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTransactions()
  }, [filters])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let result: TransactionWithDetails[]
      
      if (searchTerm.trim()) {
        result = await transactionService.searchTransactions(searchTerm, filters)
      } else {
        result = await transactionService.getTransactions(filters)
      }
      
      setTransactions(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    await loadTransactions()
  }

  const handleExport = async () => {
    try {
      const csvContent = await transactionService.exportTransactions(filters)
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export transactions')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading transactions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
          
          {showExport && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <FilterComponent
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Transaction List */}
      <div className={`bg-white rounded-lg shadow overflow-hidden ${maxHeight} overflow-y-auto`}>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No transactions found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                        {formatTransactionType(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionStatusColor(transaction.status)}`}>
                        {formatTransactionStatus(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {transaction.reservation?.property?.title || 'N/A'}
                        </div>
                        {transaction.reservation?.property?.street && (
                          <div className="text-gray-500 text-xs">
                            {transaction.reservation.property.street}, {transaction.reservation.property.city}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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