'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { InlineError } from './ErrorMessage';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  loading?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, required, loading, className, id, ...props }, ref) => {
    const fieldId = id || `field-${Math.random().toString(36).substring(2)}`;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium text-gray-700',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            className={cn(
              'block w-full rounded-md border-gray-300 shadow-sm',
              'focus:border-blue-500 focus:ring-blue-500',
              'disabled:bg-gray-50 disabled:text-gray-500',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              loading && 'pr-10',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error && errorId,
              helperText && helperId
            )}
            disabled={loading || props.disabled}
            {...props}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        {error && <InlineError message={error} />}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  loading?: boolean;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, helperText, required, loading, className, id, ...props }, ref) => {
    const fieldId = id || `field-${Math.random().toString(36).substring(2)}`;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium text-gray-700',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            'block w-full rounded-md border-gray-300 shadow-sm',
            'focus:border-blue-500 focus:ring-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            error && errorId,
            helperText && helperId
          )}
          disabled={loading || props.disabled}
          {...props}
        />
        {error && <InlineError message={error} />}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  loading?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, helperText, required, loading, options, placeholder, className, id, ...props }, ref) => {
    const fieldId = id || `field-${Math.random().toString(36).substring(2)}`;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium text-gray-700',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            'block w-full rounded-md border-gray-300 shadow-sm',
            'focus:border-blue-500 focus:ring-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            error && errorId,
            helperText && helperId
          )}
          disabled={loading || props.disabled}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <InlineError message={error} />}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';