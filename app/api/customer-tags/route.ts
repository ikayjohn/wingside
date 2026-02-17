import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/permissions';

// GET /api/customer-tags - Get all customer tags
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!canAccessAdmin(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data: tags, error } = await admin
      .from('customer_tags')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    return NextResponse.json({ tags: tags || [] });
  } catch (error) {
    console.error('Error in customer tags endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/customer-tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!canAccessAdmin(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, color, description } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name and color are required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: tag, error } = await admin
      .from('customer_tags')
      .insert({
        name,
        color,
        description,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Tag with this name already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating tag:', error);
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Error in customer tags endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/customer-tags?id=xxx - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!canAccessAdmin(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('id');

    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from('customer_tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error('Error deleting tag:', error);
      return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in customer tags endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
