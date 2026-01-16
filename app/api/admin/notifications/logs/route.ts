import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const notificationType = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
      .from('notification_logs')
      .select('*, profiles!notification_logs_user_id_fkey(email, full_name)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (notificationType) {
      query = query.eq('notification_type', notificationType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      logs: data,
      total: count,
      limit,
      offset,
    });
  } catch (error: unknown) {
    console.error('Get notification logs error:', error);
    return NextResponse.json(
      { error: 'Failed to get notification logs' },
      { status: 500 }
    );
  }
}
