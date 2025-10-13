import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: Date;
}

interface OfflineState {
  entities: {
    customers: Record<string, any>;
    products: Record<string, any>;
    salesOrders: Record<string, any>;
    [key: string]: Record<string, any>;
  };
  pendingActions: PendingAction[];
}

type OfflineStore = OfflineState & {
  setEntity: (entityType: string, id: string, data: any) => void;
  setEntities: (entityType: string, entities: Record<string, any>) => void;
  updateEntity: (entityType: string, id: string, data: Partial<any>) => void;
  deleteEntity: (entityType: string, id: string) => void;
  addPendingAction: (
    type: 'create' | 'update' | 'delete',
    entity: string,
    data: any
  ) => void;
  removePendingAction: (id: string) => void;
  clearPendingActions: () => void;
  updateSyncStatus: (
    entityType: string,
    id: string,
    status: 'pending' | 'syncing' | 'synced' | 'error'
  ) => void;
  clearOfflineData: () => void;
};

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      // Initial state
      entities: {
        customers: {},
        products: {},
        salesOrders: {},
      },
      pendingActions: [],

      // Actions
      setEntity: (entityType: string, id: string, data: any) => {
        set(state => ({
          entities: {
            ...state.entities,
            [entityType]: {
              ...state.entities[entityType],
              [id]: {
                ...data,
                lastModified: new Date(),
                needsSync: false,
                syncStatus: 'synced',
              },
            },
          },
        }));
      },

      setEntities: (entityType: string, entities: Record<string, any>) => {
        set(state => ({
          entities: {
            ...state.entities,
            [entityType]: entities,
          },
        }));
      },

      updateEntity: (entityType: string, id: string, data: Partial<any>) => {
        set(state => {
          const currentEntity = state.entities[entityType]?.[id];
          if (!currentEntity) return state;

          return {
            entities: {
              ...state.entities,
              [entityType]: {
                ...state.entities[entityType],
                [id]: {
                  ...currentEntity,
                  ...data,
                  lastModified: new Date(),
                  needsSync: true,
                  syncStatus: 'pending',
                },
              },
            },
          };
        });
      },

      deleteEntity: (entityType: string, id: string) => {
        set(state => {
          const currentEntity = state.entities[entityType]?.[id];
          if (!currentEntity) return state;

          return {
            entities: {
              ...state.entities,
              [entityType]: {
                ...state.entities[entityType],
                [id]: {
                  ...currentEntity,
                  isDeleted: true,
                  lastModified: new Date(),
                  needsSync: true,
                  syncStatus: 'pending',
                },
              },
            },
          };
        });
      },

      addPendingAction: (
        type: 'create' | 'update' | 'delete',
        entity: string,
        data: any
      ) => {
        set(state => ({
          pendingActions: [
            ...state.pendingActions,
            {
              id: `${Date.now()}-${Math.random()}`,
              type,
              entity,
              data,
              timestamp: new Date(),
            },
          ],
        }));
      },

      removePendingAction: (id: string) => {
        set(state => ({
          pendingActions: state.pendingActions.filter(
            action => action.id !== id
          ),
        }));
      },

      clearPendingActions: () => {
        set({ pendingActions: [] });
      },

      updateSyncStatus: (
        entityType: string,
        id: string,
        status: 'pending' | 'syncing' | 'synced' | 'error'
      ) => {
        set(state => {
          const currentEntity = state.entities[entityType]?.[id];
          if (!currentEntity) return state;

          return {
            entities: {
              ...state.entities,
              [entityType]: {
                ...state.entities[entityType],
                [id]: {
                  ...currentEntity,
                  syncStatus: status,
                  needsSync: status !== 'synced',
                },
              },
            },
          };
        });
      },

      clearOfflineData: () => {
        set({
          entities: {
            customers: {},
            products: {},
            salesOrders: {},
          },
          pendingActions: [],
        });
      },
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
