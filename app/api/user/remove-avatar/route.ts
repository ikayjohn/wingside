import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/user/remove-avatar - Remove user avatar
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current avatar URL from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Remove avatar file from storage if exists
    if (profile.avatar_url) {
      try {
        // Extract file name from URL
        const url = new URL(profile.avatar_url)
        const pathParts = url.pathname.split('/')
        const fileName = pathParts[pathParts.length - 1]

        // Remove file from storage
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([fileName])

        if (deleteError) {
          console.error('Storage delete error:', deleteError)
          // Continue even if storage deletion fails
        }
      } catch (err) {
        console.error('Error parsing avatar URL:', err)
        // Continue even if URL parsing fails
      }
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Avatar removal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
