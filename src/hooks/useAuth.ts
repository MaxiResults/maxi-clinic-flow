import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

export function useRequireRole(allowedRoles: string[]) {
  const { user } = useAuth();
  const hasAccess = user ? allowedRoles.includes(user.role) : false;
  return { hasAccess };
}
