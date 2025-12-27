import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/hero-slides/public - Fetch active hero slides for public display
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch only active slides ordered by display_order
    const { data: slides, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slides });
  } catch (error) {
    console.error('Error fetching public hero slides:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
