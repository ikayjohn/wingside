import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/users - Get all users (admin only)
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error in users API:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - No user session' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      );
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get all users with their profile data using admin client to bypass RLS
    const admin = createAdminClient();
    const { data: users, error } = await admin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        wallet_balance,
        total_points,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      );
    }

    // Fetch all orders for all users in a single query to avoid N+1
    const userIds = (users || []).map(u => u.id);

    const ordersByUser: Record<string, { totalOrders: number; totalSpent: number }> = {};

    // Initialize stats for all users
    userIds.forEach(id => {
      ordersByUser[id] = { totalOrders: 0, totalSpent: 0 };
    });

    if (userIds.length > 0) {
      const { data: allOrders, error: ordersError } = await admin
        .from('orders')
        .select('id, total, user_id')
        .in('user_id', userIds);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        // Aggregate orders by user
        (allOrders || []).forEach(order => {
          if (order.user_id && ordersByUser[order.user_id]) {
            ordersByUser[order.user_id].totalOrders += 1;
            ordersByUser[order.user_id].totalSpent += Number(order.total || 0);
          }
        });
      }
    }

    // Map users with their aggregated stats
    const usersWithStats = (users || []).map(userData => ({
      ...userData,
      totalOrders: ordersByUser[userData.id]?.totalOrders || 0,
      totalSpent: ordersByUser[userData.id]?.totalSpent || 0
    }));

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
