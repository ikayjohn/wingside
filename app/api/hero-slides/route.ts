import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/hero-slides - Fetch all hero slides
export async function GET(request: NextRequest) {
  try {
    console.log('[Hero Slides API] Fetching slides...');
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[Hero Slides API] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Hero Slides API] User authenticated: ${user.email}`);

    // Fetch user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Hero Slides API] Profile error:', profileError);
    } else {
      console.log(`[Hero Slides API] User role: ${profile?.role}`);
    }

    if (!profile || profile.role !== 'admin') {
      console.log('[Hero Slides API] Forbidden - not admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all slides (including inactive ones for admin)
    const { data: slides, error } = await supabase
      .from('hero_slides')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[Hero Slides API] Query error:', error);
      console.error('[Hero Slides API] Error details:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Hero Slides API] Success: ${slides?.length || 0} slides returned`);

    return NextResponse.json({ slides });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Hero Slides API] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/hero-slides - Create a new hero slide
export async function POST(request: NextRequest) {
  let supabase: any;

  try {
    console.log('[Hero Slides API] POST - Creating new slide...');
    supabase = await createClient();

    // Check if user is admin
    console.log('[Hero Slides API] POST - Checking auth...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.log('[Hero Slides API] POST - Auth error:', authError);
      return NextResponse.json({ error: 'Auth error: ' + authError.message }, { status: 401 });
    }

    if (!user) {
      console.log('[Hero Slides API] POST - No user found');
      return NextResponse.json({ error: 'Unauthorized - no user' }, { status: 401 });
    }

    console.log(`[Hero Slides API] POST - User authenticated: ${user.email}`);

    // Fetch user profile to check role
    console.log('[Hero Slides API] POST - Fetching profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('[Hero Slides API] POST - Profile error:', profileError);
      return NextResponse.json({ error: 'Profile error: ' + profileError.message }, { status: 500 });
    }

    if (!profile) {
      console.log('[Hero Slides API] POST - No profile found');
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    if (profile.role !== 'admin') {
      console.log('[Hero Slides API] POST - Not admin, role:', profile.role);
      return NextResponse.json({ error: 'Forbidden - not admin' }, { status: 403 });
    }

    console.log('[Hero Slides API] POST - User is admin, proceeding...');

    const body = await request.json();
    console.log('[Hero Slides API] POST - Request body:', body);

    const { title, headline, description, image_url, is_active, display_order } = body;

    // Validate required fields
    if (!title || !headline || !image_url) {
      console.log('[Hero Slides API] POST - Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: title, headline, and image_url are required' },
        { status: 400 }
      );
    }

    console.log('[Hero Slides API] POST - Inserting slide...');

    // Create new slide
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
      console.error('[Hero Slides API] POST - Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Hero Slides API] POST - Success! Slide created:', slide);
    return NextResponse.json({ slide }, { status: 201 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const stackTrace = error instanceof Error ? error.stack : undefined;

    console.error('[Hero Slides API] POST - Exception:', error);
    console.error('[Hero Slides API] POST - Error name:', errorName);
    console.error('[Hero Slides API] POST - Error message:', errorMessage);

    if (process.env.NODE_ENV === 'development') {
      console.error('[Hero Slides API] POST - Stack:', stackTrace);
    }

    // Return JSON even for unexpected errors
    return NextResponse.json(
      {
        error: errorMessage,
        type: errorName,
        stack: process.env.NODE_ENV === 'development' ? stackTrace : undefined
      },
      { status: 500 }
    );
  }
}
