import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
import type { LoginResponse, User } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<{ message: string; email: string }>;
  verifyEmail: (email: string, code: string) => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'customer' | 'professional';
  currency: string;
  name?: string;
  gender?: string;
  ageRange?: string;
  province?: string;
  preferredStore?: string;
  accountType?: 'household' | 'company' | 'trade';
  profession?: string;
  privacyConsent?: boolean;
  marketingConsent?: boolean;
  termsConsent?: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('userToken');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(
    async (currentToken?: string) => {
      try {
        const t = currentToken || token || localStorage.getItem('userToken');
        if (!t) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        const res = await api.get('/me', {
          headers: { Authorization: `Bearer ${t}` },
        });
        setUser(res.data);
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    },
    [token, logout]
  );

  useEffect(() => {
    const storedToken = localStorage.getItem('userToken');
    if (storedToken) {
      setToken(storedToken);
      refreshUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    persistAuth(res.data);
    return res.data;
  };

  const register = async (data: RegisterData) => {
    const res = await api.post<{ message: string; email: string }>('/auth/register', data);
    return res.data;
  };

  const verifyEmail = async (email: string, code: string) => {
    const res = await api.post<LoginResponse>('/auth/verify-email', { email, code });
    persistAuth(res.data);
    return res.data;
  };

  const persistAuth = (data: LoginResponse) => {
    localStorage.setItem('userToken', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        verifyEmail,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
