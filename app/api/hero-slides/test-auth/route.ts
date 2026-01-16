import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/hero-slides/test-auth - Test auth flow
export async function POST(request: NextRequest) {
  const debug: any = { steps: [], errors: [], data: {} };

  try {
    debug.steps.push('1. Starting auth check...');

    // Step 1: Create client
    const supabase = await createClient();
    debug.steps.push('2. Client created');

    // Step 2: Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      debug.errors.push(`Auth error: ${authError.message}`);
      debug.data.authError = authError;
      return NextResponse.json(debug);
    }

    if (!user) {
      debug.errors.push('No user found - not authenticated');
      return NextResponse.json(debug);
    }

    debug.steps.push(`3. Authenticated as: ${user.email}`);
    debug.data.user = { id: user.id, email: user.email };

    // Step 3: Check profile
    debug.steps.push('4. Fetching user profile...');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      debug.errors.push(`Profile error: ${profileError.message}`);
      debug.data.profileError = profileError;
      return NextResponse.json(debug);
    }

    debug.steps.push(`5. Profile found. Role: ${profile?.role || 'none'}`);
    debug.data.profile = profile;

    if (!profile) {
      debug.errors.push('Profile not found');
      return NextResponse.json(debug);
    }

    if (profile.role !== 'admin') {
      debug.errors.push(`User is not admin. Role: ${profile.role}`);
      return NextResponse.json(debug);
    }

    debug.steps.push('6. ✅ All checks passed - user is admin!');
    return NextResponse.json(debug);

  } catch (error: unknown) {
    debug.errors.push(`Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    debug.data.exception = error;
    return NextResponse.json(debug);
  }
}
