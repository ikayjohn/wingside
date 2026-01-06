import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/admin/maintenance - Get current maintenance settings
export async function GET() {
  console.log('[Admin GET] ========== API ROUTE CALLED ==========')

  try {
    const cookieStore = await cookies()
    console.log('[Admin GET] Got cookie store')

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    // Verify admin user
    console.log('[Admin GET] Calling getUser()...')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log('[Admin GET] getUser result:', { userError: userError?.message, hasUser: !!user })

    if (userError || !user) {
      console.log('[Admin GET] Returning 401 Unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    }

    // Check if user is admin
    console.log('[Admin GET] Checking if user is admin...')
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('[Admin GET] Profile result:', { profile: profile?.role })

    if (!profile || profile.role !== 'admin') {
      console.log('[Admin GET] Returning 403 Forbidden')
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    }

    // Get maintenance settings
    console.log('[Admin GET] Calling get_maintenance_settings RPC...')
    const { data: maintenance, error } = await supabase
      .rpc('get_maintenance_settings')

    console.log('[Admin GET] RPC result:', { error: error?.message, dataType: typeof maintenance })

    if (error) {
      console.error('[Admin GET] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    // Handle different response formats
    let settings
    if (Array.isArray(maintenance)) {
      settings = maintenance[0]
    } else if (typeof maintenance === 'string') {
      try {
        settings = JSON.parse(maintenance)
      } catch (e) {
        console.error('[Admin GET] Failed to parse:', e)
        return NextResponse.json(
          { error: 'Invalid settings format' },
          { status: 500, headers: { 'content-type': 'application/json' } }
        )
      }
    } else if (typeof maintenance === 'object') {
      settings = maintenance
    } else {
      console.error('[Admin GET] Unexpected data type:', typeof maintenance)
      return NextResponse.json(
        { error: 'Unexpected data format' },
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    console.log('[Admin GET] About to return response with settings')
    const response = NextResponse.json(
      { settings },
      { headers: { 'content-type': 'application/json' } }
    )
    console.log('[Admin GET] Response created:', { status: response.status, headers: response.headers.get('content-type') })
    return response
  } catch (error: any) {
    console.error('[Admin GET] Unexpected error in catch block:', error)
    console.error('[Admin GET] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance settings', details: error.message },
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}

// POST /api/admin/maintenance - Update maintenance settings
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    // Verify admin user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }

    const { isEnabled, title, message, estimatedCompletion, accessCodes } = body

    // Validate required fields
    if (typeof isEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'isEnabled field is required and must be a boolean' },
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }

    // Convert estimatedCompletion to Date object if provided
    let completionDate = null
    if (estimatedCompletion) {
      completionDate = new Date(estimatedCompletion)
      if (isNaN(completionDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid estimatedCompletion date' },
          { status: 400, headers: { 'content-type': 'application/json' } }
        )
      }
    }

    // Use service role to bypass RLS
    const supabaseAdmin = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update maintenance settings
    const { data, error } = await supabaseAdmin.rpc('update_maintenance_settings', {
      p_is_enabled: isEnabled,
      p_title: title,
      p_message: message,
      p_estimated_completion: completionDate?.toISOString(),
      p_access_codes: accessCodes || []
    })

    if (error) {
      console.error('[Admin POST] Error updating maintenance settings:', error)
      return NextResponse.json(
        { error: 'Failed to update maintenance settings' },
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    // Log the action (optional - fail silently if table doesn't exist)
    try {
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: user.id,
        admin_email: profile.email,
        action: 'update_maintenance_settings',
        details: {
          isEnabled,
          title,
          accessCodes: accessCodes || []
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })
    } catch (logError) {
      // Ignore logging errors - don't fail the whole request
      console.warn('[Admin POST] Failed to log action (this is OK if admin_audit_log table doesn\'t exist):', logError.message)
    }

    return NextResponse.json({
      success: true,
      message: `Maintenance mode ${isEnabled ? 'enabled' : 'disabled'}`,
      data: {
        isEnabled,
        title,
        message,
        estimatedCompletion: completionDate?.toISOString(),
        accessCodes: accessCodes || []
      }
    }, { headers: { 'content-type': 'application/json' } })
  } catch (error: any) {
    console.error('[Admin POST] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update maintenance settings' },
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
