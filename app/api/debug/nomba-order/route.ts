import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/debug/nomba-order?orderId=xxx - Debug Nomba order status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId parameter is required' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Get order with full details
    const { data: order, error } = await admin
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check for recent webhook logs
    let webhookActivity = { hasRecentLogs: false, logCount: 0, recentLogs: [] }

    try {
      const { data: recentWebhooks } = await admin
        .from('webhook_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(5)

      webhookActivity = {
        hasRecentLogs: !!recentWebhooks && recentWebhooks.length > 0,
        logCount: recentWebhooks?.length || 0,
        recentLogs: recentWebhooks || [] as any
      }
    } catch (webhookLogError) {
      console.log('webhook_logs table not found, skipping webhook check')
    }

    const diagnostics: any = {
      order: {
        id: order.id,
        orderNumber: order.order_number,
        paymentStatus: order.payment_status,
        status: order.status,
        paymentReference: order.payment_reference,
        paymentGateway: order.payment_gateway,
        total: order.total,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        paidAt: order.paid_at,
        customerId: order.customer_id
      },
      analysis: {
        hasPaymentReference: !!order.payment_reference,
        isPaid: order.payment_status === 'paid' || order.status === 'confirmed',
        gatewayIsNomba: order.payment_gateway === 'nomba',
        recentlyUpdated: order.updated_at && new Date(order.updated_at) > new Date(Date.now() - 5 * 60 * 1000)
      },
      webhookActivity,
      recommendation: '',
      nextSteps: [] as string[]
    }

    // Analyze and provide recommendations
    if (diagnostics.analysis.isPaid) {
      diagnostics.recommendation = 'Order is already paid! This should show success page.'
      diagnostics.nextSteps.push('Check if callback page is using correct logic')
    } else if (!diagnostics.analysis.hasPaymentReference) {
      diagnostics.recommendation = 'Payment reference not set - webhook may not have processed yet'
      diagnostics.nextSteps.push('Check if webhook is being called by Nomba')
      diagnostics.nextSteps.push('Check server logs for webhook activity')
    } else if (diagnostics.analysis.isPaid === false && diagnostics.analysis.hasPaymentReference) {
      diagnostics.recommendation = 'Payment reference set but order not paid - webhook may have failed'
      diagnostics.nextSteps.push('Check server logs for webhook errors')
      diagnostics.nextSteps.push('Verify webhook signature validation is not blocking')
    } else {
      diagnostics.recommendation = 'Check server logs to see what\'s happening'
      diagnostics.nextSteps.push('Search for "Nomba webhook" in logs')
      diagnostics.nextSteps.push('Check if webhook URL is correct in Nomba dashboard')
    }

    return NextResponse.json({
      success: true,
      diagnostics
    })

  } catch (error: any) {
    console.error('Debug Nomba order error:', error)
    return NextResponse.json(
      {
        error: 'Failed to debug order',
        details: error.message
      },
      { status: 500 }
    )
  }
}
