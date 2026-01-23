import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CACHE_KEYS, memoryCache } from '@/lib/redis'

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

        const body = await request.json()
        const { data, error } = await supabase
            .from('subcategories')
            .update({
                name: body.name,
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

        // Invalidate categories cache
        memoryCache.delete('categories_all')
        memoryCache.delete(CACHE_KEYS.CATEGORIES)

        return NextResponse.json({ subcategory: data })
    } catch (error) {
        console.error('Error updating subcategory:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
