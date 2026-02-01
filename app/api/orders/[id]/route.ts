import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loggers } from '@/lib/logger'

/**
 * Check if request is from an authenticated webhook source
 * Only authenticated webhooks should bypass RLS using admin client
 */
function isAuthenticatedWebhook(request: NextRequest): boolean {
  // Check for webhook authentication token
  const webhookToken = process.env.WEBHOOK_AUTH_TOKEN
  if (webhookToken) {
    const authHeader = request.headers.get('x-webhook-token')
    if (authHeader === webhookToken) {
      return true
    }
  }

  // Check for Paystack webhook signature
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY
  if (paystackSecret) {
    const signature = request.headers.get('x-paystack-signature')
    if (signature) {
      // Webhook with signature is authenticated
      // (Actual signature verification happens in webhook handler)
      return true
    }
  }

  // Check for internal service account header (for admin operations)
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN
  if (serviceToken) {
    const authHeader = request.headers.get('x-service-token')
    if (authHeader === serviceToken) {
      return true
    }
  }

  return false
}

// GET /api/orders/[id] - Get single order by ID or order_number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    loggers.order.debug('Looking up order', { id })

    // Helper function to try both UUID and order_number lookup
    async function fetchOrder(client: any) {
      // First, try to look up by order_number (text field)
      const { data: orderByNumber, error: numberError } = await client
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('order_number', id)
        .single()

      if (orderByNumber && !numberError) {
        return { data: orderByNumber, error: null }
      }

      // If not found by order_number, try by ID (UUID field)
      const { data: orderById, error: idError } = await client
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', id)
        .single()

      return { data: orderById, error: idError }
    }

    // Try server client first (respects RLS)
    const supabase = await createClient()
    let { data: order, error } = await fetchOrder(supabase)

    loggers.order.debug('Server client result', { found: !!order, error: error?.message })

    // SECURITY: Only use admin client (bypass RLS) for authenticated webhooks
    // Regular users must be authenticated and pass RLS checks
    if (error && !order) {
      if (isAuthenticatedWebhook(request)) {
        loggers.order.info('Authenticated webhook request, using admin client')
        const admin = createAdminClient()

        const result = await fetchOrder(admin)
        order = result.data
        error = result.error

        loggers.order.debug('Admin client result', {
          found: !!order,
          error: error?.message,
          orderId: order?.id,
          orderNumber: order?.order_number
        })
      } else {
        // Unauthenticated request - enforce RLS, don't fall back to admin
        loggers.order.warn('Unauthenticated request blocked from admin client', { id })
        return NextResponse.json(
          { error: 'Order not found or access denied' },
          { status: 404 }
        )
      }
    }

    if (error) {
      loggers.order.error('Order lookup failed', error, { id })
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    loggers.order.info('Successfully fetched order', { orderNumber: order?.order_number, id: order?.id })
    return NextResponse.json({ order })
  } catch (error) {
    loggers.order.error('Unexpected error in order lookup', error, { id })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
