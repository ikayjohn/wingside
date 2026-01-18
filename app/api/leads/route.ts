import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/leads - Fetch all leads with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
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
      .order(sortBy as any, { ascending: order === 'asc' })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (source) {
      query = query.eq('source', source)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`)
    }

    // Get count for pagination
    const { count } = await query

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: leads, error } = await query.range(from, to)

    if (error) throw error

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { name, email, phone, source, company, created_by, ...rest } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!source) {
      return NextResponse.json(
        { error: 'Source is required' },
        { status: 400 }
      )
    }

    // Check if lead with email already exists
    if (email) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email)
        .single()

      if (existingLead) {
        return NextResponse.json(
          { error: 'Lead with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Create lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        source,
        created_by: created_by || null,
        ...rest
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      activity_type: 'status_change',
      subject: 'Lead created',
      description: `Lead ${lead.name} was created via ${source}`,
      created_by: created_by || null
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create lead' },
      { status: 500 }
    )
  }
}
