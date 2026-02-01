import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { validateImageFile, generateSafeFilename } from '@/lib/file-validation'
import { loggers } from '@/lib/logger'

export async function POST(request: NextRequest) {
  loggers.admin.debug('Upload request received')

  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      loggers.admin.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    loggers.admin.debug('Supabase client created')

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      loggers.auth.error('Upload auth error', authError)
      return NextResponse.json({ error: 'Authentication error: ' + authError.message }, { status: 401 })
    }

    if (!user) {
      loggers.auth.warn('Upload attempted without user session')
      return NextResponse.json({ error: 'Unauthorized - No user session found' }, { status: 401 })
    }

    loggers.admin.debug('User authenticated', { userId: user.id })

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      loggers.database.error('Profile query failed in upload', profileError, { userId: user.id })
      return NextResponse.json({ error: 'Failed to verify admin role' }, { status: 500 })
    }

    if (profile?.role !== 'admin') {
      loggers.auth.warn('Non-admin upload attempt', { userId: user.id, role: profile?.role })
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    loggers.admin.debug('Admin role verified', { userId: user.id })

    // Get the file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'product-images' // Default to product-images

    loggers.admin.debug('File upload request', {
      userId: user.id,
      fileName: file?.name,
      mimeType: file?.type,
      size: file?.size,
      folder,
    })

    // Validate folder
    const validFolders = ['product-images', 'hero-images']
    if (!validFolders.includes(folder)) {
      return NextResponse.json(
        { error: 'Invalid folder. Must be one of: ' + validFolders.join(', ') },
        { status: 400 }
      )
    }

    // SECURITY: Validate file with magic number verification
    const validation = await validateImageFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      strictMimeType: true,
    })

    if (!validation.valid) {
      loggers.admin.warn('File upload validation failed', {
        userId: user.id,
        error: validation.error,
        fileName: file?.name,
        folder,
      })
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // SECURITY: Generate safe filename using detected type, not user-provided extension
    const prefix = folder === 'hero-images' ? 'hero' : 'product'
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = generateSafeFilename(`${prefix}-${randomString}`, validation.detectedType!)

    loggers.admin.debug('Generated safe filename', { userId: user.id, fileName, detectedType: validation.detectedType })

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    loggers.admin.debug('Starting upload to Supabase Storage', { userId: user.id, fileName, folder })

    // Use service client for upload (bypasses RLS, auth check already done above)
    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient.storage
      .from(folder)
      .upload(fileName, buffer, {
        contentType: validation.detectedType!, // Use validated type
        cacheControl: '3600',
        upsert: true, // Allow overwriting if file exists
      })

    if (error) {
      loggers.admin.error('Supabase upload failed', error, { userId: user.id, fileName, folder })
      return NextResponse.json(
        { error: 'Failed to upload file: ' + error.message },
        { status: 500 }
      )
    }

    loggers.admin.info('File uploaded successfully', { userId: user.id, path: data.path, folder })

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(folder).getPublicUrl(fileName)

    loggers.admin.debug('Public URL generated', { userId: user.id, publicUrl })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
    })
  } catch (error: unknown) {
    loggers.admin.error('Unexpected upload error', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    )
  }
}
