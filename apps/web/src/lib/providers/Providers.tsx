'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { SessionProvider } from './SessionProvider';
import { PerformanceProvider } from './PerformanceProvider';
import { SecurityProvider } from './SecurityProvider';
import { NotificationSystem } from '@/components/ui/NotificationSystem';
import { GlobalErrorHandler } from '@/components/ui/GlobalErrorHandler';
import { PerformanceDashboard, usePerformanceDashboard } from '@/components/ui/PerformanceDashboard';
import { WebSocketProvider } from '@/lib/websocket/provider';
import { RealtimeNotificationManager } from '@/components/notifications/RealtimeNotificationManager';
import { createQueryClient } from '@/lib/query/config';

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const performanceDashboard = usePerformanceDashboard();

  return (
    <>
      {children}
      <NotificationSystem />
      <GlobalErrorHandler />
      <RealtimeNotificationManager />
      <PerformanceDashboard 
        isVisible={performanceDashboard.isVisible}
        onClose={performanceDashboard.hide}
      />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PerformanceProvider enableInProduction={false}>
          <SessionProvider>
            <SecurityProvider>
              <WebSocketProvider autoConnect={true}>
                <ProvidersContent>
                  {children}
                </ProvidersContent>
              </WebSocketProvider>
            </SecurityProvider>
          </SessionProvider>
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </PerformanceProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}