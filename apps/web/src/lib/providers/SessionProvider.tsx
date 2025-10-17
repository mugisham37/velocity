'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { sessionManager } from '@/lib/auth';

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // Don't start session management on login page
    if (pathname === '/login' || !isAuthenticated) {
      return;
    }

    // Start session monitoring
    sessionManager.start({
      onSessionExpired: () => {
        console.warn('Session expired, redirecting to login');
        logout();
        router.push('/login');
      },
      onSessionWarning: (timeLeft) => {
        console.warn(`Session expires in ${Math.floor(timeLeft / 60000)} minutes`);
        // TODO: Show session warning notification
      },
    });

    return () => {
      sessionManager.stop();
    };
  }, [isAuthenticated, pathname, logout, router]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Check session when page becomes visible
        const isValid = await sessionManager.checkSession();
        if (!isValid) {
          logout();
          router.push('/login');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, logout, router]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      if (isAuthenticated) {
        // Check session when coming back online
        const isValid = await sessionManager.checkSession();
        if (!isValid) {
          logout();
          router.push('/login');
        }
      }
    };

    const handleOffline = () => {
      console.warn('Application is offline');
      // TODO: Show offline notification
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, logout, router]);

  return <>{children}</>;
}