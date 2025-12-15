'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

export function useErrorHandler() {
  const { addToast } = useToast();

  const handleError = useCallback((error: unknown, context?: string) => {
    console.error('Error occurred:', error, context ? `Context: ${context}` : '');

    let message = 'An unexpected error occurred';
    let title = 'Error';

    if (error instanceof Error) {
      const appError = error as AppError;
      
      // Handle specific error types
      if (appError.statusCode === 401) {
        title = 'Authentication Required';
        message = 'Please log in to continue';
      } else if (appError.statusCode === 403) {
        title = 'Access Denied';
        message = 'You don\'t have permission to perform this action';
      } else if (appError.statusCode === 404) {
        title = 'Not Found';
        message = 'The requested resource was not found';
      } else if (appError.statusCode === 429) {
        title = 'Rate Limited';
        message = 'Too many requests. Please try again later';
      } else if (appError.statusCode && appError.statusCode >= 500) {
        title = 'Server Error';
        message = 'Our servers are experiencing issues. Please try again later';
      } else if (appError.code === 'NETWORK_ERROR') {
        title = 'Connection Error';
        message = 'Please check your internet connection and try again';
      } else if (appError.code === 'VALIDATION_ERROR') {
        title = 'Validation Error';
        message = appError.message || 'Please check your input and try again';
      } else if (appError.message) {
        message = appError.message;
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    addToast(message, 'error');
  }, [addToast]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    onError?: (error: unknown) => void
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context);
      onError?.(error);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
}

export function createAppError(
  message: string,
  code?: string,
  statusCode?: number,
  details?: any
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}