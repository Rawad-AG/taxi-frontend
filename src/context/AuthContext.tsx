import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthResponse, User } from '../types';
import { authApi, getStoredUser, storeUser } from '../lib/auth';
import { getErrorMessage, setAccessToken } from '../lib/api';
import { disconnectSocket, resetSocket } from '../lib/socket';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<AuthResponse>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  registerCustomer: (input: { firstName: string; lastName: string; phone: string; password: string }) => Promise<AuthResponse>;
  registerDriver: (input: Parameters<typeof authApi.registerDriver>[0]) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((data: { user: User; accessToken: string }) => {
    setUser(data.user);
    storeUser(data.user);
    setAccessToken(data.accessToken);
    resetSocket();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!getStoredUser()) {
      setAccessToken(null);
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        setAccessToken(null);
        storeUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      storeUser(null);
      disconnectSocket();
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    try {
      const data = await authApi.login(phone, password);
      if (!data.requiresOtp && data.user && data.accessToken) {
        applyAuth({ user: data.user, accessToken: data.accessToken });
      }
      return data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, [applyAuth]);

  const verifyOtp = useCallback(
    async (phone: string, code: string) => {
      try {
        const data = await authApi.verifyOtp(phone, code);
        applyAuth(data);
      } catch (err) {
        throw new Error(getErrorMessage(err));
      }
    },
    [applyAuth],
  );

  const registerCustomer = useCallback(
    async (input: { firstName: string; lastName: string; phone: string; password: string }) => {
      try {
        return await authApi.registerCustomer(input);
      } catch (err) {
        throw new Error(getErrorMessage(err));
      }
    },
    [],
  );

  const registerDriver = useCallback(
    async (input: Parameters<typeof authApi.registerDriver>[0]): Promise<User | null> => {
      try {
        const data = await authApi.registerDriver(input);
        return data.user ?? null;
      } catch (err) {
        throw new Error(getErrorMessage(err));
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    }
    setUser(null);
    storeUser(null);
    setAccessToken(null);
    disconnectSocket();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await authApi.me();
      setUser(u);
      storeUser(u);
    } catch {
      setUser(null);
      storeUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, verifyOtp, registerCustomer, registerDriver, logout, refreshUser, setUser }),
    [user, loading, login, verifyOtp, registerCustomer, registerDriver, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
