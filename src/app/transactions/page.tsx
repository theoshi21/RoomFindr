'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TransactionHistory, TransactionSummary } from '@/components/transaction'
import type { TransactionFilters } from '@/lib/transaction'

export default function TransactionsPage() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your transactions.</p>
        </div>
      </div>
    )
  }

  const isAdmin = user.user.role === 'admin'
  const userId = isAdmin ? undefined : user.user.id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'All Transactions' : 'My Transactions'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isAdmin 
              ? 'View and manage all platform transactions' 
              : 'View your transaction history and financial activity'
            }
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.from?.toISOString().split('T')[0] || ''}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  from: e.target.value ? new Date(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.to?.toISOString().split('T')[0] || ''}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  to: e.target.value ? new Date(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <TransactionSummary
          userId={userId}
          dateFrom={dateRange.from}
          dateTo={dateRange.to}
          className="mb-6"
        />

        {/* Transaction History */}
        <TransactionHistory
          userId={userId}
          showFilters={true}
          showExport={true}
          maxHeight="max-h-[600px]"
        />

        {/* Admin-specific features */}
        {isAdmin && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900">Financial Reports</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Generate detailed financial reports for accounting and analysis.
                </p>
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  Generate Report
                </button>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900">Pending Transactions</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Review and manage transactions that require attention.
                </p>
                <button className="mt-3 px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700">
                  View Pending
                </button>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-red-900">Dispute Management</h4>
                <p className="text-sm text-red-700 mt-1">
                  Handle transaction disputes and customer issues.
                </p>
                <button className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">
                  View Disputes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}