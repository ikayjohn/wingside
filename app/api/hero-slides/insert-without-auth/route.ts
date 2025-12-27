import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/hero-slides/insert-without-auth - Test insert without auth (TEMPORARY!)
export async function POST(request: NextRequest) {
  console.log('[INSERT WITHOUT AUTH] Starting...');

  try {
    const supabase = await createClient();
    console.log('[INSERT WITHOUT AUTH] Client created');

    const body = await request.json();
    console.log('[INSERT WITHOUT AUTH] Request body:', body);

    const { title, headline, description, image_url, is_active, display_order } = body;

    // Validate
    if (!title || !headline || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[INSERT WITHOUT AUTH] Inserting slide...');

    const { data: slide, error } = await supabase
      .from('hero_slides')
      .insert([
        {
          title,
          headline,
          description: description || null,
          image_url,
          is_active: is_active !== undefined ? is_active : true,
          display_order: display_order || 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[INSERT WITHOUT AUTH] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[INSERT WITHOUT AUTH] Success:', slide);
    return NextResponse.json({ slide }, { status: 201 });

  } catch (error: any) {
    console.error('[INSERT WITHOUT AUTH] Exception:', error);
    console.error('[INSERT WITHOUT AUTH] Stack:', error.stack);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
