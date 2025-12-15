'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  text, 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 
        className={cn('animate-spin text-blue-600', sizeClasses[size])} 
        aria-hidden="true"
      />
      {text && (
        <span className="ml-2 text-gray-600" aria-live="polite">
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

export function LoadingOverlay({ children, isLoading, text }: {
  children: React.ReactNode;
  isLoading: boolean;
  text?: string;
}) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
}