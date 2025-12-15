'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <li key={step} className={cn('relative', index !== steps.length - 1 && 'pr-8 sm:pr-20')}>
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    'absolute inset-0 flex items-center',
                    'top-4 left-4 -ml-px h-0.5 w-full',
                    isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                  )}
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isCompleted && 'bg-blue-600 text-white',
                    isCurrent && 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2',
                    isUpcoming && 'bg-gray-200 text-gray-500'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={cn(
                  'ml-4 text-sm font-medium',
                  isCompleted && 'text-gray-900',
                  isCurrent && 'text-blue-600',
                  isUpcoming && 'text-gray-500'
                )}>
                  {step}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({ progress, label, showPercentage = true, className }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}