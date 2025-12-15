'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { useFormValidation } from '@/hooks/useFormValidation';

export function ErrorHandlingExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { addToast } = useToast();
  const { handleAsyncError } = useErrorHandler();

  const { values, errors, getFieldProps, validateAll } = useFormValidation(
    { email: '', name: '' },
    {
      email: { required: true, email: true },
      name: { required: true, minLength: 2 },
    }
  );

  const simulateNetworkError = async () => {
    setLoading(true);
    setError(null);

    await handleAsyncError(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw new Error('Network connection failed');
    }, 'network-simulation');

    setLoading(false);
  };

  const simulateSuccess = async () => {
    setLoading(true);
    setError(null);

    const result = await handleAsyncError(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    }, 'success-simulation');

    if (result) {
      addToast('Operation completed successfully!', 'success');
    }

    setLoading(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateAll()) {
      addToast('Form submitted successfully!', 'success');
      setShowModal(false);
    } else {
      addToast('Please fix the form errors', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Error Handling & UX Components Demo
      </h2>

      {/* Error Display */}
      {error && (
        <ErrorMessage
          message={error}
          dismissible
          onDismiss={() => setError(null)}
          onRetry={() => setError(null)}
        />
      )}

      {/* Loading States */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Loading States</h3>
        <div className="flex space-x-4">
          <Button
            onClick={simulateNetworkError}
            loading={loading}
            loadingText="Simulating error..."
          >
            Simulate Network Error
          </Button>
          
          <Button
            onClick={simulateSuccess}
            loading={loading}
            loadingText="Processing..."
            variant="secondary"
          >
            Simulate Success
          </Button>
        </div>

        {loading && (
          <div className="p-4 border rounded-lg">
            <LoadingSpinner text="Processing your request..." />
          </div>
        )}
      </div>

      {/* Modal with Form Validation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Modal & Form Validation</h3>
        <Button onClick={() => setShowModal(true)}>
          Open Form Modal
        </Button>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Example Form"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <FormField
              label="Email"
              type="email"
              required
              {...getFieldProps('email')}
            />
            
            <FormField
              label="Name"
              required
              {...getFieldProps('name')}
            />

            <div className="flex space-x-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Submit
              </Button>
            </div>
          </form>
        </Modal>
      </div>

      {/* Error Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Different Error Types</h3>
        <div className="space-y-3">
          <ErrorMessage
            variant="error"
            title="Error"
            message="This is an error message with retry option"
            onRetry={() => console.log('Retry clicked')}
          />
          
          <ErrorMessage
            variant="warning"
            title="Warning"
            message="This is a warning message"
            dismissible
            onDismiss={() => console.log('Warning dismissed')}
          />
          
          <ErrorMessage
            variant="info"
            title="Information"
            message="This is an informational message"
          />
        </div>
      </div>
    </div>
  );
}