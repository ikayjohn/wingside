import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const checks: {
      envVars: {
        supabaseUrl: boolean
        supabaseAnonKey: boolean
        serviceRoleKey: boolean
      }
      auth: any
      storage: any
    } = {
      envVars: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      auth: null,
      storage: null,
    }

    // Test Supabase client creation
    try {
      const supabase = await createClient()
      checks.auth = { clientCreated: true }

      // Test authentication
      const { data: { user }, error } = await supabase.auth.getUser()
      checks.auth = {
        clientCreated: true,
        hasUser: !!user,
        userId: user?.id || null,
        error: error?.message || null,
      }

      if (user) {
        // Test profile query
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        checks.auth.profile = {
          found: !!profile,
          role: profile?.role || null,
          error: profileError?.message || null,
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      checks.auth = { error: errorMessage }
    }

    // Test storage access
    try {
      const supabase = await createClient()
      const { data: buckets, error } = await supabase.storage.listBuckets()
      checks.storage = {
        bucketsFound: buckets?.length || 0,
        heroImagesExists: buckets?.some((b: any) => b.id === 'hero-images') || false,
        productImagesExists: buckets?.some((b: any) => b.id === 'product-images') || false,
        error: error?.message || null,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      checks.storage = { error: errorMessage }
    }

    return NextResponse.json(checks)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
