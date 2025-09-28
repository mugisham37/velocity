import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
const persistReducer = require('redux-persist/lib/persistReducer').default;
const persistStore = require('redux-persist/lib/persistStore').default;

import { createReducer } from '@reduxjs/toolkit';
import { useAuthStore } from './auth';
import notificationReducer from './notifications';
import offlineReducer from './offline';
import syncReducer from './sync';

// Convert Zustand store to reducer
const authReducer = createReducer(useAuthStore.getState(), {});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'offline'], // Only persist auth and offline data
};

const rootReducer = combineReducers({
  auth: authReducer,
  sync: syncReducer,
  offline: offlineReducer,
  notifications: notificationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
