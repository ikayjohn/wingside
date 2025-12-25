import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/admin/social-verifications/[id] - Approve or reject verification
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
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
      .eq('id', params.id)
      .single();

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    if (verification.status !== 'pending') {
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
      .eq('id', params.id)
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
    if (action === 'approve' && !verification.reward_claimed) {
      // Use claim_reward function to award points and track the claim
      const { error: pointsError } = await admin.rpc('claim_reward', {
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

      if (pointsError) {
        console.error('Error awarding points:', pointsError);
        // Don't fail the request if points awarding fails, just log it
        // The verification is still approved, admin can manually award points if needed
      } else {
        // Mark reward as claimed in verification record
        await admin
          .from('social_verifications')
          .update({ reward_claimed: true })
          .eq('id', params.id);

        console.log(`✅ Awarded ${verification.reward_points} points to user ${verification.user_id} for ${verification.platform} follow`);
      }
    }

    return NextResponse.json({
      success: true,
      verification: updatedVerification,
      message: `Verification ${newStatus} successfully`
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
  { params }: { params: { id: string } }
) {
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Delete verification
    const { error } = await admin
      .from('social_verifications')
      .delete()
      .eq('id', params.id);

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
