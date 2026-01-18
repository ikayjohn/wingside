import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/leads/[id]/activities - Fetch all activities for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: activities, error } = await supabase
      .from('lead_activities')
      .select(`
        *,
        creator:profiles(id, full_name, email)
      `)
      .eq('lead_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(activities)
  } catch (error: any) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

// POST /api/leads/[id]/activities - Add an activity to a lead
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const { activity_type, subject, description, metadata, created_by } = body

    if (!activity_type) {
      return NextResponse.json(
        { error: 'Activity type is required' },
        { status: 400 }
      )
    }

    // Verify lead exists
    const { data: lead } = await supabase
      .from('leads')
      .select('name')
      .eq('id', params.id)
      .single()

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Create activity
    const { data: activity, error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: params.id,
        activity_type,
        subject: subject || `${activity_type.replace('_', ' ')} logged`,
        description,
        metadata: metadata || {},
        created_by: created_by || null
      })
      .select()
      .single()

    if (error) throw error

    // Update last_contacted_at if it's a contact activity
    if (['call', 'email', 'sms', 'meeting'].includes(activity_type)) {
      await supabase
        .from('leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', params.id)
    }

    return NextResponse.json(activity, { status: 201 })
  } catch (error: any) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create activity' },
      { status: 500 }
    )
  }
}
