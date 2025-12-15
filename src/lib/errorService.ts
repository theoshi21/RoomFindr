import { AppError } from '@/hooks/useErrorHandler';

export interface ErrorReport {
  error: Error;
  context?: string;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  additionalData?: Record<string, any>;
}

class ErrorService {
  private reports: ErrorReport[] = [];
  private maxReports = 100;

  logError(error: Error, context?: string, additionalData?: Record<string, any>) {
    const report: ErrorReport = {
      error,
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData,
    };

    this.reports.unshift(report);
    
    // Keep only the most recent reports
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(0, this.maxReports);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', report);
    }

    // In production, you would send this to your error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    this.sendToErrorTrackingService(report);
  }

  private async sendToErrorTrackingService(report: ErrorReport) {
    // This is where you would integrate with your error tracking service
    // For now, we'll just store it locally
    try {
      // Example integration:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  getReports(): ErrorReport[] {
    return [...this.reports];
  }

  clearReports() {
    this.reports = [];
  }

  // Helper method to create standardized errors
  createError(
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

  // Network error helper
  createNetworkError(message = 'Network request failed'): AppError {
    return this.createError(message, 'NETWORK_ERROR', 0);
  }

  // Validation error helper
  createValidationError(message: string, field?: string): AppError {
    return this.createError(message, 'VALIDATION_ERROR', 400, { field });
  }

  // Authentication error helper
  createAuthError(message = 'Authentication required'): AppError {
    return this.createError(message, 'AUTH_ERROR', 401);
  }

  // Permission error helper
  createPermissionError(message = 'Permission denied'): AppError {
    return this.createError(message, 'PERMISSION_ERROR', 403);
  }

  // Not found error helper
  createNotFoundError(message = 'Resource not found'): AppError {
    return this.createError(message, 'NOT_FOUND_ERROR', 404);
  }
}

export const errorService = new ErrorService();

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorService.logError(
      new Error(`Unhandled promise rejection: ${event.reason}`),
      'unhandledrejection'
    );
  });

  // Global error handler for uncaught exceptions
  window.addEventListener('error', (event) => {
    errorService.logError(
      event.error || new Error(event.message),
      'uncaught-exception',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });
}

// Supabase error handler
export function handleSupabaseError(error: any): AppError {
  if (error?.code === 'PGRST301') {
    return errorService.createNotFoundError('Resource not found');
  }
  
  if (error?.code === '23505') {
    return errorService.createValidationError('This record already exists');
  }
  
  if (error?.code === '42501') {
    return errorService.createPermissionError('Insufficient permissions');
  }
  
  if (error?.message?.includes('JWT')) {
    return errorService.createAuthError('Session expired. Please log in again.');
  }
  
  return errorService.createError(
    error?.message || 'Database operation failed',
    'SUPABASE_ERROR',
    500,
    { originalError: error }
  );
}

// API error handler
export function handleApiError(response: Response, data?: any): AppError {
  const message = data?.message || data?.error || `Request failed with status ${response.status}`;
  
  switch (response.status) {
    case 400:
      return errorService.createValidationError(message);
    case 401:
      return errorService.createAuthError(message);
    case 403:
      return errorService.createPermissionError(message);
    case 404:
      return errorService.createNotFoundError(message);
    case 429:
      return errorService.createError(message, 'RATE_LIMIT_ERROR', 429);
    case 500:
    case 502:
    case 503:
    case 504:
      return errorService.createError(
        'Server error. Please try again later.',
        'SERVER_ERROR',
        response.status
      );
    default:
      return errorService.createError(message, 'API_ERROR', response.status);
  }
}