import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const supabase = await createClient();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    const dateFilter = daysAgo.toISOString();

    // Fetch order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(created_at, total),
        products!inner(name, category_id),
        categories!inner(name)
      `)
      .gte('orders.created_at', dateFilter);

    if (itemsError) throw itemsError;

    // Popular products
    interface ProductAccumulator {
      [key: string]: { name: string; quantity: number; revenue: number };
    }
    const popularProducts = orderItems?.reduce((acc: ProductAccumulator, item: any) => {
      const productName = item.product_name || 'Unknown Product';
      if (!acc[productName]) {
        acc[productName] = { 
          name: productName, 
          quantity: 0, 
          revenue: 0 
        };
      }
      acc[productName].quantity += item.quantity;
      acc[productName].revenue += item.total_price;
      return acc;
    }, {}) || {};

    // Top flavors
    interface FlavorItem {
      flavors?: string[];
      quantity: number;
    }
    const topFlavors: Record<string, number> = {};
    orderItems?.forEach((item: FlavorItem) => {
      if (item.flavors && Array.isArray(item.flavors)) {
        item.flavors.forEach((flavor: string) => {
          topFlavors[flavor] = (topFlavors[flavor] || 0) + item.quantity;
        });
      }
    });

    // Revenue by category
    interface CategoryItem {
      categories?: { name?: string };
      total_price: number;
    }
    const revenueByCategory = orderItems?.reduce((acc: Record<string, number>, item: CategoryItem) => {
      const category = item.categories?.name || 'Other';
      acc[category] = (acc[category] || 0) + item.total_price;
      return acc;
    }, {}) || {};

    // Recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total, status, created_at')
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      popularProducts: Object.values(popularProducts)
        .sort((a: { quantity: number }, b: { quantity: number }) => b.quantity - a.quantity)
        .slice(0, 10),
      topFlavors: Object.entries(topFlavors)
        .map(([name, count]) => ({ name, count }))
        .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
        .slice(0, 10),
      revenueByCategory: Object.entries(revenueByCategory).map(([category, revenue]) => ({
        category,
        revenue
      })),
      recentOrders: recentOrders || []
    });

  } catch (error) {
    console.error('Product analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product analytics data' },
      { status: 500 }
    );
  }
}