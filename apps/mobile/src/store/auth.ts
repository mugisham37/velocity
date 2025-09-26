import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@services/auth';
import { AuthState, User } from '@types/index';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      biometricEnabled: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);

          // Store tokens securely
          await SecureStore.setItemAsync('accessToken', response.accessToken);
          await SecureStore.setItemAsync('refreshToken', response.refreshToken);

          set({
            user: response.user,
            token: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithBiometric: async () => {
        const { biometricEnabled } = get();
        if (!biometricEnabled) {
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
              token: accessToken,
              refreshToken,
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
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          biometricEnabled: false,
        });
      },

      refreshToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authService.refreshToken(refreshToken);

          // Update stored tokens
          await SecureStore.setItemAsync('accessToken', response.accessToken);
          await SecureStore.setItemAsync('refreshToken', response.refreshToken);

          set({
            token: response.accessToken,
            refreshToken: response.refreshToken,
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
          const refreshToken = await SecureStore.getItemAsync('refreshToken');

          if (accessToken && refreshToken) {
            try {
              // Verify token is still valid
              const user = await authService.verifyToken(accessToken);
              set({
                user,
                token: accessToken,
                refreshToken,
                isAuthenticated: true,
                biometricEnabled: hasBiometric,
                isLoading: false,
              });
            } catch (error) {
              // Token is invalid, try to refresh
              try {
                const response = await authService.refreshToken(refreshToken);
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
                  token: response.accessToken,
                  refreshToken: response.refreshToken,
                  isAuthenticated: true,
                  biometricEnabled: hasBiometric,
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
          set({ biometricEnabled: true });
        } else {
          throw new Error('Biometric authentication setup failed');
        }
      },

      disableBiometric: async () => {
        set({ biometricEnabled: false });
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
        biometricEnabled: state.biometricEnabled,
        // Don't persist sensitive data like tokens in AsyncStorage
      }),
    }
  )
);
