import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip maintenance check for certain paths
  const skipPaths = [
    '/admin',
    '/api/admin/maintenance',
    '/api/auth',
    '/api/validate-access-code',  // IMPORTANT: Skip maintenance check for access code validation!
    '/api/maintenance-settings',  // Public endpoint for maintenance page settings
    '/login',
    '/signup',
    '/forgot-password',
    '/auth',
    '/_next',
    '/static',
    '/favicon',
    '/images',
    '/maintenance'
  ]

  const shouldSkipMaintenance = skipPaths.some(path => pathname.startsWith(path))

  // Check maintenance mode (only if not skipped)
  if (!shouldSkipMaintenance) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // No-op for read-only operations
            },
          },
        }
      )

      // Get maintenance settings - returns JSON
      const { data: maintenance, error } = await supabase
        .rpc('get_maintenance_settings')

      // Debug: Log the raw response
      if (maintenance) {
        console.log('[Maintenance] Raw data type:', typeof maintenance)
        console.log('[Maintenance] Raw data:', JSON.stringify(maintenance).substring(0, 200))
      }

      // Only proceed if we got valid data and no error
      if (!error && maintenance) {
        // Handle different response formats from Supabase
        let settings
        if (Array.isArray(maintenance)) {
          // If it's an array, take the first element
          console.log('[Maintenance] Data is array, taking first element')
          settings = maintenance[0]
        } else if (typeof maintenance === 'string') {
          // If it's a string, parse it
          try {
            console.log('[Maintenance] Data is string, parsing JSON')
            settings = JSON.parse(maintenance)
          } catch (e) {
            console.error('[Maintenance] Failed to parse:', e)
            // Don't throw, just allow access
            settings = null
          }
        } else if (typeof maintenance === 'object') {
          // Already an object, use as-is
          console.log('[Maintenance] Data is object, using directly')
          settings = maintenance
        } else {
          console.error('[Maintenance] Unexpected data type:', typeof maintenance)
          // Don't throw, just allow access
          settings = null
        }

        console.log('[Maintenance] Parsed settings:', settings ? JSON.stringify(settings).substring(0, 200) : 'null')

        // If maintenance mode is enabled
        if (settings && settings.is_enabled) {
          // Check if user has a valid access code cookie
          const accessCodeCookie = request.cookies.get('maintenance_access_code')?.value

          let hasValidCode = false

          // Validate the code against the database
          if (accessCodeCookie && settings.access_codes && Array.isArray(settings.access_codes)) {
            hasValidCode = settings.access_codes.includes(accessCodeCookie)
            console.log('[Maintenance] Access code check:', { code: accessCodeCookie, valid: hasValidCode })
          }

          // If no valid code, show maintenance page (but exclude API routes)
          // API routes should always be accessible even during maintenance
          const isApiRoute = pathname.startsWith('/api/')
          if (!hasValidCode && !isApiRoute) {
            console.log('[Maintenance] No valid access code, redirecting to maintenance page')
            const url = request.nextUrl.clone()
            url.pathname = '/maintenance'

            // Preserve the original URL so user can return after maintenance
            const returnUrl = pathname + request.nextUrl.search
            if (returnUrl !== '/' && returnUrl !== '/maintenance') {
              url.searchParams.set('returnUrl', returnUrl)
            }

            return NextResponse.rewrite(url)
          }

          console.log('[Maintenance] Valid access code found, allowing access')
        }
      }
    } catch (error) {
      // If there's an error checking maintenance mode, log but allow access
      console.error('[Maintenance] Mode check error:', error)
    }
  }

  // Original authentication and admin protection logic
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check if user is admin for admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/my-account', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}