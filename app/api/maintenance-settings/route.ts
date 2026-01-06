import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op for read-only operations
          },
        },
      }
    )

    const { data: maintenance, error } = await supabase.rpc('get_maintenance_settings')

    if (error) {
      console.error('[Maintenance Settings API] Error:', error)
      return NextResponse.json({ settings: null }, { status: 500 })
    }

    // Handle different response formats
    let settings
    if (Array.isArray(maintenance)) {
      settings = maintenance[0]
    } else if (typeof maintenance === 'object') {
      settings = maintenance
    } else {
      settings = null
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('[Maintenance Settings API] Unexpected error:', error)
    return NextResponse.json({ settings: null }, { status: 500 })
  }
}
