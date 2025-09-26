import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OfflineState {
  entities: {
    customers: Record<string, any>;
    products: Record<string, any>;
    salesOrders: Record<string, any>;
    [key: string]: Record<string, any>;
  };
  pendingActions: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: string;
    data: any;
    timestamp: Date;
  }>;
}

const initialState: OfflineState = {
  entities: {
    customers: {},
    products: {},
    salesOrders: {},
  },
  pendingActions: [],
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    // Generic entity operations
    setEntity: (
      state,
      action: PayloadAction<{ entityType: string; id: string; data: any }>
    ) => {
      const { entityType, id, data } = action.payload;
      if (!state.entities[entityType]) {
        state.entities[entityType] = {};
      }
      state.entities[entityType][id] = {
        ...data,
        lastModified: new Date(),
        needsSync: false,
        syncStatus: 'synced',
      };
    },

    setEntities: (
      state,
      action: PayloadAction<{
        entityType: string;
        entities: Record<string, any>;
      }>
    ) => {
      const { entityType, entities } = action.payload;
      state.entities[entityType] = entities;
    },

    updateEntity: (
      state,
      action: PayloadAction<{
        entityType: string;
        id: string;
        data: Partial<any>;
      }>
    ) => {
      const { entityType, id, data } = action.payload;
      if (state.entities[entityType]?.[id]) {
        state.entities[entityType][id] = {
          ...state.entities[entityType][id],
          ...data,
          lastModified: new Date(),
          needsSync: true,
          syncStatus: 'pending',
        };
      }
    },

    deleteEntity: (
      state,
      action: PayloadAction<{ entityType: string; id: string }>
    ) => {
      const { entityType, id } = action.payload;
      if (state.entities[entityType]?.[id]) {
        state.entities[entityType][id] = {
          ...state.entities[entityType][id],
          isDeleted: true,
          lastModified: new Date(),
          needsSync: true,
          syncStatus: 'pending',
        };
      }
    },

    // Pending actions
    addPendingAction: (
      state,
      action: PayloadAction<{
        type: 'create' | 'update' | 'delete';
        entity: string;
        data: any;
      }>
    ) => {
      const { type, entity, data } = action.payload;
      state.pendingActions.push({
        id: `${Date.now()}-${Math.random()}`,
        type,
        entity,
        data,
        timestamp: new Date(),
      });
    },

    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(
        action => action.id !== action.payload
      );
    },

    clearPendingActions: state => {
      state.pendingActions = [];
    },

    // Sync status updates
    updateSyncStatus: (
      state,
      action: PayloadAction<{
        entityType: string;
        id: string;
        status: 'pending' | 'syncing' | 'synced' | 'error';
      }>
    ) => {
      const { entityType, id, status } = action.payload;
      if (state.entities[entityType]?.[id]) {
        state.entities[entityType][id].syncStatus = status;
        if (status === 'synced') {
          state.entities[entityType][id].needsSync = false;
        }
      }
    },

    // Clear all offline data
    clearOfflineData: state => {
      state.entities = {
        customers: {},
        products: {},
        salesOrders: {},
      };
      state.pendingActions = [];
    },
  },
});

export const {
  setEntity,
  setEntities,
  updateEntity,
  deleteEntity,
  addPendingAction,
  removePendingAction,
  clearPendingActions,
  updateSyncStatus,
  clearOfflineData,
} = offlineSlice.actions;

export default offlineSlice.reducer;
