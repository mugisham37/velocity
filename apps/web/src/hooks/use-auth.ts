import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  REFRESH_TOKEN_MUTATION,
} from '@/lib/graphql/auth';
import { useAuthStore } from '@/store/auth-store';
import { useMutation } from '@apollo/client';
import { useCallback } from 'react';
import { toast } from 'sonner';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } =
    useAuthStore();

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  const login = useCallback(
    async (email: string, password: string, mfaToken?: string) => {
      try {
        setLoading(true);
        const { data } = await loginMutation({
          variables: {
            input: { email, password, mfaToken },
          },
        });

        if (data?.login) {
          const { user, accessToken, refreshToken, requiresMfa } = data.login;

          if (requiresMfa) {
            return { requiresMfa: true };
          }

          setAuth(user, accessToken, refreshToken);
          toast.success('Successfully logged in');
          return { success: true };
        }
        
        return { error: 'Login failed' };
      } catch (error: any) {
        console.error('Login error:', error);
        toast.error(error.message || 'Login failed');
        return { error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [loginMutation, setAuth, setLoading]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      toast.success('Successfully logged out');
    }
  }, [logoutMutation, clearAuth]);

  const refreshToken = useCallback(async () => {
    try {
      const currentRefreshToken = useAuthStore.getState().refreshToken;
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      const { data } = await refreshTokenMutation({
        variables: {
          input: { refreshToken: currentRefreshToken },
        },
      });

      if (data?.refreshToken) {
        const {
          user,
          accessToken,
          refreshToken: newRefreshToken,
        } = data.refreshToken;
        setAuth(user, accessToken, newRefreshToken);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuth();
      return false;
    }
  }, [refreshTokenMutation, setAuth, clearAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
  };
}
