import NetInfo from '@react-native-community/netinfo';
import { store } from '@store/index';
import {
  clearPendingActions,
  setEntities,
  updateSyncStatus,
} from '@store/offline';
import {
  setLastSyncAt,
  setOnlineStatus,
  setPendingChanges,
  setSyncProgress,
  setSyncStatus,
} from '@store/sync';
import { apolloClient } from './apollo';
import { databaseService } from './database';

class SyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Monitor network status
    NetInfo.addEventListener(state => {
      store.dispatch(setOnlineStatus(state.isConnected ?? false));

      // Auto-sync when coming back online
      if (state.isConnected) {
        this.syncData();
      }
    });

    // Set up periodic sync (every 5 minutes when online)
    this.syncInterval = setInterval(
      () => {
        const state = store.getState();
        if (state.sync.isOnline && !state.sync.isSyncing) {
          this.syncData();
        }
      },
      5 * 60 * 1000
    );

    // Initial sync
    const netInfo = await NetInfo.fetch();
    store.dispatch(setOnlineStatus(netInfo.isConnected ?? false));

    if (netInfo.isConnected) {
      await this.syncData();
    }

    this.isInitialized = true;
  }

  async syncData() {
    const state = store.getState();

    if (!state.sync.isOnline || state.sync.isSyncing) {
      return;
    }

    store.dispatch(setSyncStatus(true));
    store.dispatch(setSyncProgress(0));

    try {
      // Step 1: Push pending changes (25% progress)
      await this.pushPendingChanges();
      store.dispatch(setSyncProgress(25));

      // Step 2: Pull customers (50% progress)
      await this.pullCustomers();
      store.dispatch(setSyncProgress(50));

      // Step 3: Pull products (75% progress)
      await this.pullProducts();
      store.dispatch(setSyncProgress(75));

      // Step 4: Pull sales orders (100% progress)
      await this.pullSalesOrders();
      store.dispatch(setSyncProgress(100));

      // Update last sync time
      store.dispatch(setLastSyncAt(new Date()));

      // Clear pending changes count
      store.dispatch(setPendingChanges(0));
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      store.dispatch(setSyncStatus(false));
      store.dispatch(setSyncProgress(0));
    }
  }

  private async pushPendingChanges() {
    const state = store.getState();
    const pendingActions = state.offline.pendingActions;

    for (const action of pendingActions) {
      try {
        await this.executePendingAction(action);
        store.dispatch(
          updateSyncStatus({
            entityType: action.entity,
            id: action.data.id,
            status: 'synced',
          })
        );
      } catch (error) {
        console.error(`Failed to sync ${action.type} ${action.entity}:`, error);
        store.dispatch(
          updateSyncStatus({
            entityType: action.entity,
            id: action.data.id,
            status: 'error',
          })
        );
      }
    }

    // Clear successfully synced actions
    store.dispatch(clearPendingActions());
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
        query: `
          query GetCustomers {
            customers {
              id
              name
              email
              phone
              address {
                street
                city
                state
                zipCode
                country
              }
              creditLimit
              balance
              status
              lastModified
            }
          }
        `,
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

      store.dispatch(
        setEntities({ entityType: 'customers', entities: customers })
      );

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
        query: `
          query GetProducts {
            products {
              id
              name
              sku
              barcode
              description
              price
              cost
              stockQuantity
              category
              images
              isActive
              lastModified
            }
          }
        `,
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

      store.dispatch(
        setEntities({ entityType: 'products', entities: products })
      );

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
        query: `
          query GetSalesOrders {
            salesOrders {
              id
              orderNumber
              customerId
              customer {
                id
                name
              }
              items {
                id
                productId
                product {
                  id
                  name
                  sku
                }
                quantity
                unitPrice
                discount
                total
              }
              subtotal
              tax
              total
              status
              orderDate
              deliveryDate
              notes
              signature
              lastModified
            }
          }
        `,
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

      store.dispatch(
        setEntities({ entityType: 'salesOrders', entities: salesOrders })
      );

      // Also store in local database
      await databaseService.storeSalesOrders(result.data.salesOrders);
    } catch (error) {
      console.error('Failed to pull sales orders:', error);
      throw error;
    }
  }

  async forceSyncEntity(entityType: string, entityId: string) {
    store.dispatch(
      updateSyncStatus({ entityType, id: entityId, status: 'syncing' })
    );

    try {
      // Implementation would depend on the entity type
      // This is a placeholder
      console.log(`Force syncing ${entityType} ${entityId}`);

      store.dispatch(
        updateSyncStatus({ entityType, id: entityId, status: 'synced' })
      );
    } catch (error) {
      store.dispatch(
        updateSyncStatus({ entityType, id: entityId, status: 'error' })
      );
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
