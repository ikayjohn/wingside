import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/hero-slides/test-insert - Test endpoint for inserting
export async function POST(request: NextRequest) {
  console.log('[TEST INSERT] Starting...');

  try {
    const supabase = await createClient();
    console.log('[TEST INSERT] Client created');

    const body = await request.json();
    console.log('[TEST INSERT] Request body:', body);

    console.log('[TEST INSERT] Attempting insert...');
    const { data, error } = await supabase
      .from('hero_slides')
      .insert({
        title: body.title || 'Test Slide',
        headline: body.headline || 'Test Headline',
        description: body.description || null,
        image_url: body.image_url || '/test.jpg',
        is_active: true,
        display_order: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[TEST INSERT] Error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('[TEST INSERT] Success:', data);
    return NextResponse.json({ success: true, data });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stackTrace = error instanceof Error ? error.stack : undefined;

    console.error('[TEST INSERT] Exception:', error);
    return NextResponse.json({ error: errorMessage, stack: stackTrace }, { status: 500 });
  }
}
