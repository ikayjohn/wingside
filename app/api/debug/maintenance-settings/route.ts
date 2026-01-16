import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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

    const { data, error } = await supabase
      .rpc('get_maintenance_settings')

    return NextResponse.json({
      success: true,
      data_type: typeof data,
      data_value: data,
      error: error,
      data_stringified: JSON.stringify(data, null, 2)
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const stackTrace = error instanceof Error ? error.stack : undefined

    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: stackTrace
    })
  }
}
