import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CacheInvalidation } from '@/lib/redis'

export async function POST(request: NextRequest) {
    try {
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
            .from('subcategories')
            .insert({
                category_id: body.category_id,
                name: body.name,
                display_order: body.display_order || 0,
                is_active: body.is_active !== undefined ? body.is_active : true
            })
            .select()
            .single()

        if (error) throw error

        // Invalidate caches (categories + products)
        await CacheInvalidation.categories()
        await CacheInvalidation.products()

        return NextResponse.json({ subcategory: data }, { status: 201 })
    } catch (error) {
        console.error('Error creating subcategory:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
