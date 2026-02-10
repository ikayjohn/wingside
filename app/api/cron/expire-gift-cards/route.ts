import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cron job to deactivate expired gift cards
 * Should be scheduled to run daily at midnight
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-gift-cards",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 *
 * External Cron: Call this endpoint with Authorization header
 * curl -X GET https://your-domain.com/api/cron/expire-gift-cards \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')

    // Check authorization
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.error('Unauthorized cron request - invalid or missing secret')
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    } else {
      // In development, allow without secret but log warning
      if (process.env.NODE_ENV === 'production') {
        console.error('CRON_SECRET not configured in production')
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        )
      }
      console.warn('CRON_SECRET not configured - allowing cron job for development')
    }

    const admin = createAdminClient()
    const now = new Date().toISOString()

    // Find active gift cards that have expired
    const { data: expiredCards, error: findError } = await admin
      .from('gift_cards')
      .select('id, code, recipient_email, expires_at')
      .eq('is_active', true)
      .lte('expires_at', now)

    if (findError) {
      console.error('Error finding expired gift cards:', findError)
      return NextResponse.json(
        { error: 'Failed to find expired gift cards' },
        { status: 500 }
      )
    }

    if (!expiredCards || expiredCards.length === 0) {
      console.log('No expired gift cards found')
      return NextResponse.json({
        success: true,
        message: 'No expired gift cards to process',
        expired_count: 0,
      })
    }

    // Deactivate expired gift cards
    const expiredIds = expiredCards.map(card => card.id)

    const { error: updateError } = await admin
      .from('gift_cards')
      .update({ is_active: false })
      .in('id', expiredIds)

    if (updateError) {
      console.error('Error deactivating expired gift cards:', updateError)
      return NextResponse.json(
        { error: 'Failed to deactivate expired gift cards' },
        { status: 500 }
      )
    }

    console.log(`✅ Deactivated ${expiredCards.length} expired gift cards`)
    console.log('Expired cards:', expiredCards.map(c => c.code).join(', '))

    return NextResponse.json({
      success: true,
      message: `Successfully deactivated ${expiredCards.length} expired gift cards`,
      expired_count: expiredCards.length,
      expired_codes: expiredCards.map(c => c.code),
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Gift card expiration cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
