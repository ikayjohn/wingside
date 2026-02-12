import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/wingside-cards
 * Fetch all Wingside Cards with user details
 *
 * Security:
 * - Requires authentication
 * - Admin role required
 * - Uses service role to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      );
    }

    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Use admin client to fetch cards (bypasses RLS)
    const admin = createAdminClient();

    // Fetch all cards
    const { data: cardsData, error: cardsError } = await admin
      .from('wingside_cards')
      .select('*')
      .order('linked_at', { ascending: false });

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      throw cardsError;
    }

    if (!cardsData || cardsData.length === 0) {
      return NextResponse.json({
        success: true,
        cards: [],
        count: 0
      });
    }

    // Fetch profiles for all card users
    const userIds = cardsData.map((card: any) => card.user_id);
    const { data: profilesData, error: profilesError } = await admin
      .from('profiles')
      .select('id, email, full_name, phone_number')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue without profile data
    }

    // Merge card and profile data
    const cardsWithUser = cardsData.map((card: any) => {
      const userProfile = profilesData?.find((p: any) => p.id === card.user_id);
      return {
        ...card,
        user_email: userProfile?.email || 'N/A',
        user_name: userProfile?.full_name || 'Unknown User',
        user_phone: userProfile?.phone_number || null
      };
    });

    return NextResponse.json({
      success: true,
      cards: cardsWithUser,
      count: cardsWithUser.length
    });

  } catch (error) {
    console.error('[Admin Cards API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/wingside-cards
 * Get card statistics
 *
 * Security:
 * - Requires authentication
 * - Admin role required
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Use admin client
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('wingside_cards')
      .select('status, total_spent, total_transactions');

    if (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }

    const stats = {
      total_cards: data?.length || 0,
      active_cards: data?.filter((c: any) => c.status === 'active').length || 0,
      suspended_cards: data?.filter((c: any) => c.status === 'suspended').length || 0,
      total_value: data?.reduce((sum: number, c: any) => sum + (c.total_spent || 0), 0) || 0,
      total_transactions: data?.reduce((sum: number, c: any) => sum + (c.total_transactions || 0), 0) || 0
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('[Admin Cards API] Stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
