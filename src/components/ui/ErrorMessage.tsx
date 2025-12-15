'use client';

import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

const variantStyles = {
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles = {
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

export function ErrorMessage({
  title,
  message,
  variant = 'error',
  dismissible = false,
  onDismiss,
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'border rounded-md p-4',
        variantStyles[variant],
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className={cn('h-5 w-5', iconStyles[variant])} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Retry the failed action"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Try Again
            </button>
          )}
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className={cn(
                'inline-flex rounded-md p-1.5 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2',
                variant === 'error' && 'hover:bg-red-600 focus:ring-red-500',
                variant === 'warning' && 'hover:bg-yellow-600 focus:ring-yellow-500',
                variant === 'info' && 'hover:bg-blue-600 focus:ring-blue-500'
              )}
              aria-label="Dismiss error message"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <p className={cn('text-sm text-red-600 mt-1', className)} role="alert">
      {message}
    </p>
  );
}