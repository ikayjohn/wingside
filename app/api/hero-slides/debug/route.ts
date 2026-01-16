import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/hero-slides/debug - Debug endpoint
export async function GET() {
  const debug: any = {
    steps: [],
    errors: [],
    data: null,
  };

  try {
    // Step 1: Create client
    const supabase = await createClient();
    debug.steps.push('✅ Created Supabase client');

    if (!supabase) {
      debug.errors.push('Failed to create Supabase client');
      return NextResponse.json(debug);
    }

    if (!supabase.auth) {
      debug.errors.push('Supabase client has no auth property');
      return NextResponse.json(debug);
    }

    // Step 2: Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      debug.errors.push(`Auth error: ${authError.message}`);
    } else if (user) {
      debug.steps.push(`✅ Authenticated as: ${user.email}`);
    } else {
      debug.steps.push('⚠️  Not authenticated');
    }

    // Step 3: Check user role
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        debug.errors.push(`Profile error: ${profileError.message}`);
      } else {
        debug.steps.push(`✅ User role: ${profile?.role || 'none'}`);
      }
    }

    // Step 4: Try to fetch slides
    const { data: slides, error: slidesError } = await supabase
      .from('hero_slides')
      .select('*');

    if (slidesError) {
      debug.errors.push(`Slides query error: ${slidesError.message}`);
      debug.errors.push(`Error code: ${slidesError.code}`);
      debug.errors.push(`Error hint: ${slidesError.hint || 'none'}`);
      debug.errors.push(`Error details: ${JSON.stringify(slidesError)}`);
    } else {
      debug.steps.push(`✅ Query returned ${slides?.length || 0} slides`);
      debug.data = slides;
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stackTrace = error instanceof Error ? error.stack : undefined;

    debug.errors.push(`Exception: ${errorMessage}`);
    if (stackTrace) {
      debug.errors.push(`Stack: ${stackTrace}`);
    }
  }

  return NextResponse.json(debug);
}
