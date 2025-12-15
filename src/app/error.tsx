'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  const getErrorMessage = () => {
    if (error.message.includes('NEXT_NOT_FOUND')) {
      return {
        title: 'Page Not Found',
        message: 'The page you\'re looking for doesn\'t exist or has been moved.',
        showReset: false,
      };
    }

    if (error.message.includes('Network')) {
      return {
        title: 'Connection Error',
        message: 'Please check your internet connection and try again.',
        showReset: true,
      };
    }

    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again.',
      showReset: true,
    };
  };

  const { title, message, showReset } = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {message}
        </p>

        <div className="space-y-3">
          {showReset && (
            <Button
              onClick={reset}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              fullWidth
            >
              Try Again
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            fullWidth
          >
            Go Back
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/'}
            leftIcon={<Home className="h-4 w-4" />}
            fullWidth
          >
            Go Home
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development)
            </summary>
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">
                {error.stack}
              </pre>
              {error.digest && (
                <p className="mt-2 text-xs text-gray-600">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}