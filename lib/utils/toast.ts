/**
 * Toast notification utilities
 * Provides consistent user feedback across the application
 */

import toast from 'react-hot-toast';

export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Show success toast
 */
export function showSuccess(message: string, options?: ToastOptions) {
  return toast.success(message, {
    duration: options?.duration || 4000,
    position: options?.position || 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
}

/**
 * Show error toast
 */
export function showError(message: string, options?: ToastOptions) {
  return toast.error(message, {
    duration: options?.duration || 5000,
    position: options?.position || 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
}

/**
 * Show warning toast
 */
export function showWarning(message: string, options?: ToastOptions) {
  return toast(message, {
    icon: '⚠️',
    duration: options?.duration || 4000,
    position: options?.position || 'top-right',
    style: {
      background: '#f59e0b',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
}

/**
 * Show info toast
 */
export function showInfo(message: string, options?: ToastOptions) {
  return toast(message, {
    icon: 'ℹ️',
    duration: options?.duration || 4000,
    position: options?.position || 'top-right',
    style: {
      background: '#3b82f6',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
}

/**
 * Show loading toast (returns a function to update/remove it)
 */
export function showLoading(message: string, options?: ToastOptions) {
  return toast.loading(message, {
    position: options?.position || 'top-right',
    style: {
      background: '#6b7280',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
}

/**
 * Handle API error and show appropriate toast
 */
export function handleAPIError(error: any, defaultMessage: string = 'An error occurred') {
  let message = defaultMessage;
  
  if (error?.error) {
    message = error.error;
  } else if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    DUPLICATE: 'This resource already exists.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    RATE_LIMIT: 'Too many requests. Please try again later.',
    INTERNAL_ERROR: 'An internal error occurred. Please try again later.',
  };

  if (error?.code && errorMessages[error.code]) {
    message = errorMessages[error.code];
  }

  showError(message);
  return message;
}

/**
 * Show success message for API response
 */
export function handleAPISuccess(data: any, defaultMessage: string = 'Operation completed successfully') {
  const message = data?.message || defaultMessage;
  showSuccess(message);
  return message;
}

