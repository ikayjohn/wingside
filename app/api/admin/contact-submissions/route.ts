import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/contact-submissions - Fetch all submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build query
    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (type && type !== 'all') {
      query = query.eq('submission_type', type)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: submissions, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
