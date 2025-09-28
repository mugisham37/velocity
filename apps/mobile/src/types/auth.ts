import { BaseModel } from './database';

export interface User extends BaseModel {
  email: string;
  name: string;
  role: string;
  permissions: string[];
  settings: Record<string, any>;
  isActive: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  biometricEnabled: boolean;
}

export type AuthStoreState = Omit<AuthState, 'refreshToken'> & {
  refreshTokenPromise: (() => Promise<void>) | null;
};
