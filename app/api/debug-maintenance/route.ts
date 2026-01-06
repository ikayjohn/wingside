import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const logs = []

  try {
    logs.push('Step 1: Starting request')

    const cookieStore = await cookies()
    logs.push('Step 2: Got cookie store')

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
    logs.push('Step 3: Created Supabase client')

    // Test the RPC call
    const { data: maintenance, error } = await supabase
      .rpc('get_maintenance_settings')

    logs.push(`Step 4: RPC call completed. Error: ${error ? error.message : 'none'}`)
    logs.push(`Step 5: Data type: ${typeof maintenance}`)
    logs.push(`Step 6: Is array: ${Array.isArray(maintenance)}`)
    logs.push(`Step 7: Data (first 200 chars): ${JSON.stringify(maintenance).substring(0, 200)}`)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        logs
      }, { headers: { 'content-type': 'application/json' } })
    }

    return NextResponse.json({
      success: true,
      data: maintenance,
      logs
    }, { headers: { 'content-type': 'application/json' } })

  } catch (error: any) {
    logs.push(`Error: ${error.message}`)
    logs.push(`Stack: ${error.stack?.substring(0, 200)}`)

    return NextResponse.json({
      success: false,
      error: error.message,
      logs
    }, { status: 500, headers: { 'content-type': 'application/json' } })
  }
}
