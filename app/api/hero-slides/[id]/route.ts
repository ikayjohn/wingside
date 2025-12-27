import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/hero-slides/[id] - Update a hero slide
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;

    console.log('[Hero Slides API] PATCH - Updating slide:', id);

    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, headline, description, image_url, is_active, display_order } = body;

    console.log('[Hero Slides API] PATCH - Update data:', body);

    // Update slide
    const { data: slide, error } = await supabase
      .from('hero_slides')
      .update({
        ...(title !== undefined && { title }),
        ...(headline !== undefined && { headline }),
        ...(description !== undefined && { description }),
        ...(image_url !== undefined && { image_url }),
        ...(is_active !== undefined && { is_active }),
        ...(display_order !== undefined && { display_order }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Hero Slides API] PATCH - Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!slide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    console.log('[Hero Slides API] PATCH - Success:', slide);
    return NextResponse.json({ slide });
  } catch (error: any) {
    console.error('[Hero Slides API] PATCH - Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/hero-slides/[id] - Delete a hero slide
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;

    console.log('[Hero Slides API] DELETE - Deleting slide:', id);

    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete slide
    const { error } = await supabase
      .from('hero_slides')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Hero Slides API] DELETE - Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Hero Slides API] DELETE - Success');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Hero Slides API] DELETE - Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
