'use client';

import React from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * Offline page shown when the user is offline and tries to access unavailable content
 */
export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    // Wait a moment then try to reload
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-8">
          <WifiOff className="w-12 h-12 text-gray-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          It looks like you've lost your internet connection. Some features may not be available, 
          but you can still access cached content and work offline.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          {/* Retry Button */}
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
          </button>

          {/* Go Home Button */}
          <Link
            href="/"
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 flex items-center justify-center space-x-2 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Offline Features */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Offline
          </h3>
          <ul className="text-left space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>View cached documents and reports</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Create and edit forms (will sync when online)</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Access previously viewed data</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Limited search functionality</span>
            </li>
          </ul>
        </div>

        {/* Connection Status */}
        <div className="mt-6 text-xs text-gray-500">
          <p>Your data will automatically sync when you're back online.</p>
        </div>
      </div>
    </div>
  );
}