import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

        // Get old subcategory name before updating
        const { data: oldSubcategory } = await supabase
            .from('subcategories')
            .select('name')
            .eq('id', id)
            .single()

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

        // CRITICAL FIX: Update all products that have the old subcategory name
        if (oldSubcategory && oldSubcategory.name !== body.name) {
            console.log(`[Subcategory Update] Updating products from "${oldSubcategory.name}" to "${body.name}"`)

            const { error: updateError } = await supabase
                .from('products')
                .update({ subcategory: body.name })
                .eq('subcategory', oldSubcategory.name)

            if (updateError) {
                console.error('Error updating products subcategory:', updateError)
            } else {
                console.log(`[Subcategory Update] Updated products subcategory successfully`)
            }
        }

        // Invalidate caches (categories + products)
        await CacheInvalidation.categories()
        await CacheInvalidation.products()

        return NextResponse.json({ subcategory: data })
    } catch (error) {
        console.error('Error updating subcategory:', error)
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

        // Get subcategory name before deleting to update products
        const { data: oldSubcategory } = await supabase
            .from('subcategories')
            .select('name')
            .eq('id', id)
            .single()

        // Delete the subcategory
        const { error } = await supabase
            .from('subcategories')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // CRITICAL FIX: Clear subcategory field from products that had this subcategory
        if (oldSubcategory) {
            console.log(`[Subcategory Delete] Clearing subcategory "${oldSubcategory.name}" from products`)

            const { error: updateError } = await supabase
                .from('products')
                .update({ subcategory: null })
                .eq('subcategory', oldSubcategory.name)

            if (updateError) {
                console.error('Error clearing products subcategory:', updateError)
            } else {
                console.log(`[Subcategory Delete] Cleared subcategory from products successfully`)
            }
        }

        // Invalidate caches (categories + products)
        await CacheInvalidation.categories()
        await CacheInvalidation.products()

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting subcategory:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
