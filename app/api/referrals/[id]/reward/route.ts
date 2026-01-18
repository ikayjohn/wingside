import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendReferralRewardEmail } from '@/lib/notifications/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/referrals/[id]/reward - Send reward notification for completed referral
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch referral details
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select(`
        *,
        referrer:profiles!referrals_referrer_id_fkey (
          full_name,
          email,
          referral_code
        ),
        referred_user:profiles!referrals_referred_user_id_fkey (
          full_name
        )
      `)
      .eq('id', id)
      .single()

    if (referralError || !referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      )
    }

    // Check if reward has already been sent
    if (referral.status === 'rewarded') {
      return NextResponse.json({
        success: true,
        message: 'Reward already sent',
        alreadySent: true,
      })
    }

    // Calculate total rewards for referrer
    const { data: allReferrals, error: countError } = await supabase
      .from('referrals')
      .select('reward_amount')
      .eq('referrer_id', referral.referrer_id)
      .in('status', ['rewarded', 'first_order_completed'])

    const totalRewards = (allReferrals || []).reduce(
      (sum, r) => sum + (r.reward_amount || 0),
      0
    )

    // Send reward email
    const emailResult = await sendReferralRewardEmail(
      referral.referrer.email!,
      referral.referrer.full_name || 'Customer',
      {
        referredUserName: referral.referred_user?.full_name || 'Your friend',
        rewardAmount: referral.reward_amount || 1000,
        totalRewards,
        referralLink: `${process.env.NEXT_PUBLIC_SITE_URL}/signup?ref=${referral.referrer.referral_code}`,
      }
    )

    if (!emailResult.success) {
      console.error('Failed to send referral reward email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send reward email' },
        { status: 500 }
      )
    }

    // Update referral status to rewarded
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'rewarded',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update referral status:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Reward notification sent successfully',
      messageId: emailResult.messageId,
    })
  } catch (error: any) {
    console.error('Referral reward error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send reward notification' },
      { status: 500 }
    )
  }
}
