import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/test/auth - Test authentication
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error in test:', authError)
      return NextResponse.json({ 
        status: 'error',
        message: 'Authentication error',
        error: authError.message 
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ 
        status: 'error',
        message: 'No authenticated user found',
        user: null 
      }, { status: 401 })
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'User is authenticated',
      user: {
        id: user.id,
        email: user.email,
        aud: user.aud
      }
    })

  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}