import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/leads/[id]/convert - Convert a lead to a customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { customer_id } = body

    if (!customer_id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Verify lead exists
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Verify customer exists
    const { data: customer } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customer_id)
      .single()

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Update lead with conversion info
    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({
        status: 'converted',
        converted_to_customer_id: customer_id,
        converted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log conversion activity
    await supabase.from('lead_activities').insert({
      lead_id: id,
      activity_type: 'status_change',
      subject: 'Lead converted to customer',
      description: `Lead "${lead.name}" was converted to customer "${customer.full_name}"`,
      metadata: {
        customer_id,
        customer_name: customer.full_name,
        customer_email: customer.email
      },
      created_by: null
    })

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      customer
    })
  } catch (error: any) {
    console.error('Error converting lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to convert lead' },
      { status: 500 }
    )
  }
}
