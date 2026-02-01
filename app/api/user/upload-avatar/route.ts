import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateImageFile, generateSafeFilename } from '@/lib/file-validation'
import { loggers } from '@/lib/logger'

// POST /api/user/upload-avatar - Upload user avatar
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      loggers.auth.error('Avatar upload unauthorized', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    // SECURITY: Validate file with magic number verification
    const validation = await validateImageFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      strictMimeType: true,
    })

    if (!validation.valid) {
      loggers.api.warn('Avatar upload validation failed', {
        userId: user.id,
        error: validation.error,
        fileName: file?.name,
        mimeType: file?.type,
      })
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // SECURITY: Generate safe filename using detected type, not user-provided extension
    const fileName = generateSafeFilename(user.id, validation.detectedType!)

    loggers.api.debug('Uploading avatar', {
      userId: user.id,
      fileName,
      size: file.size,
      detectedType: validation.detectedType,
    })

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: validation.detectedType!, // Use validated type
        upsert: true,
      })

    if (uploadError) {
      loggers.api.error('Avatar storage upload failed', uploadError, {
        userId: user.id,
        fileName,
      })
      return NextResponse.json({
        error: 'Failed to upload file to storage',
        details: uploadError.message
      }, { status: 500 })
    }

    loggers.api.debug('Avatar upload successful', { userId: user.id, path: uploadData.path })

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const avatarUrl = urlData.publicUrl
    loggers.api.debug('Avatar URL generated', { userId: user.id, avatarUrl })

    // Update user profile with new avatar URL
    const { data: profileData, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      loggers.database.error('Profile avatar update failed', updateError, {
        userId: user.id,
        code: updateError.code,
        hint: updateError.hint,
      })
      return NextResponse.json({
        error: 'Failed to update profile',
        details: updateError.message
      }, { status: 500 })
    }

    loggers.api.info('Avatar uploaded successfully', {
      userId: user.id,
      avatarUrl,
    })

    return NextResponse.json({ avatar_url: avatarUrl })
  } catch (error) {
    loggers.api.error('Unexpected avatar upload error', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
