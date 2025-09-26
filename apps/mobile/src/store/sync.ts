import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncState } from '@types/index';

const initialState: SyncState = {
  isOnline: true,
  lastSyncAt: undefined,
  pendingChanges: 0,
  isSyncing: false,
  syncProgress: 0,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncStatus: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
      if (!action.payload) {
        state.syncProgress = 0;
      }
    },
    setSyncProgress: (state, action: PayloadAction<number>) => {
      state.syncProgress = action.payload;
    },
    setLastSyncAt: (state, action: PayloadAction<Date>) => {
      state.lastSyncAt = action.payload;
    },
    setPendingChanges: (state, action: PayloadAction<number>) => {
      state.pendingChanges = action.payload;
    },
    incrementPendingChanges: state => {
      state.pendingChanges += 1;
    },
    decrementPendingChanges: state => {
      if (state.pendingChanges > 0) {
        state.pendingChanges -= 1;
      }
    },
    resetSync: state => {
      state.pendingChanges = 0;
      state.isSyncing = false;
      state.syncProgress = 0;
    },
  },
});

export const {
  setOnlineStatus,
  setSyncStatus,
  setSyncProgress,
  setLastSyncAt,
  setPendingChanges,
  incrementPendingChanges,
  decrementPendingChanges,
  resetSync,
} = syncSlice.actions;

export default syncSlice.reducer;
