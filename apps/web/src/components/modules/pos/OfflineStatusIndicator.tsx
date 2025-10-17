'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { usePOSStore } from '@/stores/pos';
import { OfflinePOSManager } from '@/lib/pos/offline-manager';

export function OfflineStatusIndicator() {
  const { isOffline, syncData, isLoading } = usePOSStore();
  const [storageInfo, setStorageInfo] = useState<{
    transactions: number;
    items: number;
    customers: number;
    lastSync: string | null;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const offlineManager = OfflinePOSManager.getInstance();
        const info = await offlineManager.getStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.error('Failed to load storage info:', error);
      }
    };

    loadStorageInfo();
    
    // Refresh storage info every 30 seconds
    const interval = setInterval(loadStorageInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (isOffline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncData();
      
      // Refresh storage info after sync
      const offlineManager = OfflinePOSManager.getInstance();
      const info = await offlineManager.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    
    const syncDate = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative">
      {/* Status Indicator */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isOffline
            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
      >
        {isOffline ? (
          <WifiOff className="w-4 h-4" />
        ) : (
          <Wifi className="w-4 h-4" />
        )}
        <span>{isOffline ? 'Offline' : 'Online'}</span>
        {storageInfo && storageInfo.transactions > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {storageInfo.transactions}
          </span>
        )}
      </button>

      {/* Details Dropdown */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Connection Status</h3>
              <div className={`flex items-center space-x-1 ${
                isOffline ? 'text-orange-600' : 'text-green-600'
              }`}>
                {isOffline ? (
                  <WifiOff className="w-4 h-4" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isOffline ? 'Offline Mode' : 'Connected'}
                </span>
              </div>
            </div>

            {/* Storage Information */}
            {storageInfo && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Cached Items:</span>
                  <span className="font-medium">{storageInfo.items}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Cached Customers:</span>
                  <span className="font-medium">{storageInfo.customers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pending Transactions:</span>
                  <span className={`font-medium ${
                    storageInfo.transactions > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {storageInfo.transactions}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="font-medium">{formatLastSync(storageInfo.lastSync)}</span>
                </div>
              </div>
            )}

            {/* Sync Status */}
            {storageInfo && storageInfo.transactions > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700">
                    {storageInfo.transactions} transaction(s) pending sync
                  </span>
                </div>
              </div>
            )}

            {/* Sync Button */}
            <div className="space-y-2">
              <Button
                onClick={handleSync}
                disabled={isOffline || isSyncing || isLoading}
                className="w-full"
                variant={storageInfo?.transactions ? 'default' : 'outline'}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>

              {isOffline && (
                <div className="text-xs text-gray-500 text-center">
                  Sync will be available when connection is restored
                </div>
              )}
            </div>

            {/* Status Messages */}
            <div className="mt-4 space-y-2">
              {isOffline ? (
                <div className="flex items-center space-x-2 text-sm text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span>Working offline - changes will sync automatically</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Connected - all changes are being saved</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}