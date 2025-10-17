'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app';
import { useNotifications } from '@/hooks/useNotifications';
import { AlertCircle, X } from 'lucide-react';

export function GlobalErrorHandler() {
  const { globalError, clearGlobalError } = useAppStore();
  const { showError } = useNotifications();

  // Handle unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      let message = 'An unexpected error occurred';
      if (event.reason instanceof Error) {
        message = event.reason.message;
      } else if (typeof event.reason === 'string') {
        message = event.reason;
      }
      
      showError('Unhandled Error', message);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, [showError]);

  // Handle global JavaScript errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      showError('JavaScript Error', event.message);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [showError]);

  if (!globalError) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Application Error
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{globalError}</p>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={clearGlobalError}
                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}