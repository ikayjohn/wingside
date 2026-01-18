import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/leads/[id] - Fetch a single lead with activities
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select(`
        *,
        creator:profiles!leads_created_by_fkey (
          id,
          full_name,
          email
        ),
        converted_customer:profiles!leads_converted_to_customer_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Fetch activities
    const { data: activities } = await supabase
      .from('lead_activities')
      .select(`
        *,
        creator:profiles(id, full_name, email)
      `)
      .eq('lead_id', params.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ lead, activities })
  } catch (error: any) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

// PATCH /api/leads/[id] - Update a lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Get existing lead to track status changes
    const { data: existingLead } = await supabase
      .from('leads')
      .select('status, name')
      .eq('id', params.id)
      .single()

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Update lead
    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // Log activity if status changed
    if (body.status && body.status !== existingLead.status) {
      await supabase.from('lead_activities').insert({
        lead_id: params.id,
        activity_type: 'status_change',
        subject: 'Status updated',
        description: `Status changed from ${existingLead.status} to ${body.status}`,
        created_by: body.updated_by || null
      })
    }

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update lead' },
      { status: 500 }
    )
  }
}

// DELETE /api/leads/[id] - Delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
