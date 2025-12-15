'use client'

import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegistrationForm } from './RegistrationForm'
import { PasswordResetForm } from './PasswordResetForm'

type AuthMode = 'login' | 'register' | 'reset'

interface AuthModalProps {
  initialMode?: AuthMode
  onClose?: () => void
  onSuccess?: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode)

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess()
    }
    if (onClose) {
      onClose()
    }
  }

  const renderForm = () => {
    switch (mode) {
      case 'register':
        return (
          <RegistrationForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        )
      case 'reset':
        return (
          <PasswordResetForm
            onSuccess={() => setMode('login')}
            onBackToLogin={() => setMode('login')}
          />
        )
      case 'login':
      default:
        return (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setMode('register')}
            onForgotPassword={() => setMode('reset')}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {onClose && (
          <div className="text-right mb-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        {renderForm()}
      </div>
    </div>
  )
}