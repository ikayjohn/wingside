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
        points,
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

    // Get order counts for each user using admin client
    const usersWithStats = await Promise.all(
      (users || []).map(async (userData) => {
        try {
          const { data: orders, error: ordersError } = await admin
            .from('orders')
            .select('id, total')
            .eq('user_id', userData.id);

          if (ordersError) {
            console.error(`Error fetching orders for user ${userData.id}:`, ordersError);
          }

          const totalOrders = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

          return {
            ...userData,
            totalOrders,
            totalSpent
          };
        } catch (err) {
          console.error(`Error processing user ${userData.id}:`, err);
          return {
            ...userData,
            totalOrders: 0,
            totalSpent: 0
          };
        }
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
