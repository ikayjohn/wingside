import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions'
import { CacheInvalidation } from '@/lib/redis'

// GET /api/job-positions - Fetch all job positions (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const admin = searchParams.get('admin') === 'true'

    const query = supabase
      .from('job_positions')
      .select('*')
      .order('created_at', { ascending: false })

    // If not admin view, only show active positions
    if (!admin) {
      query.eq('is_active', true)
    }

    const { data: positions, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 })
    }

    return NextResponse.json({ positions })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/job-positions - Create new job position (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    const userRole = (profile?.role || 'customer') as UserRole

    if (!canAccessAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Create job position
    const { data: position, error } = await supabase
      .from('job_positions')
      .insert({
        title: body.title,
        location: body.location,
        overview: body.overview,
        responsibilities: body.responsibilities,
        qualifications: body.qualifications,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create position' },
        { status: 500 }
      )
    }

    return NextResponse.json({ position }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
