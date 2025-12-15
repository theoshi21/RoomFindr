'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = "text-red-600 hover:text-red-500",
  children = "Sign Out"
}) => {
  const { signOut } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? 'Signing Out...' : children}
    </button>
  )
}