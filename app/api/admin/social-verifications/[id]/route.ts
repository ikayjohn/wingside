import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { hasPermission, UserRole } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/admin/social-verifications/[id] - Approve or reject verification
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!hasPermission(profile?.role as UserRole, 'social_verifications', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    const { action } = body;

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Get verification details
    const { data: verification } = await admin
      .from('social_verifications')
      .select('*')
      .eq('id', id)
      .single();

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Allow re-processing verified records where points weren't awarded (stuck state)
    const isStuckVerified = verification.status === 'verified' && !verification.reward_claimed;
    if (verification.status !== 'pending' && !isStuckVerified) {
      return NextResponse.json(
        { error: `Verification already ${verification.status}` },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'verified' : 'rejected';

    // Update verification status
    const { data: updatedVerification, error: updateError } = await admin
      .from('social_verifications')
      .update({
        status: newStatus,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating verification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification' },
        { status: 500 }
      );
    }

    // If approved, award the points
    let pointsAwarded = false;
    let pointsError: string | null = null;

    if (action === 'approve' && !verification.reward_claimed) {
      const { data: claimResult, error: rpcError } = await admin.rpc('claim_reward', {
        p_user_id: verification.user_id,
        p_reward_type: `${verification.platform}_follow`,
        p_points: verification.reward_points,
        p_description: `Verified ${verification.platform} follow as @${verification.username}`,
        p_metadata: {
          verification_id: verification.id,
          username: verification.username,
          platform: verification.platform,
          verified_by: user.id
        }
      });

      if (rpcError) {
        console.error('Error awarding points:', rpcError);
        pointsError = rpcError.message;

        // Revert status back to pending so admin can retry
        await admin
          .from('social_verifications')
          .update({ status: 'pending', verified_at: null, verified_by: null })
          .eq('id', id);

        return NextResponse.json(
          { error: `Verification could not be approved: points award failed (${rpcError.message}). Status reverted to pending.` },
          { status: 500 }
        );
      } else if (claimResult === false) {
        // Already claimed in reward_claims — still mark social_verifications as claimed
        console.warn(`⚠️ Reward "${verification.platform}_follow" already claimed by user ${verification.user_id} — syncing flag`);
        await admin
          .from('social_verifications')
          .update({ reward_claimed: true })
          .eq('id', id);
        pointsAwarded = true; // Already awarded previously
      } else {
        // Successfully awarded
        await admin
          .from('social_verifications')
          .update({ reward_claimed: true })
          .eq('id', id);
        pointsAwarded = true;
        console.log(`✅ Awarded ${verification.reward_points} points to user ${verification.user_id} for ${verification.platform} follow`);
      }
    }

    return NextResponse.json({
      success: true,
      verification: updatedVerification,
      pointsAwarded,
      message: `Verification ${newStatus} successfully${pointsAwarded ? ` — ${verification.reward_points} points awarded` : ''}`
    });
  } catch (error) {
    console.error('Verification action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/social-verifications/[id] - Delete a verification (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!hasPermission(profile?.role as UserRole, 'social_verifications', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Delete verification
    const { error } = await admin
      .from('social_verifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting verification:', error);
      return NextResponse.json(
        { error: 'Failed to delete verification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Verification deleted' });
  } catch (error) {
    console.error('Delete verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
