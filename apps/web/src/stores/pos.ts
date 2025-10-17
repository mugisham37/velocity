import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  POSState, 
  POSProfile, 
  POSCartItem, 
  POSTransaction, 
  POSPayment,
  POSSettings,
  ItemSearchOptions,
  OfflinePOSData,
  POSClosingEntry
} from '@/types/pos';
import { Item, ItemGroup } from '@/types/stock';
import { Customer } from '@/types/crm';
import { apiClient } from '@/lib/api/client';
import { 
  OfflinePOSManager, 
  NetworkStatusManager, 
  POSSyncManager 
} from '@/lib/pos/offline-manager';

const defaultSettings: POSSettings = {
  show_item_code: true,
  show_item_stock: true,
  show_template_items: false,
  auto_add_item_to_cart: true,
  use_pos_in_offline_mode: true,
  auto_print_receipt: false,
  print_format_for_online: 'POS Invoice',
  print_format_for_offline: 'POS Invoice',
  display_items_in_stock: true,
  hide_images: false,
  hide_unavailable_items: true,
};

export const usePOSStore = create(
  persist(
    (set: any, get: any) => {
      // Initialize offline managers
      const offlineManager = OfflinePOSManager.getInstance();
      const networkManager = NetworkStatusManager.getInstance();
      const syncManager = new POSSyncManager();

      // Initialize offline database
      offlineManager.initialize().catch(console.error);

      // Listen for network changes
      networkManager.addListener((isOnline) => {
        set({ isOffline: !isOnline });
        
        if (isOnline) {
          // Auto-sync when coming back online
          get().syncData().catch(console.error);
        }
      });

      return {
        // Initial State
        currentProfile: null,
        settings: defaultSettings,
        items: [],
        itemGroups: [],
        customers: [],
        cartItems: [],
        selectedCustomer: null,
        cartDiscount: 0,
        cartTax: 0,
        cartTotal: 0,
        isOffline: !networkManager.isOnline,
        isLoading: false,
        currentView: 'products',
        currentTransaction: null,
        paymentMethods: [],

        // Initialize POS System
        initializePOS: async () => {
        set({ isLoading: true });
        try {
          const isOnline = networkManager.isOnline;
          set({ isOffline: !isOnline });

          if (isOnline) {
            // Load POS profiles and select default
            const profilesResponse = await apiClient.getList<POSProfile>('POS Profile', {
              fields: ['name', 'pos_profile_name', 'company', 'warehouse'],
              filters: { disabled: 0 }
            });

            if (profilesResponse.data.length > 0) {
              await get().loadPOSProfile(profilesResponse.data[0].name);
            }
          } else {
            // Load from offline cache
            try {
              const cachedProfile = await offlineManager.getCachedProfile('default');
              if (cachedProfile) {
                set({ currentProfile: cachedProfile });
                
                const [cachedItems, cachedCustomers] = await Promise.all([
                  offlineManager.getCachedItems(),
                  offlineManager.getCachedCustomers()
                ]);
                
                set({ 
                  items: cachedItems,
                  customers: cachedCustomers,
                  paymentMethods: cachedProfile.payments || []
                });
              }
            } catch (error) {
              console.error('Failed to load offline data:', error);
            }
          }
        } catch (error) {
          console.error('POS initialization failed:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Load POS Profile
      loadPOSProfile: async (profileName?: string) => {
        try {
          const profile = await apiClient.getDoc<POSProfile>('POS Profile', profileName || 'Default');
          set({ currentProfile: profile });

          // Load associated data
          await Promise.all([
            get().loadItems(),
            get().loadItemGroups(),
          ]);
          
          get().loadPaymentMethods(profile);

          // Save to offline storage
          await get().saveOfflineData();
        } catch (error) {
          console.error('Failed to load POS profile:', error);
          throw error;
        }
      },

      // Load Items
      loadItems: async () => {
        try {
          const { currentProfile, isOffline } = get();
          if (!currentProfile) return;

          if (isOffline) {
            // Load from offline cache
            const cachedItems = await offlineManager.getCachedItems();
            set({ items: cachedItems });
            return;
          }

          const filters: Record<string, unknown> = {
            disabled: 0,
            is_sales_item: 1,
          };

          // Filter by item groups if specified in profile
          if (currentProfile.item_groups && currentProfile.item_groups.length > 0) {
            filters.item_group = ['in', currentProfile.item_groups];
          }

          // Hide unavailable items if configured
          if (currentProfile.hide_unavailable_items) {
            filters.is_stock_item = 0; // Or add stock quantity filter
          }

          const itemsResponse = await apiClient.getList<Item>('Item', {
            fields: [
              'name', 'item_code', 'item_name', 'item_group', 'stock_uom',
              'standard_rate', 'image', 'description', 'is_stock_item',
              'has_serial_no', 'has_batch_no', 'barcode'
            ],
            filters,
            limit_page_length: 1000,
          });

          set({ items: itemsResponse.data });
          
          // Cache items for offline use
          await offlineManager.cacheItems(itemsResponse.data);
        } catch (error) {
          console.error('Failed to load items:', error);
          
          // Fallback to cached items if online request fails
          if (!get().isOffline) {
            try {
              const cachedItems = await offlineManager.getCachedItems();
              set({ items: cachedItems });
            } catch (cacheError) {
              console.error('Failed to load cached items:', cacheError);
            }
          }
          
          throw error;
        }
      },



      // Load Payment Methods (async version)
      loadPaymentMethodsAsync: async (profile: POSProfile) => {
        set({ paymentMethods: profile.payments || [] });
      },

      // Search Items
      searchItems: async (term: string, options: ItemSearchOptions = {}) => {
        const { items } = get();
        
        if (!term.trim()) return items;

        // Client-side search for now (can be enhanced with server-side search)
        const filtered = items.filter((item: any) => {
          const searchFields = [item.item_name, item.item_code];
          
          if (options.searchBy === 'barcode' && item.barcode) {
            searchFields.push(item.barcode);
          }

          return searchFields.some(field => 
            field?.toLowerCase().includes(term.toLowerCase())
          );
        });

        return filtered.slice(0, options.limit || 50);
      },

      // Search Customers
      searchCustomers: async (term: string) => {
        try {
          const { isOffline } = get();
          
          if (isOffline) {
            // Search in cached customers
            const cachedCustomers = await offlineManager.getCachedCustomers();
            return cachedCustomers.filter(customer =>
              customer.customer_name.toLowerCase().includes(term.toLowerCase())
            ).slice(0, 20);
          }

          const customersResponse = await apiClient.getList<Customer>('Customer', {
            fields: ['name', 'customer_name', 'customer_type', 'mobile_no', 'email_id'],
            filters: {
              disabled: 0,
              customer_name: ['like', `%${term}%`]
            },
            limit_page_length: 20,
          });

          return customersResponse.data;
        } catch (error) {
          console.error('Customer search failed:', error);
          
          // Fallback to cached search if online search fails
          try {
            const cachedCustomers = await offlineManager.getCachedCustomers();
            return cachedCustomers.filter(customer =>
              customer.customer_name.toLowerCase().includes(term.toLowerCase())
            ).slice(0, 20);
          } catch (cacheError) {
            console.error('Failed to search cached customers:', cacheError);
            return [];
          }
        }
      },

      // Customer Management
      selectCustomer: (customer: Customer) => {
        set({ selectedCustomer: customer });
      },

      clearCustomer: () => {
        set({ selectedCustomer: null });
      },

      createQuickCustomer: async (data: Partial<Customer>) => {
        try {
          const customer = await apiClient.saveDoc<Customer>('Customer', {
            customer_name: data.customer_name!,
            customer_type: 'Individual',
            mobile_no: data.mobile_no,
            territory: 'All Territories',
            customer_group: 'Individual',
          });

          return customer;
        } catch (error) {
          console.error('Failed to create customer:', error);
          throw error;
        }
      },

      // Cart Management
      addItemToCart: async (item: Item, quantity: number) => {
        const { cartItems, currentProfile } = get();
        
        // Check if item already exists in cart
        const existingItemIndex = cartItems.findIndex(
          (cartItem: any) => cartItem.item_code === item.item_code
        );

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          const updatedItems = [...cartItems];
          updatedItems[existingItemIndex].qty += quantity;
          set({ cartItems: updatedItems });
        } else {
          // Add new item to cart
          const cartItem: POSCartItem = {
            item_code: item.item_code,
            item_name: item.item_name,
            rate: item.standard_rate || 0,
            qty: quantity,
            uom: item.stock_uom || item.uom || 'Nos',
            stock_qty: item.stock_qty,
            price_list_rate: item.standard_rate,
            description: item.description,
            image: item.image,
          };

          set({ cartItems: [...cartItems, cartItem] });
        }

        // Recalculate totals
        get().recalculateCart();
      },

      updateCartItemQuantity: (itemCode: string, quantity: number) => {
        const { cartItems } = get();
        const updatedItems = cartItems.map((item: any) =>
          item.item_code === itemCode ? { ...item, qty: quantity } : item
        );
        set({ cartItems: updatedItems });
        get().recalculateCart();
      },

      removeCartItem: (itemCode: string) => {
        const { cartItems } = get();
        const updatedItems = cartItems.filter((item: any) => item.item_code !== itemCode);
        set({ cartItems: updatedItems });
        get().recalculateCart();
      },

      clearCart: () => {
        set({ 
          cartItems: [], 
          cartDiscount: 0, 
          cartTax: 0, 
          cartTotal: 0,
          selectedCustomer: null 
        });
      },

      applyDiscount: (value: number, type: 'percentage' | 'amount') => {
        const { cartItems } = get();
        const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.rate * item.qty), 0);
        
        let discountAmount = 0;
        if (type === 'percentage') {
          discountAmount = (subtotal * value) / 100;
        } else {
          discountAmount = value;
        }

        set({ cartDiscount: Math.min(discountAmount, subtotal) });
        get().recalculateCart();
      },

      // Transaction Management
      proceedToPayment: () => {
        set({ currentView: 'payment' });
      },

      processPayment: async (payments: POSPayment[]) => {
        const { cartItems, selectedCustomer, currentProfile, cartDiscount, cartTax, isOffline } = get();
        
        if (!selectedCustomer || !currentProfile) {
          throw new Error('Customer and POS Profile are required');
        }

        const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.rate * item.qty), 0);
        const grandTotal = subtotal - cartDiscount + cartTax;
        const paidAmount = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);

        const transaction: POSTransaction = {
          customer: selectedCustomer.name || selectedCustomer.customer_name || '',
          customer_name: selectedCustomer.customer_name,
          posting_date: new Date().toISOString().split('T')[0],
          posting_time: new Date().toTimeString().split(' ')[0],
          items: cartItems,
          total_qty: cartItems.reduce((sum: number, item: any) => sum + item.qty, 0),
          net_total: subtotal,
          total_taxes_and_charges: cartTax,
          discount_amount: cartDiscount,
          grand_total: grandTotal,
          rounded_total: Math.round(grandTotal),
          payments,
          paid_amount: paidAmount,
          change_amount: Math.max(0, paidAmount - grandTotal),
          docstatus: 1,
          is_pos: true,
          is_return: false,
          pos_profile: currentProfile.name,
        };

        try {
          let savedTransaction: POSTransaction;

          if (isOffline) {
            // Save transaction offline
            const offlinePosName = await offlineManager.saveOfflineTransaction(transaction);
            savedTransaction = {
              ...transaction,
              name: offlinePosName,
              offline_pos_name: offlinePosName
            };
          } else {
            // Save transaction online
            savedTransaction = await apiClient.saveDoc<POSTransaction>('Sales Invoice', transaction as unknown as Record<string, unknown>);
          }
          
          set({ 
            currentTransaction: savedTransaction,
            currentView: 'receipt' 
          });

          return savedTransaction;
        } catch (error) {
          console.error('Payment processing failed:', error);
          
          // If online save fails, try offline save as fallback
          if (!isOffline) {
            try {
              const offlinePosName = await offlineManager.saveOfflineTransaction(transaction);
              const savedTransaction = {
                ...transaction,
                name: offlinePosName,
                offline_pos_name: offlinePosName
              };
              
              set({ 
                currentTransaction: savedTransaction,
                currentView: 'receipt',
                isOffline: true // Switch to offline mode
              });

              return savedTransaction;
            } catch (offlineError) {
              console.error('Offline save also failed:', offlineError);
            }
          }
          
          throw error;
        }
      },

      printReceipt: async (transaction: POSTransaction) => {
        try {
          // TODO: Implement receipt printing
          console.log('Printing receipt for transaction:', transaction.name);
        } catch (error) {
          console.error('Receipt printing failed:', error);
          throw error;
        }
      },

      // Offline Management
      syncData: async () => {
        if (!networkManager.isOnline) {
          throw new Error('Cannot sync while offline');
        }

        try {
          set({ isLoading: true });
          
          // Sync offline transactions to server
          const syncResult = await syncManager.syncToServer(apiClient);
          
          if (syncResult.success) {
            console.log(`Successfully synced ${syncResult.syncedCount} transactions`);
          } else {
            console.warn('Sync completed with errors:', syncResult.errors);
          }

          // Download fresh data for offline use
          const { currentProfile } = get();
          if (currentProfile) {
            await syncManager.downloadDataForOffline(apiClient, currentProfile);
          }

          set({ isOffline: false });
          
          return syncResult;
        } catch (error) {
          console.error('Data sync failed:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      enableOfflineMode: () => {
        set({ isOffline: true });
      },

      disableOfflineMode: () => {
        set({ isOffline: false });
      },

      // Remove duplicate sync version

      // POS Closing
      openPOSClosing: () => {
        // This will be handled by the component state
        console.log('Opening POS closing');
      },

      createPOSClosing: async () => {
        const { currentProfile } = get();
        
        if (!currentProfile) {
          throw new Error('POS Profile is required');
        }

        // TODO: Implement POS closing entry creation
        const closingEntry: POSClosingEntry = {
          posting_date: new Date().toISOString().split('T')[0],
          posting_time: new Date().toTimeString().split(' ')[0],
          pos_profile: currentProfile.name,
          user: 'Administrator', // TODO: Get current user
          company: currentProfile.company,
          period_start_date: new Date().toISOString().split('T')[0],
          period_end_date: new Date().toISOString().split('T')[0],
          total_quantity: 0,
          net_total: 0,
          total_taxes_and_charges: 0,
          grand_total: 0,
          payment_reconciliation: [],
          docstatus: 0,
          status: 'Draft',
        };

        return closingEntry;
      },

      // Settings
      openSettings: () => {
        // TODO: Implement settings dialog
        console.log('Opening POS settings');
      },

      updateSettings: (newSettings: Partial<POSSettings>) => {
        const { settings } = get();
        set({ settings: { ...settings, ...newSettings } });
      },

      // Helper Methods
      loadItemGroups: async () => {
        try {
          const itemGroupsResponse = await apiClient.getList<ItemGroup>('Item Group', {
            fields: ['name', 'item_group_name', 'parent_item_group'],
            filters: { disabled: 0 },
          });

          set({ itemGroups: itemGroupsResponse.data });
        } catch (error) {
          console.error('Failed to load item groups:', error);
        }
      },

      // Sync version of loadPaymentMethods
      loadPaymentMethods: (profile: POSProfile) => {
        set({ paymentMethods: profile.payments || [] });
      },

      recalculateCart: () => {
        const { cartItems, cartDiscount } = get();
        
        const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.rate * item.qty), 0);
        const taxAmount = 0; // TODO: Implement tax calculation
        const total = subtotal - cartDiscount + taxAmount;

        set({ 
          cartTax: taxAmount,
          cartTotal: total 
        });
      },

      // Async version of saveOfflineData
      saveOfflineData: async () => {
        const { currentProfile, items, customers } = get();
        
        if (currentProfile) {
          try {
            await Promise.all([
              offlineManager.cacheProfile(currentProfile),
              offlineManager.cacheItems(items),
              offlineManager.cacheCustomers(customers)
            ]);
          } catch (error) {
            console.error('Failed to save offline data:', error);
          }
        }
      },
    };
  },
    {
      name: 'pos-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        selectedCustomer: state.selectedCustomer,
        cartItems: state.cartItems,
        cartDiscount: state.cartDiscount,
      }),
    }
  )
);