import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStaffRoles } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    const { data: staff, error } = await adminClient
      .from('profiles')
      .select('id, email, role, full_name, created_at')
      .in('role', getStaffRoles())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff' },
        { status: 500 }
      );
    }

    return NextResponse.json({ staff }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
