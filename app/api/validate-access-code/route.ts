import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { valid: false, error: 'Invalid request body' },
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }

    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Invalid code format' },
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }

    const upperCode = code.toUpperCase().trim()
    console.log('[Validate Access Code] Received code:', upperCode)

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

    // Get maintenance settings
    const { data: maintenance, error } = await supabase
      .rpc('get_maintenance_settings')

    if (error) {
      console.error('[Validate Access Code] Database error:', error)
      return NextResponse.json(
        { valid: false, error: 'Failed to check maintenance settings' },
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    console.log('[Validate Access Code] Maintenance data type:', typeof maintenance)

    // Handle different response formats
    let settings
    if (Array.isArray(maintenance)) {
      settings = maintenance[0]
    } else if (typeof maintenance === 'string') {
      try {
        settings = JSON.parse(maintenance)
      } catch (e) {
        console.error('[Validate Access Code] Failed to parse:', e)
        return NextResponse.json(
          { valid: false, error: 'Invalid settings format' },
          { status: 500, headers: { 'content-type': 'application/json' } }
        )
      }
    } else if (typeof maintenance === 'object') {
      settings = maintenance
    } else {
      console.error('[Validate Access Code] Unexpected data type:', typeof maintenance)
      return NextResponse.json(
        { valid: false, error: 'Unexpected data format' },
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    if (!settings || typeof settings !== 'object') {
      console.error('[Validate Access Code] Invalid settings object')
      return NextResponse.json(
        { valid: false, error: 'Failed to check maintenance settings' },
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    console.log('[Validate Access Code] Settings:', {
      enabled: settings.is_enabled,
      codesCount: settings.access_codes?.length || 0
    })

    // If maintenance is not enabled, any code is valid
    if (!settings.is_enabled) {
      console.log('[Validate Access Code] Maintenance disabled - code valid')
      return NextResponse.json({
        valid: true,
        maintenance_enabled: false
      }, { headers: { 'content-type': 'application/json' } })
    }

    // Check if code is in the list
    if (settings.access_codes && Array.isArray(settings.access_codes)) {
      const isValid = settings.access_codes.includes(upperCode)
      console.log('[Validate Access Code] Code validation:', { code: upperCode, valid: isValid })

      return NextResponse.json({
        valid: isValid,
        maintenance_enabled: settings.is_enabled
      }, { headers: { 'content-type': 'application/json' } })
    }

    // No access codes configured
    console.log('[Validate Access Code] No access codes configured')
    return NextResponse.json({
      valid: false,
      maintenance_enabled: settings.is_enabled,
      error: 'No access codes configured'
    }, { headers: { 'content-type': 'application/json' } })

  } catch (error: any) {
    console.error('[Validate Access Code] Unexpected error:', error)
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
