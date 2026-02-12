import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/blog/posts - Fetch all blog posts (admin only)
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('published') === 'true';
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';

    // Build query
    let query = createAdminClient()
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (publishedOnly) {
      query = query.eq('is_published', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (featured) {
      query = query.eq('is_featured', true);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      );
    }

    console.log('Fetched posts:', posts?.length, 'posts');
    if (posts && posts.length > 0) {
      console.log('First post ID:', posts[0].id, 'Type:', typeof posts[0].id);
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (error) {
    console.error('Get blog posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/blog/posts - Create new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
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
      meta_title,
      meta_description
    } = body;

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided
    const finalSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create blog post
    const admin = createAdminClient();
    const { data: post, error } = await admin
      .from('blog_posts')
      .insert({
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt?.trim() || null,
        content: content.trim(),
        featured_image_url: featured_image_url?.trim() || null,
        author_name: author_name?.trim() || 'Wingside Team',
        category: category?.trim() || null,
        tags: tags || [],
        is_published: is_published || false,
        is_featured: is_featured || false,
        published_at: is_published && published_at ? published_at : is_published ? new Date().toISOString() : null,
        meta_title: meta_title?.trim() || null,
        meta_description: meta_description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      return NextResponse.json(
        { error: 'Failed to create blog post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ post, message: 'Blog post created successfully' });
  } catch (error) {
    console.error('Create blog post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
