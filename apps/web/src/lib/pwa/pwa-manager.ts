import React from 'react';

/**
 * PWA Manager - Handles Progressive Web App functionality
 * Including service worker registration, offline detection, and app installation
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isOnline = true;
  private onlineCallbacks: (() => void)[] = [];
  private offlineCallbacks: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      this.registerServiceWorker();
      this.setupOnlineOfflineDetection();
      this.setupInstallPrompt();
    }
  }

  /**
   * Register the service worker
   */
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('PWA: Service Worker registered successfully', registration);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                this.notifyUpdate();
              }
            });
          }
        });

        // Setup background sync
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          console.log('PWA: Background sync is supported');
        }

        return registration;
      } catch (error) {
        console.error('PWA: Service Worker registration failed', error);
      }
    } else {
      console.log('PWA: Service Worker not supported');
    }
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineOfflineDetection() {
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      console.log('PWA: Back online');
      this.isOnline = true;
      this.onlineCallbacks.forEach(callback => callback());
    });

    window.addEventListener('offline', () => {
      console.log('PWA: Gone offline');
      this.isOnline = false;
      this.offlineCallbacks.forEach(callback => callback());
    });
  }

  /**
   * Setup app installation prompt
   */
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      console.log('PWA: Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed successfully');
      this.deferredPrompt = null;
    });
  }

  /**
   * Check if the app can be installed
   */
  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * Show the install prompt
   */
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log('PWA: Install prompt result', outcome);
      this.deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('PWA: Install prompt failed', error);
      return false;
    }
  }

  /**
   * Check if the app is running in standalone mode
   */
  public isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Get online status
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add callback for when app goes online
   */
  public onOnline(callback: () => void) {
    this.onlineCallbacks.push(callback);
  }

  /**
   * Add callback for when app goes offline
   */
  public onOffline(callback: () => void) {
    this.offlineCallbacks.push(callback);
  }

  /**
   * Remove online callback
   */
  public removeOnlineCallback(callback: () => void) {
    const index = this.onlineCallbacks.indexOf(callback);
    if (index > -1) {
      this.onlineCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove offline callback
   */
  public removeOfflineCallback(callback: () => void) {
    const index = this.offlineCallbacks.indexOf(callback);
    if (index > -1) {
      this.offlineCallbacks.splice(index, 1);
    }
  }

  /**
   * Request background sync for offline data
   */
  public async requestBackgroundSync(tag: string = 'background-sync-forms') {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('PWA: Background sync registered', tag);
      } catch (error) {
        console.error('PWA: Background sync registration failed', error);
      }
    }
  }

  /**
   * Store form data for offline submission
   */
  public async storeOfflineFormData(data: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
  }) {
    // TODO: Implement IndexedDB storage
    console.log('PWA: Storing offline form data', data);
    
    // Request background sync
    await this.requestBackgroundSync();
  }

  /**
   * Request push notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('PWA: Notification permission', permission);
      return permission;
    }
    return 'denied';
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
          ),
        });
        
        console.log('PWA: Push subscription created', subscription);
        return subscription;
      } catch (error) {
        console.error('PWA: Push subscription failed', error);
      }
    }
    return null;
  }

  /**
   * Notify about service worker update
   */
  private notifyUpdate() {
    // You can implement a custom notification here
    console.log('PWA: New version available');
    
    // Example: Show a toast notification
    if (window.confirm('A new version is available. Reload to update?')) {
      window.location.reload();
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// React hook for PWA functionality
export function usePWA() {
  const [isOnline, setIsOnline] = React.useState(pwaManager.getOnlineStatus());
  const [canInstall, setCanInstall] = React.useState(pwaManager.canInstall());

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    pwaManager.onOnline(handleOnline);
    pwaManager.onOffline(handleOffline);

    // Check install availability periodically
    const checkInstall = () => setCanInstall(pwaManager.canInstall());
    const interval = setInterval(checkInstall, 1000);

    return () => {
      pwaManager.removeOnlineCallback(handleOnline);
      pwaManager.removeOfflineCallback(handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    canInstall,
    isStandalone: pwaManager.isStandalone(),
    showInstallPrompt: () => pwaManager.showInstallPrompt(),
    requestNotificationPermission: () => pwaManager.requestNotificationPermission(),
    subscribeToPushNotifications: () => pwaManager.subscribeToPushNotifications(),
    storeOfflineFormData: (data: any) => pwaManager.storeOfflineFormData(data),
  };
}

export default pwaManager;