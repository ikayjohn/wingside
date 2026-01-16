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

    // Verify admin user
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

    // Get stats
    const { data: allLogs } = await supabase
      .from('notification_logs')
      .select('notification_type, status');

    if (!allLogs) {
      return NextResponse.json({
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        email_sent: 0,
        push_sent: 0,
      });
    }

    const stats = {
      total: allLogs.length,
      sent: allLogs.filter((log) => log.status === 'sent').length,
      failed: allLogs.filter((log) => log.status === 'failed').length,
      pending: allLogs.filter((log) => log.status === 'pending').length,
      email_sent: allLogs.filter(
        (log) => log.notification_type === 'email' && log.status === 'sent'
      ).length,
      push_sent: allLogs.filter(
        (log) => log.notification_type === 'push' && log.status === 'sent'
      ).length,
    };

    return NextResponse.json(stats);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get notification stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get notification stats' },
      { status: 500 }
    );
  }
}
