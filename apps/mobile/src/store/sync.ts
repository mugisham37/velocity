import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { SyncState } from '../types';

type SyncStore = SyncState & {
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncStatus: (isSyncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
  setLastSyncAt: (date: Date) => void;
  setPendingChanges: (count: number) => void;
  incrementPendingChanges: () => void;
  decrementPendingChanges: () => void;
  resetSync: () => void;
};

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: true,
      lastSyncAt: undefined,
      pendingChanges: 0,
      isSyncing: false,
      syncProgress: 0,

      // Actions
      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
      },

      setSyncStatus: (isSyncing: boolean) => {
        set(state => ({
          isSyncing,
          syncProgress: isSyncing ? state.syncProgress : 0,
        }));
      },

      setSyncProgress: (syncProgress: number) => {
        set({ syncProgress });
      },

      setLastSyncAt: (lastSyncAt: Date) => {
        set({ lastSyncAt });
      },

      setPendingChanges: (pendingChanges: number) => {
        set({ pendingChanges });
      },

      incrementPendingChanges: () => {
        set(state => ({ pendingChanges: state.pendingChanges + 1 }));
      },

      decrementPendingChanges: () => {
        set(state => ({
          pendingChanges: Math.max(0, state.pendingChanges - 1),
        }));
      },

      resetSync: () => {
        set({
          pendingChanges: 0,
          isSyncing: false,
          syncProgress: 0,
        });
      },
    }),
    {
      name: 'sync-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        lastSyncAt: state.lastSyncAt,
        pendingChanges: state.pendingChanges,
      }),
    }
  )
);
