import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin, UserRole } from '@/lib/permissions';

/**
 * Result type for requireAdmin function
 */
export type AdminAuthResult =
  | { success: true; supabase: Awaited<ReturnType<typeof createClient>>; admin: ReturnType<typeof createAdminClient>; role: UserRole }
  | { success: false; error: NextResponse };

/**
 * Verifies that the current user is authenticated and has admin role.
 * Returns either the Supabase clients or an error response.
 *
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAdmin();
 *   if (!auth.success) return auth.error;
 *
 *   const { supabase, admin } = auth;
 *   // ... your code here
 * }
 * ```
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      ),
    };
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Failed to verify user role' },
        { status: 500 }
      ),
    };
  }

  if (!canAccessAdmin(profile.role as UserRole)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  // Return both clients and role for convenience
  return {
    success: true,
    supabase,
    admin: createAdminClient(),
    role: profile.role as UserRole,
  };
}

/**
 * Convenience type guard to narrow the result type
 */
export function isAdminAuth(result: AdminAuthResult): result is { success: true; supabase: Awaited<ReturnType<typeof createClient>>; admin: ReturnType<typeof createAdminClient>; role: UserRole } {
  return result.success === true;
}
