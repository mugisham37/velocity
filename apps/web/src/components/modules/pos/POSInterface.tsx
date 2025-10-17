'use client';

import React, { useState, useEffect } from 'react';
import { POSLayout } from './POSLayout';
import { ProductGrid } from './ProductGrid';
import { POSCart } from './POSCart';
import { CustomerSelector } from './CustomerSelector';
import { BarcodeScanner } from './BarcodeScanner';
import { POSToolbar } from './POSToolbar';
import { PaymentInterface } from './PaymentInterface';
import { ReceiptInterface } from './ReceiptInterface';
import { usePOSStore } from '@/stores/pos';
import { useAuth } from '@/hooks/useAuth';

export function POSInterface() {
  const { user } = useAuth();
  const { 
    currentProfile, 
    selectedCustomer, 
    cartItems, 
    isOffline,
    currentView,
    initializePOS,
    loadPOSProfile 
  } = usePOSStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initPOS = async () => {
      try {
        await initializePOS();
        // Load default POS profile or user's last used profile
        await loadPOSProfile();
      } catch (error) {
        console.error('Failed to initialize POS:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      initPOS();
    }
  }, [user, initializePOS, loadPOSProfile]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing POS System...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No POS Profile Found</h2>
          <p className="text-gray-600">Please configure a POS Profile to continue.</p>
        </div>
      </div>
    );
  }

  // Render different views based on current state
  if (currentView === 'payment') {
    return <PaymentInterface />;
  }

  if (currentView === 'receipt') {
    return <ReceiptInterface />;
  }

  return (
    <POSLayout>
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <POSToolbar />
      </div>

      {/* Main POS Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Customer Selection */}
          <div className="bg-white border-b border-gray-200 p-4">
            <CustomerSelector />
          </div>

          {/* Barcode Scanner */}
          <div className="bg-white border-b border-gray-200 p-3">
            <BarcodeScanner />
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-auto p-4">
            <ProductGrid />
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <POSCart />
        </div>
      </div>

      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-50">
          <span className="font-medium">Offline Mode</span> - Changes will sync when connection is restored
        </div>
      )}
    </POSLayout>
  );
}