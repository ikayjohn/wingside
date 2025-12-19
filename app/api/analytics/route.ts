import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const supabase = await createClient();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    const dateFilter = daysAgo.toISOString();

    // Fetch basic order metrics
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', dateFilter);

    if (ordersError) throw ordersError;

    // Calculate basic metrics
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum: number, order: Order) => sum + order.total, 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group orders by status
    const ordersByStatus = orders?.reduce((acc: Record<string, number>, order: Order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Group orders by day
    const revenueByDay = orders?.reduce((acc: Record<string, { revenue: number; orders: number }>, order: Order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { revenue: 0, orders: 0 };
      }
      acc[date].revenue += order.total;
      acc[date].orders += 1;
      return acc;
    }, {}) || {};

    const revenueByDayArray = Object.entries(revenueByDay)
      .map(([date, data]) => ({ 
        date, 
        revenue: (data as { revenue: number; orders: number }).revenue, 
        orders: (data as { revenue: number; orders: number }).orders 
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      revenueByDay: revenueByDayArray,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}