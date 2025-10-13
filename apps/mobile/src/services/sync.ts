import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore, useSyncStore } from '@store/index';
import {
  GET_CUSTOMERS,
  GET_PRODUCTS,
  GET_SALES_ORDERS,
} from '../graphql/queries';
import { apolloClient } from './apollo';
import { databaseService } from './database';

class SyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Monitor network status
    NetInfo.addEventListener(state => {
      useSyncStore.getState().setOnlineStatus(state.isConnected ?? false);

      // Auto-sync when coming back online
      if (state.isConnected) {
        this.syncData();
      }
    });

    // Set up periodic sync (every 5 minutes when online)
    this.syncInterval = setInterval(
      () => {
        const syncState = useSyncStore.getState();
        if (syncState.isOnline && !syncState.isSyncing) {
          this.syncData();
        }
      },
      5 * 60 * 1000
    );

    // Initial sync
    const netInfo = await NetInfo.fetch();
    useSyncStore.getState().setOnlineStatus(netInfo.isConnected ?? false);

    if (netInfo.isConnected) {
      await this.syncData();
    }

    this.isInitialized = true;
  }

  async syncData() {
    const syncState = useSyncStore.getState();

    if (!syncState.isOnline || syncState.isSyncing) {
      return;
    }

    useSyncStore.getState().setSyncStatus(true);
    useSyncStore.getState().setSyncProgress(0);

    try {
      // Step 1: Push pending changes (25% progress)
      await this.pushPendingChanges();
      useSyncStore.getState().setSyncProgress(25);

      // Step 2: Pull customers (50% progress)
      await this.pullCustomers();
      useSyncStore.getState().setSyncProgress(50);

      // Step 3: Pull products (75% progress)
      await this.pullProducts();
      useSyncStore.getState().setSyncProgress(75);

      // Step 4: Pull sales orders (100% progress)
      await this.pullSalesOrders();
      useSyncStore.getState().setSyncProgress(100);

      // Update last sync time
      useSyncStore.getState().setLastSyncAt(new Date());

      // Clear pending changes count
      useSyncStore.getState().setPendingChanges(0);
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      useSyncStore.getState().setSyncStatus(false);
      useSyncStore.getState().setSyncProgress(0);
    }
  }

  private async pushPendingChanges() {
    const offlineState = useOfflineStore.getState();
    const pendingActions = offlineState.pendingActions;

    for (const action of pendingActions) {
      try {
        await this.executePendingAction(action);
        useOfflineStore
          .getState()
          .updateSyncStatus(action.entity, action.data.id, 'synced');
      } catch (error) {
        console.error(`Failed to sync ${action.type} ${action.entity}:`, error);
        useOfflineStore
          .getState()
          .updateSyncStatus(action.entity, action.data.id, 'error');
      }
    }

    // Clear successfully synced actions
    useOfflineStore.getState().clearPendingActions();
  }

  private async executePendingAction(action: any) {
    const { type, entity, data } = action;

    switch (entity) {
      case 'customers':
        return this.syncCustomer(type, data);
      case 'products':
        return this.syncProduct(type, data);
      case 'salesOrders':
        return this.syncSalesOrder(type, data);
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  private async syncCustomer(type: string, data: any) {
    // Implementation would depend on your GraphQL mutations
    // This is a placeholder
    console.log(`Syncing customer ${type}:`, data);
  }

  private async syncProduct(type: string, data: any) {
    // Implementation would depend on your GraphQL mutations
    console.log(`Syncing product ${type}:`, data);
  }

  private async syncSalesOrder(type: string, data: any) {
    // Implementation would depend on your GraphQL mutations
    console.log(`Syncing sales order ${type}:`, data);
  }

  private async pullCustomers() {
    try {
      // This would be your actual GraphQL query
      const result = await apolloClient.query({
        query: GET_CUSTOMERS,
        fetchPolicy: 'network-only',
      });

      const customers = result.data.customers.reduce(
        (acc: any, customer: any) => {
          acc[customer.id] = {
            ...customer,
            needsSync: false,
            syncStatus: 'synced',
          };
          return acc;
        },
        {}
      );

      useOfflineStore.getState().setEntities('customers', customers);

      // Also store in local database
      await databaseService.storeCustomers(result.data.customers);
    } catch (error) {
      console.error('Failed to pull customers:', error);
      throw error;
    }
  }

  private async pullProducts() {
    try {
      // This would be your actual GraphQL query
      const result = await apolloClient.query({
        query: GET_PRODUCTS,
        fetchPolicy: 'network-only',
      });

      const products = result.data.products.reduce((acc: any, product: any) => {
        acc[product.id] = {
          ...product,
          needsSync: false,
          syncStatus: 'synced',
        };
        return acc;
      }, {});

      useOfflineStore.getState().setEntities('products', products);

      // Also store in local database
      await databaseService.storeProducts(result.data.products);
    } catch (error) {
      console.error('Failed to pull products:', error);
      throw error;
    }
  }

  private async pullSalesOrders() {
    try {
      // This would be your actual GraphQL query
      const result = await apolloClient.query({
        query: GET_SALES_ORDERS,
        fetchPolicy: 'network-only',
      });

      const salesOrders = result.data.salesOrders.reduce(
        (acc: any, order: any) => {
          acc[order.id] = {
            ...order,
            needsSync: false,
            syncStatus: 'synced',
          };
          return acc;
        },
        {}
      );

      useOfflineStore.getState().setEntities('salesOrders', salesOrders);

      // Also store in local database
      await databaseService.storeSalesOrders(result.data.salesOrders);
    } catch (error) {
      console.error('Failed to pull sales orders:', error);
      throw error;
    }
  }

  async forceSyncEntity(entityType: string, entityId: string) {
    useOfflineStore
      .getState()
      .updateSyncStatus(entityType, entityId, 'syncing');

    try {
      // Implementation would depend on the entity type
      // This is a placeholder
      console.log(`Force syncing ${entityType} ${entityId}`);

      useOfflineStore
        .getState()
        .updateSyncStatus(entityType, entityId, 'synced');
    } catch (error) {
      useOfflineStore
        .getState()
        .updateSyncStatus(entityType, entityId, 'error');
      throw error;
    }
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isInitialized = false;
  }
}

export const syncService = new SyncService();
