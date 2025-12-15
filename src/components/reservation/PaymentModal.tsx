'use client'

import { useState } from 'react'
import { Reservation } from '@/types/reservation'
import { 
  XMarkIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface PaymentModalProps {
  reservation: Reservation
  onClose: () => void
  onPaymentComplete: (paymentMethod: string, paymentReference?: string) => void
  isLoading?: boolean
}

type PaymentMethod = 'gcash' | 'maya' | 'paypal' | 'bank_transfer'

interface PaymentMethodOption {
  id: PaymentMethod
  name: string
  icon: React.ReactNode
  description: string
  processingTime: string
}

export default function PaymentModal({ 
  reservation, 
  onClose, 
  onPaymentComplete, 
  isLoading = false 
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash')
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: '',
    email: '',
    accountNumber: '',
    referenceNumber: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'select' | 'details' | 'processing' | 'success'>('select')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'gcash',
      name: 'GCash',
      icon: <DevicePhoneMobileIcon className="h-6 w-6" />,
      description: 'Pay using your GCash mobile wallet',
      processingTime: 'Instant'
    },
    {
      id: 'maya',
      name: 'Maya (PayMaya)',
      icon: <CreditCardIcon className="h-6 w-6" />,
      description: 'Pay using your Maya digital wallet',
      processingTime: 'Instant'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <CreditCardIcon className="h-6 w-6" />,
      description: 'Pay using your PayPal account',
      processingTime: '1-2 minutes'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: <BanknotesIcon className="h-6 w-6" />,
      description: 'Direct bank transfer',
      processingTime: '1-3 business days'
    }
  ]

  const validatePaymentDetails = (): boolean => {
    const newErrors: Record<string, string> = {}

    switch (selectedMethod) {
      case 'gcash':
      case 'maya':
        if (!paymentDetails.phoneNumber) {
          newErrors.phoneNumber = 'Phone number is required'
        } else if (!/^09\d{9}$/.test(paymentDetails.phoneNumber)) {
          newErrors.phoneNumber = 'Please enter a valid Philippine mobile number (09XXXXXXXXX)'
        }
        break
      case 'paypal':
        if (!paymentDetails.email) {
          newErrors.email = 'Email address is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentDetails.email)) {
          newErrors.email = 'Please enter a valid email address'
        }
        break
      case 'bank_transfer':
        if (!paymentDetails.accountNumber) {
          newErrors.accountNumber = 'Account number is required'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setPaymentStep('details')
    setErrors({})
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePaymentDetails()) {
      return
    }

    setIsProcessing(true)
    setPaymentStep('processing')

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate mock payment reference
      const paymentReference = `${selectedMethod.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      setPaymentStep('success')
      
      // Wait a moment before calling completion
      setTimeout(() => {
        onPaymentComplete(selectedMethod, paymentReference)
      }, 1500)
      
    } catch (error) {
      console.error('Payment processing error:', error)
      setIsProcessing(false)
      setPaymentStep('details')
      setErrors({ general: 'Payment processing failed. Please try again.' })
    }
  }

  const renderPaymentMethodSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Payment Method</h3>
      <div className="grid gap-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => handleMethodSelect(method.id)}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex-shrink-0 text-blue-600">
              {method.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{method.name}</div>
              <div className="text-sm text-gray-600">{method.description}</div>
              <div className="text-xs text-green-600 mt-1">Processing: {method.processingTime}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderPaymentDetails = () => {
    const selectedMethodInfo = paymentMethods.find(m => m.id === selectedMethod)!

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPaymentStep('select')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back
          </button>
          <h3 className="text-lg font-medium text-gray-900">
            Pay with {selectedMethodInfo.name}
          </h3>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          </div>
        )}

        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {selectedMethod === 'gcash' && (
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                GCash Mobile Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={paymentDetails.phoneNumber}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="09XXXXXXXXX"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>
          )}

          {selectedMethod === 'maya' && (
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Maya Mobile Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={paymentDetails.phoneNumber}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="09XXXXXXXXX"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>
          )}

          {selectedMethod === 'paypal' && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                PayPal Email Address
              </label>
              <input
                type="email"
                id="email"
                value={paymentDetails.email}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          )}

          {selectedMethod === 'bank_transfer' && (
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                value={paymentDetails.accountNumber}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Enter your account number"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.accountNumber ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.accountNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Payment Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Security Deposit</span>
                <span className="text-gray-900">₱{reservation.depositAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee</span>
                <span className="text-gray-900">₱0.00</span>
              </div>
              <div className="border-t border-gray-200 pt-1 mt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-900">Total Amount</span>
                  <span className="text-gray-900">₱{reservation.depositAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isProcessing ? 'Processing...' : `Pay ₱${reservation.depositAmount.toLocaleString()}`}
            </button>
          </div>
        </form>
      </div>
    )
  }

  const renderProcessing = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Payment</h3>
      <p className="text-gray-600">Please wait while we process your payment...</p>
      <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center py-8">
      <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
      <p className="text-gray-600">Your deposit has been processed successfully.</p>
      <p className="text-sm text-gray-500 mt-2">You will receive a confirmation email shortly.</p>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {paymentStep === 'success' ? 'Payment Complete' : 'Secure Payment'}
          </h2>
          {paymentStep !== 'processing' && paymentStep !== 'success' && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          )}
        </div>

        <div className="p-6">
          {paymentStep === 'select' && renderPaymentMethodSelection()}
          {paymentStep === 'details' && renderPaymentDetails()}
          {paymentStep === 'processing' && renderProcessing()}
          {paymentStep === 'success' && renderSuccess()}
        </div>
      </div>
    </div>
  )
}