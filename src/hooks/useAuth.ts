import { useAuth } from '@/contexts/AuthContext';

export { useAuth };

export function useRequireRole(allowedRoles: string[]) {
  const { user } = useAuth();
  const hasAccess = user ? allowedRoles.includes(user.role) : false;
  return { hasAccess };
}
