'use client'

import React, { useState, useEffect } from 'react'
import { transactionService, type TransactionSummary as Summary } from '@/lib/transaction'

interface TransactionSummaryProps {
  userId?: string
  dateFrom?: Date
  dateTo?: Date
  className?: string
}

export function TransactionSummary({ 
  userId, 
  dateFrom, 
  dateTo, 
  className = '' 
}: TransactionSummaryProps) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSummary()
  }, [userId, dateFrom, dateTo])

  const loadSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await transactionService.getTransactionSummary(userId, dateFrom, dateTo)
      setSummary(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary')
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

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>Failed to load transaction summary</p>
          <button
            onClick={loadSummary}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  const summaryCards = [
    {
      title: 'Total Transactions',
      value: summary.totalTransactions.toString(),
      subtitle: 'All time',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Amount',
      value: formatCurrency(summary.totalAmount),
      subtitle: 'All transactions',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Completed',
      value: formatCurrency(summary.completedAmount),
      subtitle: 'Successfully processed',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending',
      value: formatCurrency(summary.pendingAmount),
      subtitle: 'Awaiting processing',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  const typeBreakdown = [
    {
      title: 'Deposits',
      value: formatCurrency(summary.totalDeposits),
      color: 'text-blue-600'
    },
    {
      title: 'Payments',
      value: formatCurrency(summary.totalPayments),
      color: 'text-green-600'
    },
    {
      title: 'Refunds',
      value: formatCurrency(summary.totalRefunds),
      color: 'text-orange-600'
    }
  ]

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Summary</h3>
        
        {/* Main Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card, index) => (
            <div key={index} className={`${card.bgColor} rounded-lg p-4`}>
              <div className="text-sm font-medium text-gray-600">{card.title}</div>
              <div className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</div>
              <div className="text-xs text-gray-500 mt-1">{card.subtitle}</div>
            </div>
          ))}
        </div>

        {/* Type Breakdown */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">By Transaction Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {typeBreakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">{item.title}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Breakdown */}
        {summary.failedAmount > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">By Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Completed</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(summary.completedAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Pending</span>
                <span className="text-sm font-bold text-yellow-600">
                  {formatCurrency(summary.pendingAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Failed</span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(summary.failedAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Date Range Info */}
        {(dateFrom || dateTo) && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-xs text-gray-500">
              {dateFrom && dateTo
                ? `Period: ${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`
                : dateFrom
                ? `From: ${dateFrom.toLocaleDateString()}`
                : `Until: ${dateTo?.toLocaleDateString()}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}