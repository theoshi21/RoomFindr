'use client'

import React, { useState, useEffect } from 'react'
import { transactionService, type TransactionFilters as Filters } from '@/lib/transaction'

interface TransactionFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function TransactionFilters({ filters, onFiltersChange }: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [localFilters, setLocalFilters] = useState<Filters>(filters)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const loadPaymentMethods = async () => {
    try {
      const methods = await transactionService.getPaymentMethods()
      setPaymentMethods(methods)
    } catch (error) {
      console.error('Failed to load payment methods:', error)
    }
  }

  const handleFilterChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
  }

  const clearFilters = () => {
    const clearedFilters: Filters = { userId: filters.userId }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const formatDateForInput = (date?: Date) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const parseInputDate = (dateString: string) => {
    return dateString ? new Date(dateString) : undefined
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {isExpanded ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                value={localFilters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="deposit">Security Deposit</option>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={localFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={localFilters.paymentMethod || ''}
                onChange={(e) => handleFilterChange('paymentMethod', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Methods</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={formatDateForInput(localFilters.dateFrom)}
                onChange={(e) => handleFilterChange('dateFrom', parseInputDate(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={formatDateForInput(localFilters.dateTo)}
                onChange={(e) => handleFilterChange('dateTo', parseInputDate(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Amount Range */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Range (PHP)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.amountMin || ''}
                  onChange={(e) => handleFilterChange('amountMin', e.target.value ? Number(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.amountMax || ''}
                  onChange={(e) => handleFilterChange('amountMax', e.target.value ? Number(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear All
            </button>
          </div>

          {/* Active Filters Summary */}
          {Object.keys(localFilters).filter(key => key !== 'userId' && localFilters[key as keyof Filters]).length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {localFilters.type && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Type: {localFilters.type}
                  </span>
                )}
                {localFilters.status && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Status: {localFilters.status}
                  </span>
                )}
                {localFilters.paymentMethod && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Method: {localFilters.paymentMethod}
                  </span>
                )}
                {localFilters.dateFrom && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    From: {localFilters.dateFrom.toLocaleDateString()}
                  </span>
                )}
                {localFilters.dateTo && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    To: {localFilters.dateTo.toLocaleDateString()}
                  </span>
                )}
                {(localFilters.amountMin || localFilters.amountMax) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Amount: {localFilters.amountMin || 0} - {localFilters.amountMax || '∞'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}