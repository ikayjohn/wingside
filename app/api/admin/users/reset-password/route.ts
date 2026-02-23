import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    // Fix 1: Auth + permission check — endpoint was previously wide open
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: authProfile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!hasPermission(authProfile?.role, 'users', 'full')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    // Fix 3: Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fix 2: Look up user by email from profiles table instead of listUsers() (which loads every account)
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the user's password by ID
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      profileData.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password updated for ${email}`,
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
