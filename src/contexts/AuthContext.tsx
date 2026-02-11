import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: 'superadmin' | 'admin' | 'gestor' | 'atendente' | 'profissional' | 'viewer';
  avatar_url: string | null;
  cliente_id: number;
  empresa_id: number;
  profissional_id: string | null;
  empresas_acesso: number[];
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
      localStorage.removeItem('mc_access_token');
      localStorage.removeItem('mc_refresh_token');
    }
  }, []);

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem('mc_access_token');
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('mc_access_token', data.access_token);
    localStorage.setItem('mc_refresh_token', data.refresh_token);
    setUser(data.usuario);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('mc_access_token');
    localStorage.removeItem('mc_refresh_token');
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
