'use client';

import React from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/lib/pwa/pwa-manager';

/**
 * PWA Install Prompt Component
 * Shows a prompt to install the app when it's available
 */
export function PWAInstallPrompt() {
  const { canInstall, isStandalone, showInstallPrompt } = usePWA();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);

  React.useEffect(() => {
    // Show prompt if app can be installed and is not already standalone
    if (canInstall && !isStandalone) {
      // Delay showing the prompt to avoid being too aggressive
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [canInstall, isStandalone]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const installed = await showInstallPrompt();
      if (installed) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Don't show again for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  // Don't show if dismissed in this session
  if (typeof window !== 'undefined' && sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  if (!isVisible || !canInstall || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Install ERPNext</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-600 mb-4">
          Install ERPNext on your device for faster access and offline functionality.
        </p>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalling ? 'Installing...' : 'Install'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Offline Status Indicator
 * Shows when the app is offline
 */
export function OfflineStatusIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-2 text-sm font-medium">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span>You're offline - Some features may be limited</span>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;