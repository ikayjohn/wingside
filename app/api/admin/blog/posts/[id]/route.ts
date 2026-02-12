import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/admin/blog/posts/[id] - Update blog post (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('PATCH request received for ID:', id);

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    console.log('Request body:', body);

    const {
      title,
      slug,
      excerpt,
      content,
      featured_image_url,
      author_name,
      category,
      tags,
      is_published,
      is_featured,
      published_at,
      view_count,
      meta_title,
      meta_description
    } = body;

    console.log('Parsed fields - title:', title, 'slug:', slug, 'content length:', content?.length);

    // Build update object with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) updateData.slug = slug.trim();
    if (excerpt !== undefined) updateData.excerpt = excerpt?.trim() || null;
    if (content !== undefined) updateData.content = content.trim();
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url?.trim() || null;
    if (author_name !== undefined) updateData.author_name = author_name?.trim() || 'Wingside Team';
    if (category !== undefined) updateData.category = category?.trim() || null;
    if (tags !== undefined) updateData.tags = tags;
    if (is_published !== undefined) {
      updateData.is_published = is_published;
      updateData.published_at = is_published && !published_at ? new Date().toISOString() : published_at;
    }
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (published_at !== undefined) updateData.published_at = published_at;
    if (view_count !== undefined) updateData.view_count = view_count;
    if (meta_title !== undefined) updateData.meta_title = meta_title?.trim() || null;
    if (meta_description !== undefined) updateData.meta_description = meta_description?.trim() || null;

    updateData.updated_at = new Date().toISOString();

    console.log('Update data:', updateData);
    console.log('Updating post with ID:', id);
    console.log('ID type:', typeof id);
    console.log('ID value:', JSON.stringify(id));

    // Update blog post
    const admin = createAdminClient();

    // Try with explicit UUID conversion
    const postId = id;
    console.log('About to query with postId:', postId);

    // First, let's verify we can fetch the post
    const { data: existingPost, error: fetchError } = await admin
      .from('blog_posts')
      .select('id, title')
      .eq('id', postId)
      .single();

    console.log('Existing post check:', { existingPost, fetchError });

    const { data: post, error } = await admin
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    console.log('Update result - error:', error, 'post:', post);

    if (error) {
      console.error('Error updating blog post:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update blog post', details: error },
        { status: 500 }
      );
    }

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post, message: 'Blog post updated successfully' });
  } catch (error) {
    console.error('Update blog post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/posts/[id] - Delete blog post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Delete blog post
    const admin = createAdminClient();
    const { error } = await admin
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog post:', error);
      return NextResponse.json(
        { error: 'Failed to delete blog post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
