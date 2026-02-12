import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions'

// GET /api/job-positions/[id] - Fetch single job position
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: position, error } = await supabase
      .from('job_positions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    return NextResponse.json({ position })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/job-positions/[id] - Update job position (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('JSON parse error:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Update position
    const { data: position, error } = await supabase
      .from('job_positions')
      .update({
        title: body.title,
        location: body.location,
        overview: body.overview,
        responsibilities: body.responsibilities,
        qualifications: body.qualifications,
        is_active: body.is_active,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update position' },
        { status: 500 }
      )
    }

    return NextResponse.json({ position })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/job-positions/[id] - Delete job position (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Delete position
    const { error } = await supabase
      .from('job_positions')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete position' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
