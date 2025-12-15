'use client'

import React, { useState } from 'react'
import { 
  type TransactionWithDetails,
  formatTransactionType,
  formatTransactionStatus,
  getTransactionStatusColor,
  getTransactionTypeColor
} from '@/lib/transaction'

interface TransactionDetailModalProps {
  transaction: TransactionWithDetails
  onClose: () => void
}

export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  const [showDispute, setShowDispute] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDescription, setDisputeDescription] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const handleDisputeSubmit = async () => {
    // In a real app, this would submit to a dispute service
    console.log('Dispute submitted:', {
      transactionId: transaction.id,
      reason: disputeReason,
      description: disputeDescription
    })
    
    // Show success message and close
    alert('Dispute submitted successfully. Our team will review it within 24 hours.')
    setShowDispute(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Transaction ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{transaction.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(transaction.transactionDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Type</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                  {formatTransactionType(transaction.type)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionStatusColor(transaction.status)}`}>
                  {formatTransactionStatus(transaction.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Amount Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Amount Information</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Transaction Amount</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(transaction.amount)}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                <p className="mt-1 text-sm text-gray-900">{transaction.paymentMethod}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Payment Reference</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">
                  {transaction.paymentReference || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Property Information */}
          {transaction.reservation?.property && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Property Information</h3>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{transaction.reservation.property.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {transaction.reservation.property.street}, {transaction.reservation.property.city}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Reservation ID: {transaction.reservation.id}
                </p>
              </div>
            </div>
          )}

          {/* User Information */}
          {transaction.user && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">User Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{transaction.user.email}</p>
                </div>
                {transaction.user.profile && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {transaction.user.profile.firstName} {transaction.user.profile.lastName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-900">{formatDate(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Updated:</span>
                <span className="text-gray-900">{formatDate(transaction.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Dispute Section */}
          {!showDispute && transaction.status === 'completed' && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={() => setShowDispute(true)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Report Issue / Dispute Transaction
              </button>
            </div>
          )}

          {/* Dispute Form */}
          {showDispute && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Report Transaction Issue</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Type
                  </label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an issue type</option>
                    <option value="unauthorized">Unauthorized Transaction</option>
                    <option value="incorrect_amount">Incorrect Amount</option>
                    <option value="service_not_received">Service Not Received</option>
                    <option value="duplicate_charge">Duplicate Charge</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    rows={4}
                    placeholder="Please provide details about the issue..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleDisputeSubmit}
                    disabled={!disputeReason || !disputeDescription.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Dispute
                  </button>
                  <button
                    onClick={() => setShowDispute(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}