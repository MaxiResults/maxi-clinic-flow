export { useAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';

export function useRequireRole(allowedRoles: string[]) {
  const { user } = useAuth();
  const hasAccess = user ? allowedRoles.includes(user.role) : false;
  return { hasAccess };
}
