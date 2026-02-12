import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions'
import { CacheInvalidation } from '@/lib/redis'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Check auth/role
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
        const { data, error } = await supabase
            .from('categories')
            .update({
                name: body.name,
                slug: body.slug,
                display_order: body.display_order,
                is_active: body.is_active
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Invalidate caches (categories + products which reference categories)
        await CacheInvalidation.categories()
        await CacheInvalidation.products()

        return NextResponse.json({ category: data })
    } catch (error) {
        console.error('Error updating category:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Check auth/role
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Invalidate caches (categories + products which reference categories)
        await CacheInvalidation.categories()
        await CacheInvalidation.products()

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting category:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
