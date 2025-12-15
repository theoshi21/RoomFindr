'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { LogoutButton } from '../auth'

interface NavigationItem {
  id: string
  name: string
  icon: string
  path?: string
  onClick?: () => void
}

interface DashboardNavigationProps {
  title: string
  items: NavigationItem[]
  activeItem?: string
  onItemClick?: (itemId: string) => void
}

export function DashboardNavigation({
  title,
  items,
  activeItem,
  onItemClick
}: DashboardNavigationProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const handleItemClick = (item: NavigationItem) => {
    if (item.path) {
      router.push(item.path)
    } else if (item.onClick) {
      item.onClick()
    } else if (onItemClick) {
      onItemClick(item.id)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {user && (
              <p className="text-lg text-blue-600 mt-1 font-medium">
                {getGreeting()}, {user.profile?.first_name || 'User'}! 👋
              </p>
            )}
          </div>
          <LogoutButton className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-t border-gray-200">
        <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
          {items.map((item) => {
            const isActive = activeItem 
              ? activeItem === item.id 
              : item.path 
                ? pathname === item.path 
                : false

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}