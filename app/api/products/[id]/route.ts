import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CacheInvalidation } from '@/lib/redis'

// GET /api/products/[id] - Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        sizes:product_sizes(*),
        flavors:product_flavors(
          flavor:flavors(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Transform flavors
    const transformedProduct = {
      ...product,
      flavors: product.flavors?.map((pf: any) => pf.flavor.name) || [],
    }

    return NextResponse.json({ product: transformedProduct })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Update product
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update({
        name: body.name,
        category_id: body.category_id,
        subcategory: body.subcategory,
        description: body.description,
        image_url: body.image_url,
        wing_count: body.wing_count,
        max_flavors: body.max_flavors,
        badge: body.badge,
        simple_flavors: body.simple_flavors,
        flavor_label: body.flavor_label,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }

    // Update sizes if provided
    if (body.sizes && body.sizes.length > 0) {
      // Delete existing sizes
      await supabase.from('product_sizes').delete().eq('product_id', id)

      // Insert new sizes
      await supabase.from('product_sizes').insert(
        body.sizes.map((size: any) => ({
          product_id: id,
          name: size.name,
          price: size.price,
          is_default: size.is_default || false,
        }))
      )
    }

    // Invalidate cache so the updated product is fetched
    await CacheInvalidation.products()

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    // Invalidate cache so the deleted product is removed
    await CacheInvalidation.products()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
