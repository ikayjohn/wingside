import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get the user by email
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: 'Failed to find user' },
        { status: 500 }
      );
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the user's password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
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
