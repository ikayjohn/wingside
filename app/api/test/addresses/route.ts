import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple test endpoint to verify address functionality
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test database connection and addresses table
    const { error } = await supabase
      .from('addresses')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Database connection failed',
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Address API is working',
      database: 'connected',
      addresses_table: 'accessible'
    })

  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}