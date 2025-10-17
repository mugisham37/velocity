'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Printer, 
  RefreshCw, 
  Users, 
  BarChart3,
  LogOut
} from 'lucide-react';
import { OfflineStatusIndicator } from './OfflineStatusIndicator';
import { POSClosingInterface } from './POSClosingInterface';
import { POSAnalytics } from './POSAnalytics';
import { usePOSStore } from '@/stores/pos';
import { useAuth } from '@/hooks/useAuth';

export function POSToolbar() {
  const { user, logout } = useAuth();
  const store = usePOSStore();
  const currentProfile = store.currentProfile as import('@/types/pos').POSProfile | null;
  const openSettings = store.openSettings;
  const [showClosing, setShowClosing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);



  return (
    <div className="flex items-center justify-between">
      {/* Left Section - Profile Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {currentProfile?.name?.charAt(0) || 'P'}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{currentProfile?.name}</h3>
            <p className="text-xs text-gray-500">{currentProfile?.warehouse}</p>
          </div>
        </div>

        {/* Connection Status */}
        <OfflineStatusIndicator />
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center space-x-2">

        {/* Print Last Receipt */}
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-1"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </Button>

        {/* POS Analytics */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAnalytics(true)}
          className="flex items-center space-x-1"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </Button>

        {/* POS Closing */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowClosing(true)}
          className="flex items-center space-x-1"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Closing</span>
        </Button>

        {/* Settings */}
        <Button
          variant="outline"
          size="sm"
          onClick={openSettings}
          className="flex items-center space-x-1"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Button>

        {/* User Menu */}
        <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="w-3 h-3 text-gray-600" />
            </div>
            <span className="text-sm text-gray-700">{user?.full_name}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center space-x-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit</span>
          </Button>
        </div>
      </div>

      {/* Modals */}
      <POSClosingInterface 
        isOpen={showClosing} 
        onClose={() => setShowClosing(false)} 
      />
      <POSAnalytics 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)} 
      />
    </div>
  );
}