import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentConfirmation } from '@/lib/emails/service'

// GET /api/payment/verify?reference=xxx - Verify Paystack payment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack verification error:', paystackData)
      return NextResponse.json(
        { error: paystackData.message || 'Failed to verify payment' },
        { status: 500 }
      )
    }

    const { data } = paystackData

    // Check if payment was successful
    if (data.status !== 'success') {
      return NextResponse.json({
        success: false,
        status: data.status,
        message: 'Payment was not successful',
      })
    }

    // Update order payment status in database
    const supabase = await createClient()
    const orderId = data.metadata?.order_id

    if (orderId) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed', // Automatically confirm order when payment verified
          payment_reference: reference,
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order payment status:', updateError)
      }

      // Fetch order details to send email
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (order) {
        // Send payment confirmation email to customer
        try {
          const emailResult = await sendPaymentConfirmation({
            orderNumber: order.order_number,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            amount: data.amount / 100, // Convert from kobo to naira
            paymentMethod: order.payment_method || 'card',
            transactionReference: reference,
          });

          if (!emailResult.success) {
            console.error('Failed to send payment confirmation email:', emailResult.error);
            // Don't fail the request if email fails
          } else {
            console.log('Payment confirmation email sent successfully to', order.customer_email);
          }
        } catch (emailError) {
          console.error('Error sending payment confirmation email:', emailError);
          // Don't fail the request if email fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: data.status,
      amount: data.amount / 100, // Convert from kobo to naira
      reference: data.reference,
      order_id: orderId,
      message: 'Payment verified successfully',
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
