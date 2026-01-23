import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/cron/expire-promo-codes - Process promo code expiration
// This should be called via a cron job (daily)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized promo expiration attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Call the process_promo_expiration function
    const { data: expirations, error } = await supabase.rpc('process_promo_expiration')

    if (error) {
      console.error('Error processing promo expiration:', error)
      return NextResponse.json(
        { error: 'Failed to process promo expiration', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Processed ${expirations?.length || 0} promo code expirations`)

    // Log details of each expiration
    if (expirations && expirations.length > 0) {
      expirations.forEach((exp: {
        code: string
        valid_until: string
        days_overdue: number
      }) => {
        console.log(
          `  ⏰ Deactivated: ${exp.code} (expired ${exp.days_overdue} days ago on ${new Date(exp.valid_until).toLocaleDateString()})`
        )
      })
    }

    return NextResponse.json({
      success: true,
      codes_deactivated: expirations?.length || 0,
      expirations: expirations || []
    })
  } catch (error: unknown) {
    console.error('Promo expiration processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/cron/expire-promo-codes - Preview promo codes that will expire (for testing)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized promo expiration preview attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Query promo codes that are expired but still active
    const { data: expiredCodes, error } = await supabase
      .from('promo_codes')
      .select('*')
      .not('valid_until', 'is', null)
      .lt('valid_until', new Date().toISOString())
      .eq('is_active', true)
      .order('valid_until', { ascending: true })

    if (error) {
      console.error('Error fetching expired promo codes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch expired promo codes', details: error.message },
        { status: 500 }
      )
    }

    // Calculate summary
    const preview = expiredCodes?.map(code => ({
      code: code.code,
      description: code.description,
      valid_until: code.valid_until,
      days_overdue: Math.floor(
        (Date.now() - new Date(code.valid_until).getTime()) / (24 * 60 * 60 * 1000)
      ),
      discount: code.discount_type === 'percentage'
        ? `${code.discount_value}%`
        : `₦${code.discount_value}`,
      usage: `${code.used_count}/${code.usage_limit || 'unlimited'}`
    })) || []

    return NextResponse.json({
      total_to_deactivate: preview.length,
      codes: preview
    })
  } catch (error: unknown) {
    console.error('Promo expiration preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
