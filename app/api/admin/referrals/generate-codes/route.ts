import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Enhanced referral code generator
function generateReferralCode(firstName: string, lastName: string, existingCodes: string[] = []): string {
  const cleanName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8);
  };

  const namePart = cleanName(firstName + lastName);
  if (namePart.length < 3) {
    return cleanName(firstName) + Math.floor(Math.random() * 1000);
  }

  let baseCode = namePart;
  let counter = 1;
  let finalCode = baseCode;

  while (existingCodes.includes(finalCode)) {
    counter++;
    finalCode = `${baseCode}${counter}`;
  }

  return finalCode;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { userId, generateForAll } = body;

    if (generateForAll) {
      // Generate for all users without referral codes
      const { createClient } = await import('@supabase/supabase-js');
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get all users without referral codes
      const { data: profiles } = await adminSupabase
        .from('profiles')
        .select('id, full_name, email, referral_code')
        .is('referral_code', null);

      if (!profiles || profiles.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All users already have referral codes',
          totalUpdated: 0
        });
      }

      // Get existing codes to avoid duplicates
      const { data: existingCodes } = await adminSupabase
        .from('profiles')
        .select('referral_code')
        .not('referral_code', 'is', null);

      const existingCodeList = existingCodes
        ? existingCodes.map(p => p.referral_code).filter(Boolean)
        : [];

      // Generate and update codes
      const updates = [];
      for (const profile of profiles) {
        let firstName = '';
        let lastName = '';

        if (profile.full_name) {
          const nameParts = profile.full_name.trim().split(/\s+/);
          firstName = nameParts[0] || '';
          lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        }

        if (!firstName) {
          firstName = profile.email?.split('@')[0] || 'user';
        }

        const referralCode = generateReferralCode(firstName, lastName, existingCodeList);
        existingCodeList.push(referralCode);

        const { error: updateError } = await adminSupabase
          .from('profiles')
          .update({
            referral_code: referralCode,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (!updateError) {
          updates.push({
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            referralCode: referralCode
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Generated referral codes for ${updates.length} users`,
        totalUpdated: updates.length,
        users: updates
      });

    } else if (userId) {
      // Generate for specific user
      const { createClient } = await import('@supabase/supabase-js');
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get user details
      const { data: profile, error: profileError } = await adminSupabase
        .from('profiles')
        .select('id, full_name, email, referral_code')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      if (!profile) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Get existing codes
      const { data: existingCodes } = await adminSupabase
        .from('profiles')
        .select('referral_code')
        .not('referral_code', 'is', null);

      const existingCodeList = existingCodes
        ? existingCodes.map(p => p.referral_code).filter(Boolean)
        : [];

      // Generate new code
      let firstName = '';
      let lastName = '';

      if (profile.full_name) {
        const nameParts = profile.full_name.trim().split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      }

      if (!firstName) {
        firstName = profile.email?.split('@')[0] || 'user';
      }

      const newReferralCode = generateReferralCode(firstName, lastName, existingCodeList);

      // Update user
      const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({
          referral_code: newReferralCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Referral code generated successfully',
        referralCode: newReferralCode,
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid request. Provide userId or set generateForAll to true' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error generating referral codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get statistics
    const { createClient } = await import('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: totalUsers } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { data: usersWithCodes } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('referral_code', 'is', null);

    const { data: usersWithoutCodes } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('referral_code', null);

    return NextResponse.json({
      success: true,
      statistics: {
        totalUsers: totalUsers?.length || 0,
        usersWithCodes: usersWithCodes?.length || 0,
        usersWithoutCodes: usersWithoutCodes?.length || 0,
        percentageWithCodes: totalUsers
          ? Math.round(((usersWithCodes?.length || 0) / totalUsers.length) * 100)
          : 0
      }
    });

  } catch (error) {
    console.error('Error getting referral statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}