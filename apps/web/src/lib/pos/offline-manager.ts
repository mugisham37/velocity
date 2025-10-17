import { POSTransaction, OfflinePOSData, POSProfile } from '@/types/pos';
import { Item, ItemGroup } from '@/types/stock';
import { Customer } from '@/types/crm';

export class OfflinePOSManager {
  private static instance: OfflinePOSManager;
  private dbName = 'pos-offline-db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private constructor() {}

  static getInstance(): OfflinePOSManager {
    if (!OfflinePOSManager.instance) {
      OfflinePOSManager.instance = new OfflinePOSManager();
    }
    return OfflinePOSManager.instance;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { 
            keyPath: 'offline_pos_name',
            autoIncrement: true 
          });
          transactionStore.createIndex('timestamp', 'timestamp', { unique: false });
          transactionStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'item_code' });
        }

        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'name' });
        }

        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'name' });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Transaction Management
  async saveOfflineTransaction(transaction: POSTransaction): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const offlineTransaction = {
      ...transaction,
      offline_pos_name: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      synced: 0, // 0 for false
    };

    return new Promise((resolve, reject) => {
      const transaction_db = this.db!.transaction(['transactions'], 'readwrite');
      const store = transaction_db.objectStore('transactions');
      const request = store.add(offlineTransaction);

      request.onsuccess = () => resolve(offlineTransaction.offline_pos_name);
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineTransactions(): Promise<POSTransaction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedTransactions(): Promise<POSTransaction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const index = store.index('synced');
      const request = index.getAll(0); // 0 for false, 1 for true

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markTransactionSynced(offlinePosName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      const getRequest = store.get(offlinePosName);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = 1; // 1 for true
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Transaction not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Data Caching
  async cacheItems(items: Item[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');

      // Clear existing items
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        // Add new items
        let completed = 0;
        const total = items.length;

        if (total === 0) {
          resolve();
          return;
        }

        items.forEach(item => {
          const addRequest = store.add(item);
          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) resolve();
          };
          addRequest.onerror = () => reject(addRequest.error);
        });
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  async getCachedItems(): Promise<Item[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheCustomers(customers: Customer[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['customers'], 'readwrite');
      const store = transaction.objectStore('customers');

      // Clear existing customers
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        // Add new customers
        let completed = 0;
        const total = customers.length;

        if (total === 0) {
          resolve();
          return;
        }

        customers.forEach(customer => {
          const addRequest = store.add(customer);
          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) resolve();
          };
          addRequest.onerror = () => reject(addRequest.error);
        });
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  async getCachedCustomers(): Promise<Customer[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheProfile(profile: POSProfile): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['profiles'], 'readwrite');
      const store = transaction.objectStore('profiles');
      const request = store.put(profile);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedProfile(profileName: string): Promise<POSProfile | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['profiles'], 'readonly');
      const store = transaction.objectStore('profiles');
      const request = store.get(profileName);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Metadata Management
  async setLastSyncTime(timestamp: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key: 'lastSync', value: timestamp });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLastSyncTime(): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get('lastSync');

      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Conflict Resolution
  async resolveConflicts(localTransaction: POSTransaction, serverTransaction: POSTransaction): Promise<POSTransaction> {
    // Simple conflict resolution: server wins
    // In a real implementation, you might want more sophisticated conflict resolution
    console.warn('Conflict detected, using server version:', {
      local: localTransaction.offline_pos_name,
      server: serverTransaction.name
    });
    
    return serverTransaction;
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const storeNames = ['transactions', 'items', 'customers', 'profiles', 'metadata'];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeNames, 'readwrite');
      let completed = 0;

      storeNames.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          completed++;
          if (completed === storeNames.length) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getStorageInfo(): Promise<{
    transactions: number;
    items: number;
    customers: number;
    lastSync: string | null;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const [transactions, items, customers, lastSync] = await Promise.all([
      this.getOfflineTransactions(),
      this.getCachedItems(),
      this.getCachedCustomers(),
      this.getLastSyncTime()
    ]);

    return {
      transactions: transactions.length,
      items: items.length,
      customers: customers.length,
      lastSync
    };
  }
}

// Network Status Manager
export class NetworkStatusManager {
  private static instance: NetworkStatusManager;
  private listeners: ((isOnline: boolean) => void)[] = [];
  private _isOnline: boolean = navigator.onLine;

  private constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  static getInstance(): NetworkStatusManager {
    if (!NetworkStatusManager.instance) {
      NetworkStatusManager.instance = new NetworkStatusManager();
    }
    return NetworkStatusManager.instance;
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  private handleOnline(): void {
    this._isOnline = true;
    this.notifyListeners(true);
  }

  private handleOffline(): void {
    this._isOnline = false;
    this.notifyListeners(false);
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => listener(isOnline));
  }

  addListener(listener: (isOnline: boolean) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (isOnline: boolean) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}

// Sync Manager
export class POSSyncManager {
  private offlineManager: OfflinePOSManager;
  private networkManager: NetworkStatusManager;
  private isSyncing: boolean = false;

  constructor() {
    this.offlineManager = OfflinePOSManager.getInstance();
    this.networkManager = NetworkStatusManager.getInstance();
  }

  async syncToServer(apiClient: any): Promise<{
    success: boolean;
    syncedCount: number;
    errors: string[];
  }> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!this.networkManager.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    this.isSyncing = true;
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      const unsyncedTransactions = await this.offlineManager.getUnsyncedTransactions();

      for (const transaction of unsyncedTransactions) {
        try {
          // Remove offline-specific fields before syncing
          const { offline_pos_name, timestamp, synced, ...serverTransaction } = transaction as any;
          
          // Save to server
          const savedTransaction = await apiClient.saveDoc('Sales Invoice', serverTransaction);
          
          // Mark as synced
          await this.offlineManager.markTransactionSynced(transaction.offline_pos_name!);
          syncedCount++;
        } catch (error) {
          console.error('Failed to sync transaction:', transaction.offline_pos_name, error);
          errors.push(`Transaction ${transaction.offline_pos_name}: ${error}`);
        }
      }

      // Update last sync time
      await this.offlineManager.setLastSyncTime(new Date().toISOString());

      return {
        success: errors.length === 0,
        syncedCount,
        errors
      };
    } finally {
      this.isSyncing = false;
    }
  }

  async downloadDataForOffline(apiClient: any, profile: POSProfile): Promise<void> {
    if (!this.networkManager.isOnline) {
      throw new Error('Cannot download data while offline');
    }

    try {
      // Download items
      const itemsResponse = await apiClient.getList('Item', {
        fields: [
          'name', 'item_code', 'item_name', 'item_group', 'stock_uom',
          'standard_rate', 'image', 'description', 'is_stock_item',
          'has_serial_no', 'has_batch_no', 'barcode'
        ],
        filters: {
          disabled: 0,
          is_sales_item: 1,
        },
        limit_page_length: 1000,
      });

      await this.offlineManager.cacheItems(itemsResponse.data);

      // Download customers
      const customersResponse = await apiClient.getList('Customer', {
        fields: ['name', 'customer_name', 'customer_type', 'mobile_no', 'email_id'],
        filters: { disabled: 0 },
        limit_page_length: 1000,
      });

      await this.offlineManager.cacheCustomers(customersResponse.data);

      // Cache profile
      await this.offlineManager.cacheProfile(profile);

      console.log('Offline data downloaded successfully');
    } catch (error) {
      console.error('Failed to download offline data:', error);
      throw error;
    }
  }
}