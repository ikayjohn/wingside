/**
 * useRoleAccess Hook
 *
 * Protects admin pages by checking if the user has permission to access them.
 * Automatically redirects unauthorized users.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  UserRole,
  PermissionCategory,
  PermissionLevel,
  hasPermission,
  canAccessAdmin,
  getPermissionLevel,
} from '@/lib/permissions';

interface UseRoleAccessOptions {
  /** The permission category required to access this page */
  requiredPermission: PermissionCategory;
  /** Minimum permission level required (default: 'view') */
  requiredLevel?: PermissionLevel;
  /** Redirect path if unauthorized (default: '/admin') */
  redirectTo?: string;
}

interface UseRoleAccessReturn {
  /** Whether the user is authorized to access this page */
  authorized: boolean;
  /** Current user role */
  role: UserRole;
  /** Whether we're still loading */
  loading: boolean;
  /** User's permission level for this category */
  permissionLevel: PermissionLevel;
  /** Whether user can edit (shorthand) */
  canEdit: boolean;
  /** Whether user has full access (shorthand) */
  canDelete: boolean;
}

export function useRoleAccess({
  requiredPermission,
  requiredLevel = 'view',
  redirectTo = '/admin',
}: UseRoleAccessOptions): UseRoleAccessReturn {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('none');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAccess() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.warn('[useRoleAccess] No user found, redirecting to login');
          router.push('/login');
          return;
        }

        // Get user role from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const userRole = (profile?.role || 'customer') as UserRole;
        setRole(userRole);

        // Check if user can access admin panel at all
        if (!canAccessAdmin(userRole)) {
          console.warn('[useRoleAccess] User cannot access admin panel');
          router.push('/');
          return;
        }

        // Check if user has required permission for this specific page
        const hasRequiredPermission = hasPermission(
          userRole,
          requiredPermission,
          requiredLevel
        );

        if (!hasRequiredPermission) {
          console.warn(
            `[useRoleAccess] User role "${userRole}" does not have "${requiredLevel}" access to "${requiredPermission}"`
          );
          router.push(redirectTo);
          return;
        }

        // Get user's permission level for this category
        const level = getPermissionLevel(userRole, requiredPermission);
        setPermissionLevel(level);
        setAuthorized(true);
      } catch (error) {
        console.error('[useRoleAccess] Error checking access:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [requiredPermission, requiredLevel, redirectTo, router, supabase]);

  return {
    authorized,
    role,
    loading,
    permissionLevel,
    canEdit: permissionLevel === 'edit' || permissionLevel === 'full',
    canDelete: permissionLevel === 'full',
  };
}
