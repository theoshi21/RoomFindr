# Error Handling and User Experience Guide

This document outlines the comprehensive error handling and user experience improvements implemented in the RoomFindr application.

## Overview

The error handling system provides:
- Comprehensive error boundaries and recovery
- User-friendly error messages and recovery options
- Loading states and progress indicators
- Offline mode detection and handling
- Accessibility features and screen reader support
- Form validation with real-time feedback
- Toast notifications for user feedback

## Components

### Error Handling Components

#### ErrorBoundary
Catches JavaScript errors anywhere in the component tree and displays a fallback UI.

```tsx
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

#### ErrorMessage
Displays user-friendly error messages with optional retry functionality.

```tsx
import { ErrorMessage } from '@/components/ui/ErrorMessage';

<ErrorMessage
  title="Error"
  message="Something went wrong"
  variant="error"
  dismissible
  onDismiss={() => setError(null)}
  onRetry={() => retryOperation()}
/>
```

### Loading Components

#### LoadingSpinner
Displays loading indicators with optional text and full-screen mode.

```tsx
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/LoadingSpinner';

<LoadingSpinner size="lg" text="Loading..." />

<LoadingOverlay isLoading={loading}>
  <YourContent />
</LoadingOverlay>
```

#### Skeleton Components
Provides skeleton loading states for different content types.

```tsx
import { SkeletonCard, SkeletonList, SkeletonTable } from '@/components/ui/Skeleton';

<SkeletonCard />
<SkeletonList items={5} />
<SkeletonTable rows={5} columns={4} />
```

### Progress Components

#### ProgressIndicator
Shows step-by-step progress through multi-step processes.

```tsx
import { ProgressIndicator, ProgressBar } from '@/components/ui/ProgressIndicator';

<ProgressIndicator
  steps={['Step 1', 'Step 2', 'Step 3']}
  currentStep={1}
/>

<ProgressBar progress={75} label="Upload Progress" />
```

### Form Components

#### FormField
Enhanced form fields with validation and error display.

```tsx
import { FormField, TextAreaField, SelectField } from '@/components/ui/FormField';

<FormField
  label="Email"
  type="email"
  required
  error={errors.email}
  value={values.email}
  onChange={handleChange}
/>
```

### Modal Components

#### Modal
Accessible modal dialogs with focus management.

```tsx
import { Modal, ConfirmModal } from '@/components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  size="lg"
>
  <ModalContent />
</Modal>

<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleConfirm}
  title="Confirm Action"
  message="Are you sure you want to proceed?"
  variant="danger"
/>
```

### Notification Components

#### Toast
Global toast notification system.

```tsx
import { useToast } from '@/components/ui/Toast';

const { success, error, warning, info } = useToast();

success('Operation completed successfully!');
error('Something went wrong');
warning('Please check your input');
info('New feature available');
```

### Status Components

#### StatusIndicator
Shows status with appropriate icons and colors.

```tsx
import { StatusIndicator, StatusBadge } from '@/components/ui/StatusIndicator';

<StatusIndicator
  status="success"
  message="Connected"
  size="md"
/>

<StatusBadge status="verified" />
```

### Offline Detection

#### OfflineIndicator
Automatically detects and displays connection status.

```tsx
import { OfflineIndicator, useOnlineStatus } from '@/components/ui/OfflineIndicator';

<OfflineIndicator />

const isOnline = useOnlineStatus();
```

## Hooks

### useErrorHandler
Centralized error handling with automatic categorization.

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

const { handleError, handleAsyncError } = useErrorHandler();

// Handle synchronous errors
try {
  riskyOperation();
} catch (error) {
  handleError(error, 'operation-context');
}

// Handle async operations
const result = await handleAsyncError(
  () => apiCall(),
  'api-context'
);
```

### useFormValidation
Comprehensive form validation with real-time feedback.

```tsx
import { useFormValidation } from '@/hooks/useFormValidation';

const { values, errors, getFieldProps, validateAll, isValid } = useFormValidation(
  { email: '', password: '' },
  {
    email: { required: true, email: true },
    password: { required: true, minLength: 8 }
  }
);

<FormField
  label="Email"
  {...getFieldProps('email')}
/>
```

### useAccessibility
Accessibility utilities for screen readers and keyboard navigation.

```tsx
import { useAccessibility } from '@/hooks/useAccessibility';

const { announce, focusElement, trapFocus } = useAccessibility();

announce('Form submitted successfully');
focusElement('#next-input');
```

## Error Service

### Global Error Tracking
Centralized error logging and reporting.

```tsx
import { errorService } from '@/lib/errorService';

// Log errors
errorService.logError(error, 'context', { additionalData });

// Create specific error types
const networkError = errorService.createNetworkError();
const validationError = errorService.createValidationError('Invalid email');
const authError = errorService.createAuthError();
```

### API Error Handling
Standardized API error handling with retry logic.

```tsx
import { apiClient } from '@/lib/apiClient';

// Automatic error handling and retries
const data = await apiClient.get('/api/users', {}, 'user-fetch');

// File upload with progress
await apiClient.uploadFile('/api/upload', file, (progress) => {
  setUploadProgress(progress);
});
```

## Accessibility Features

### Screen Reader Support
- Proper ARIA labels and live regions
- Screen reader announcements for dynamic content
- Skip navigation links
- Focus management

### Keyboard Navigation
- Full keyboard accessibility
- Focus trapping in modals
- Arrow key navigation support
- Escape key handling

### Visual Accessibility
- High contrast mode detection
- Reduced motion preferences
- Adjustable font sizes
- Color-blind friendly design

## Usage Examples

### Basic Error Handling Setup

```tsx
// In your layout or app component
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';

export default function Layout({ children }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
        <OfflineIndicator />
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

### Form with Validation

```tsx
import { useFormValidation } from '@/hooks/useFormValidation';
import { FormField, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

export function ContactForm() {
  const { success, error } = useToast();
  const { values, errors, getFieldProps, validateAll } = useFormValidation(
    { name: '', email: '', message: '' },
    {
      name: { required: true, minLength: 2 },
      email: { required: true, email: true },
      message: { required: true, minLength: 10 }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAll()) {
      error('Please fix the form errors');
      return;
    }

    try {
      await submitForm(values);
      success('Message sent successfully!');
    } catch (err) {
      error('Failed to send message');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Name"
        required
        {...getFieldProps('name')}
      />
      
      <FormField
        label="Email"
        type="email"
        required
        {...getFieldProps('email')}
      />
      
      <TextAreaField
        label="Message"
        required
        {...getFieldProps('message')}
      />
      
      <Button type="submit">
        Send Message
      </Button>
    </form>
  );
}
```

### Async Operation with Error Handling

```tsx
import { useState } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Button, LoadingSpinner } from '@/components/ui';

export function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { handleAsyncError } = useErrorHandler();

  const fetchData = async () => {
    setLoading(true);
    
    const result = await handleAsyncError(
      () => fetch('/api/data').then(res => res.json()),
      'data-fetch'
    );
    
    if (result) {
      setData(result);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <Button onClick={fetchData} loading={loading}>
        Fetch Data
      </Button>
      
      {loading && <LoadingSpinner text="Loading data..." />}
      
      {data && <DataDisplay data={data} />}
    </div>
  );
}
```

## Best Practices

1. **Always wrap your app in ErrorBoundary and ToastProvider**
2. **Use handleAsyncError for all async operations**
3. **Provide meaningful error messages to users**
4. **Include retry options for recoverable errors**
5. **Show loading states for operations > 200ms**
6. **Use proper ARIA labels and announcements**
7. **Test with keyboard navigation and screen readers**
8. **Handle offline scenarios gracefully**
9. **Validate forms in real-time with clear feedback**
10. **Log errors for debugging and monitoring**

## Testing

The error handling system includes comprehensive tests for all components and hooks. Run tests with:

```bash
npm test
```

For property-based testing of error scenarios:

```bash
npm run test:properties
```

## Configuration

### Environment Variables

```env
# Error reporting (optional)
NEXT_PUBLIC_ERROR_REPORTING_URL=https://your-error-service.com/api/errors

# Feature flags
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
NEXT_PUBLIC_ENABLE_ACCESSIBILITY_TOOLBAR=true
```

### Customization

You can customize error messages, colors, and behavior by modifying the configuration in:
- `src/lib/errorService.ts` - Error categorization and reporting
- `src/hooks/useErrorHandler.ts` - Error handling logic
- `src/components/ui/` - Component styling and behavior

This comprehensive error handling system ensures a robust, accessible, and user-friendly experience throughout the RoomFindr application.