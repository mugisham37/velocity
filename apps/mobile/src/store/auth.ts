import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@services/auth';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User } from '../types/auth';

interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  isBiometricEnabled: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshTokenValue: string | null;
}

type AuthStore = AuthStoreState & {
  login: (email: string, password: string) => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  refreshToken: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshTokenValue: null,
      refreshTokenPromise: null,
      isAuthenticated: false,
      isLoading: false,
      isBiometricEnabled: false,

      // Actions
      login: async (email: string, password: string): Promise<void> => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);

          // Store tokens securely
          await SecureStore.setItemAsync('accessToken', response.accessToken);
          await SecureStore.setItemAsync('refreshToken', response.refreshToken);

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshTokenValue: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithBiometric: async () => {
        const { isBiometricEnabled } = get();
        if (!isBiometricEnabled) {
          throw new Error('Biometric authentication is not enabled');
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to access KIRO ERP',
          fallbackLabel: 'Use passcode',
        });

        if (result.success) {
          // Retrieve stored tokens
          const accessToken = await SecureStore.getItemAsync('accessToken');
          const refreshToken = await SecureStore.getItemAsync('refreshToken');

          if (accessToken && refreshToken) {
            // Verify token is still valid
            const user = await authService.verifyToken(accessToken);
            set({
              user,
              accessToken,
              isAuthenticated: true,
            });
          } else {
            throw new Error('No stored credentials found');
          }
        } else {
          throw new Error('Biometric authentication failed');
        }
      },

      logout: async () => {
        // Clear secure storage
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');

        // Clear state
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isBiometricEnabled: false,
        });
      },

      refreshToken: async () => {
        const { refreshTokenValue } = get();
        if (!refreshTokenValue) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authService.refreshToken(refreshTokenValue);

          // Update stored tokens
          await SecureStore.setItemAsync('accessToken', response.accessToken);
          await SecureStore.setItemAsync('refreshToken', response.refreshToken);

          set({
            accessToken: response.accessToken,
            refreshTokenValue: response.refreshToken,
          });
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          // Check if biometric is available and enabled
          const biometricType =
            await LocalAuthentication.getEnrolledLevelAsync();
          const hasBiometric = biometricType > 0;

          // Try to get stored tokens
          const accessToken = await SecureStore.getItemAsync('accessToken');
          const storedRefreshToken =
            await SecureStore.getItemAsync('refreshToken');

          if (accessToken && storedRefreshToken) {
            try {
              // Verify token is still valid
              const user = await authService.verifyToken(accessToken);
              set({
                user,
                accessToken: accessToken,
                refreshTokenValue: storedRefreshToken,
                isAuthenticated: true,
                isBiometricEnabled: hasBiometric,
                isLoading: false,
              });
            } catch (error) {
              // Token is invalid, try to refresh
              try {
                const response =
                  await authService.refreshToken(storedRefreshToken);
                await SecureStore.setItemAsync(
                  'accessToken',
                  response.accessToken
                );
                await SecureStore.setItemAsync(
                  'refreshToken',
                  response.refreshToken
                );

                set({
                  user: response.user,
                  accessToken: response.accessToken,
                  refreshTokenValue: response.refreshToken,
                  isAuthenticated: true,
                  isBiometricEnabled: hasBiometric,
                  isLoading: false,
                });
              } catch (refreshError) {
                // Both tokens are invalid, logout
                await get().logout();
                set({ isLoading: false });
              }
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('Auth initialization error:', error);
        }
      },

      enableBiometric: async () => {
        const biometricType = await LocalAuthentication.getEnrolledLevelAsync();
        if (biometricType === 0) {
          throw new Error(
            'No biometric authentication is enrolled on this device'
          );
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric authentication for KIRO ERP',
          fallbackLabel: 'Use passcode',
        });

        if (result.success) {
          set({ isBiometricEnabled: true });
        } else {
          throw new Error('Biometric authentication setup failed');
        }
      },

      disableBiometric: async () => {
        set({ isBiometricEnabled: false });
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        isBiometricEnabled: state.isBiometricEnabled,
        // Don't persist sensitive data like tokens in AsyncStorage
      }),
    }
  )
);
