'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'pending' | 'loading';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
  },
  pending: {
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
  loading: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
};

const sizeConfig = {
  sm: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-2 py-1',
  },
  md: {
    icon: 'h-5 w-5',
    text: 'text-sm',
    padding: 'px-3 py-2',
  },
  lg: {
    icon: 'h-6 w-6',
    text: 'text-base',
    padding: 'px-4 py-3',
  },
};

export function StatusIndicator({
  status,
  message,
  size = 'md',
  showIcon = true,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border',
        config.bgColor,
        config.borderColor,
        sizeStyles.padding,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {showIcon && (
        <Icon
          className={cn(
            sizeStyles.icon,
            config.color,
            status === 'loading' && 'animate-spin',
            message && 'mr-2'
          )}
          aria-hidden="true"
        />
      )}
      {message && (
        <span className={cn(sizeStyles.text, config.color)}>
          {message}
        </span>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'verified' | 'unverified';
  size?: 'sm' | 'md';
  className?: string;
}

const badgeConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  verified: { label: 'Verified', color: 'bg-blue-100 text-blue-800' },
  unverified: { label: 'Unverified', color: 'bg-gray-100 text-gray-800' },
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = badgeConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, className }: ConnectionStatusProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          isConnected ? 'bg-green-500' : 'bg-red-500'
        )}
        aria-hidden="true"
      />
      <span className="text-sm text-gray-600">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}