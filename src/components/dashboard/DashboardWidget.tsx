'use client'

import React from 'react'

interface DashboardWidgetProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'gray'
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  onClick?: () => void
  loading?: boolean
}

export function DashboardWidget({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  onClick,
  loading = false
}: DashboardWidgetProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900'
  }

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
    gray: 'text-gray-600'
  }

  return (
    <div
      className={`
        p-6 rounded-lg border transition-all duration-200
        ${colorClasses[color]}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className={`${iconColorClasses[color]}`}>
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-20 mb-1"></div>
              {subtitle && <div className="h-4 bg-gray-300 rounded w-16"></div>}
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </>
          )}
        </div>
        
        {trend && !loading && (
          <div className="text-right">
            <div className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
            <div className="text-xs text-gray-500">{trend.label}</div>
          </div>
        )}
      </div>
    </div>
  )
}