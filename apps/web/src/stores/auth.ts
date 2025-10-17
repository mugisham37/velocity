import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User } from '@/types';
import { apiClient } from '@/lib/api';
import { secureSessionManager } from '@/lib/auth/security';
import { accessControlManager } from '@/lib/security/access-control';

interface AuthStore extends AuthState {
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: { usr: string; pwd: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
  
  // Session management
  refreshSession: () => Promise<boolean>;
  setSessionExpiry: (expiresAt: Date) => void;
  isSessionExpired: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      sessionId: undefined,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // Use secure login with enhanced security checks
          const loginResult = await secureSessionManager.secureLogin(credentials);
          
          if (!loginResult.success) {
            set({
              isLoading: false,
              error: loginResult.error || 'Login failed',
              isAuthenticated: false,
              user: null,
              sessionId: undefined,
            });
            throw new Error(loginResult.error || 'Login failed');
          }

          const userInfo = await apiClient.getCurrentUser();
          
          const user: User = {
            name: String(userInfo.name || ''),
            email: String(userInfo.email || ''),
            full_name: String(userInfo.full_name || ''),
            roles: Array.isArray(userInfo.roles) ? userInfo.roles as string[] : [],
            user_image: userInfo.user_image ? String(userInfo.user_image) : undefined,
          };

          // Register user with access control manager
          accessControlManager.registerUser(user);

          // Set session in API client
          const sessionId = apiClient.getSessionId() || 'session_' + Date.now();
          apiClient.setSession(sessionId);

          set({
            user,
            isAuthenticated: true,
            sessionId,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            sessionId: undefined,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          // Use secure logout
          await secureSessionManager.secureLogout();
        } catch (error) {
          console.warn('Logout failed:', error);
        } finally {
          // Clear state regardless of API call success
          apiClient.clearSession();
          set({
            user: null,
            isAuthenticated: false,
            sessionId: undefined,
            isLoading: false,
            error: null,
          });
        }
      },

      checkSession: async () => {
        const state = get();
        
        if (!state.sessionId || !state.isAuthenticated) {
          return false;
        }

        try {
          // Ping the server to check if session is still valid
          const isValid = await apiClient.ping();
          
          if (!isValid) {
            // Session is invalid, clear auth state
            set({
              user: null,
              isAuthenticated: false,
              sessionId: undefined,
              error: 'Session expired',
            });
            return false;
          }

          return true;
        } catch (error) {
          console.warn('Session check failed:', error);
          set({
            user: null,
            isAuthenticated: false,
            sessionId: undefined,
            error: 'Session check failed',
          });
          return false;
        }
      },

      refreshSession: async () => {
        const state = get();
        
        if (!state.user) {
          return false;
        }

        try {
          // Get fresh user info to refresh session
          const userInfo = await apiClient.getCurrentUser();
          
          const updatedUser: User = {
            ...state.user,
            name: String(userInfo.name || ''),
            email: String(userInfo.email || ''),
            full_name: String(userInfo.full_name || ''),
            roles: Array.isArray(userInfo.roles) ? userInfo.roles as string[] : [],
            user_image: userInfo.user_image ? String(userInfo.user_image) : undefined,
          };

          set({ user: updatedUser });
          return true;
        } catch (error) {
          console.warn('Session refresh failed:', error);
          return false;
        }
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      setSessionExpiry: (expiresAt: Date) => {
        // Store expiry time for future use
        localStorage.setItem('session_expires_at', expiresAt.toISOString());
      },

      isSessionExpired: () => {
        const expiryStr = localStorage.getItem('session_expires_at');
        if (!expiryStr) return false;
        
        const expiryDate = new Date(expiryStr);
        return new Date() > expiryDate;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionId: state.sessionId,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore session in API client when rehydrating
        if (state?.sessionId) {
          apiClient.setSession(state.sessionId);
        }
      },
    }
  )
);
