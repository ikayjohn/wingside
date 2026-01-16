import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('[Upload API] Request received')

  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[Upload API] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    console.log('[Upload API] Supabase client created')

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('[Upload API] Auth error:', authError)
      return NextResponse.json({ error: 'Authentication error: ' + authError.message }, { status: 401 })
    }

    if (!user) {
      console.log('[Upload API] No user found')
      return NextResponse.json({ error: 'Unauthorized - No user session found' }, { status: 401 })
    }

    console.log('[Upload API] User authenticated:', user.id)

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Upload API] Profile query error:', profileError)
      return NextResponse.json({ error: 'Failed to verify admin role' }, { status: 500 })
    }

    if (profile?.role !== 'admin') {
      console.log('[Upload API] User not admin:', profile?.role)
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    console.log('[Upload API] User is admin')

    // Get the file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'product-images' // Default to product-images

    console.log('[Upload API] File details:', { name: file?.name, type: file?.type, size: file?.size, folder })

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate folder
    const validFolders = ['product-images', 'hero-images']
    if (!validFolders.includes(folder)) {
      return NextResponse.json(
        { error: 'Invalid folder. Must be one of: ' + validFolders.join(', ') },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const prefix = folder === 'hero-images' ? 'hero' : 'product'
    const fileName = `${prefix}-${timestamp}-${randomString}.${fileExtension}`

    console.log('[Upload API] Generated filename:', fileName)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('[Upload API] Starting upload to Supabase Storage...')

    // Use service client for upload (bypasses RLS, auth check already done above)
    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient.storage
      .from(folder)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true, // Allow overwriting if file exists
      })

    if (error) {
      console.error('[Upload API] Supabase upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload file: ' + error.message },
        { status: 500 }
      )
    }

    console.log('[Upload API] Upload successful:', data)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(folder).getPublicUrl(fileName)

    console.log('[Upload API] Public URL:', publicUrl)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
    })
  } catch (error: unknown) {
    console.error('[Upload API] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    )
  }
}
