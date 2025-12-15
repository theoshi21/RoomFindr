'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'gray'
  path?: string
  onClick?: () => void
  disabled?: boolean
  badge?: string
}

interface QuickActionsProps {
  title?: string
  actions: QuickAction[]
  columns?: 1 | 2 | 3 | 4
}

export function QuickActions({ 
  title = "Quick Actions", 
  actions, 
  columns = 3 
}: QuickActionsProps) {
  const router = useRouter()

  const handleActionClick = (action: QuickAction) => {
    if (action.disabled) return
    
    if (action.path) {
      router.push(action.path)
    } else if (action.onClick) {
      action.onClick()
    }
  }

  const getColorClasses = (color: QuickAction['color']) => {
    const classes = {
      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 border-green-200 hover:bg-green-100',
      yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
      red: 'bg-red-50 border-red-200 hover:bg-red-100',
      purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
      gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
    }
    return classes[color]
  }

  const getTextColorClasses = (color: QuickAction['color']) => {
    const classes = {
      blue: 'text-blue-900',
      green: 'text-green-900',
      yellow: 'text-yellow-900',
      red: 'text-red-900',
      purple: 'text-purple-900',
      indigo: 'text-indigo-900',
      gray: 'text-gray-900'
    }
    return classes[color]
  }

  const getButtonColorClasses = (color: QuickAction['color']) => {
    const classes = {
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',
      yellow: 'bg-yellow-600 hover:bg-yellow-700',
      red: 'bg-red-600 hover:bg-red-700',
      purple: 'bg-purple-600 hover:bg-purple-700',
      indigo: 'bg-indigo-600 hover:bg-indigo-700',
      gray: 'bg-gray-600 hover:bg-gray-700'
    }
    return classes[color]
  }

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
      
      <div className={`grid ${gridClasses[columns]} gap-6`}>
        {actions.map((action) => (
          <div
            key={action.id}
            className={`
              relative p-6 rounded-lg border transition-all duration-200
              ${getColorClasses(action.color)}
              ${action.disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:shadow-md hover:scale-105'
              }
            `}
            onClick={() => handleActionClick(action)}
          >
            {action.badge && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {action.badge}
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div className="text-2xl">{action.icon}</div>
            </div>
            
            <h3 className={`text-lg font-medium mb-2 ${getTextColorClasses(action.color)}`}>
              {action.title}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {action.description}
            </p>
            
            <button
              className={`
                w-full text-white px-4 py-2 rounded-md transition-colors text-sm font-medium
                ${action.disabled 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : getButtonColorClasses(action.color)
                }
              `}
              disabled={action.disabled}
            >
              {action.disabled ? 'Unavailable' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}