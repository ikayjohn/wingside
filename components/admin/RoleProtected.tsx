/**
 * RoleProtected Component
 *
 * Wraps admin page content and protects it based on role permissions.
 * Shows loading state while checking access, then renders children if authorized.
 */

import { ReactNode } from 'react';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { PermissionCategory, PermissionLevel } from '@/lib/permissions';

interface RoleProtectedProps {
  children: ReactNode;
  /** The permission category required to access this page */
  requiredPermission: PermissionCategory;
  /** Minimum permission level required (default: 'view') */
  requiredLevel?: PermissionLevel;
  /** Custom loading component (optional) */
  loadingComponent?: ReactNode;
}

export default function RoleProtected({
  children,
  requiredPermission,
  requiredLevel = 'view',
  loadingComponent,
}: RoleProtectedProps) {
  const { authorized, loading } = useRoleAccess({
    requiredPermission,
    requiredLevel,
  });

  if (loading) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#552627] mx-auto mb-4"></div>
            <p className="text-gray-600">Checking access...</p>
          </div>
        </div>
      )
    );
  }

  if (!authorized) {
    // Redirect happens in useRoleAccess hook
    return null;
  }

  return <>{children}</>;
}
