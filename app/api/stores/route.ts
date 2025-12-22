import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/stores - Get all active stores
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all active stores ordered by display_order
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching stores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stores', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ stores: stores || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
