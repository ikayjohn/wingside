import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, UserRole } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Check if user has permission to view events
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = (profile?.role || 'customer') as UserRole;

    if (!hasPermission(userRole, 'events', 'view')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    // Fetch RSVPs for this event
    const { data: rsvps, error: rsvpsError } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (rsvpsError) {
      console.error('Error fetching RSVPs:', rsvpsError);
      return NextResponse.json(
        { error: 'Failed to fetch RSVPs' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      total: rsvps.length,
      attending_yes: rsvps.filter(r => r.attending === 'yes').length,
      attending_maybe: rsvps.filter(r => r.attending === 'maybe').length,
      attending_no: rsvps.filter(r => r.attending === 'no').length,
      want_updates: rsvps.filter(r => r.stay_updated === true).length,
    };

    return NextResponse.json(
      {
        rsvps,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin RSVPs fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
