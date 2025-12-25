import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Social platform configurations
const SOCIAL_PLATFORMS: Record<string, { points: number; url: string; name: string }> = {
  instagram: {
    points: 100,
    url: 'https://instagram.com/mywingside',
    name: 'Instagram'
  },
  twitter: {
    points: 10,
    url: 'https://twitter.com/mywingside',
    name: 'Twitter/X'
  },
  tiktok: {
    points: 15,
    url: 'https://tiktok.com/@mywingside',
    name: 'TikTok'
  }
};

// POST /api/rewards/social-verify - Submit social follow for verification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { platform, username } = body;

    // Validate platform
    if (!platform || !SOCIAL_PLATFORMS[platform]) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Validate username
    if (!username || username.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter a valid username' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a pending or verified verification for this platform
    const { data: existing } = await supabase
      .from('social_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .in('status', ['pending', 'verified'])
      .maybeSingle();

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json(
          {
            error: 'You already have a pending verification for this platform',
            alreadySubmitted: true,
            submittedAt: existing.submitted_at
          },
          { status: 400 }
        );
      }
      if (existing.status === 'verified') {
        return NextResponse.json(
          { error: 'You have already verified this platform', alreadyVerified: true },
          { status: 400 }
        );
      }
    }

    // Create verification request
    const admin = createAdminClient();
    const { data: verification, error: insertError } = await admin
      .from('social_verifications')
      .insert({
        user_id: user.id,
        platform,
        username: username.trim().replace('@', ''),
        status: 'pending',
        reward_points: SOCIAL_PLATFORMS[platform].points,
        metadata: {
          platform_url: SOCIAL_PLATFORMS[platform].url,
          platform_name: SOCIAL_PLATFORMS[platform].name
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating verification:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit verification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verification,
      message: `Your ${SOCIAL_PLATFORMS[platform].name} username has been submitted for verification. We'll review it shortly!`,
      platform: SOCIAL_PLATFORMS[platform].name
    });
  } catch (error) {
    console.error('Social verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/rewards/social-verify - Get user's verification status
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's verifications
    const { data: verifications, error } = await supabase
      .from('social_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching verifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch verifications' },
        { status: 500 }
      );
    }

    // Map platform names
    const verificationsWithNames = verifications?.map(v => ({
      ...v,
      platform_name: SOCIAL_PLATFORMS[v.platform]?.name || v.platform,
      platform_url: SOCIAL_PLATFORMS[v.platform]?.url || '#'
    })) || [];

    return NextResponse.json({
      verifications: verificationsWithNames
    });
  } catch (error) {
    console.error('Get verifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
