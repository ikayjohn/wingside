import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions';
import { resetRateLimit } from '@/lib/rate-limit';

// POST /api/admin/clear-rate-limit - Clear rate limit for an IP or email
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json(
        { error: 'identifier (IP or email) is required' },
        { status: 400 }
      );
    }

    // Clear rate limit for the identifier
    await resetRateLimit(identifier);

    console.log(`Rate limit cleared for: ${identifier}`);

    return NextResponse.json({
      success: true,
      message: `Rate limit cleared for ${identifier}`,
    });

  } catch (error) {
    console.error('Error clearing rate limit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
