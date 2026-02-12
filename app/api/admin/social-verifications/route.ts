import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/social-verifications - Fetch all verifications (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build query - fetch verifications without joining
    let query = createAdminClient()
      .from('social_verifications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: verifications, error } = await query;

    if (error) {
      console.error('Error fetching verifications:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);

      // Check if table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Social verifications table not found. Please run the SQL migration script: scripts/create-social-verification.sql' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Failed to fetch verifications: ${error.message}` },
        { status: 500 }
      );
    }

    // Fetch user profiles separately for all verifications
    const userIds = [...new Set(verifications?.map(v => v.user_id) || [])];
    const { data: profiles } = await createAdminClient()
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Combine the data
    const flattened = verifications?.map(v => ({
      ...v,
      user_email: profileMap.get(v.user_id)?.email,
      user_name: profileMap.get(v.user_id)?.full_name,
    })) || [];

    return NextResponse.json({ verifications: flattened });
  } catch (error) {
    console.error('Get verifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
