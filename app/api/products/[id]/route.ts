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

    console.log('[Products API] Updating product:', id)
    console.log('[Products API] Update data:', { ...body, image_url: body.image_url?.substring(0, 50) + '...' })

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
      console.error('[Products API] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update product: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('[Products API] Product updated successfully:', product?.id)

    // Update sizes if provided
    if (body.sizes && body.sizes.length > 0) {
      console.log('[Products API] Updating sizes:', body.sizes)

      // Delete existing sizes
      const { error: deleteError } = await supabase
        .from('product_sizes')
        .delete()
        .eq('product_id', id)

      if (deleteError) {
        console.error('[Products API] Error deleting sizes:', deleteError)
      } else {
        console.log('[Products API] Deleted existing sizes')
      }

      // Insert new sizes
      const sizesToInsert = body.sizes.map((size: any) => ({
        product_id: id,
        name: size.name,
        price: size.price,
        is_default: size.is_default || false,
      }))
      console.log('[Products API] Inserting new sizes:', sizesToInsert)

      const { error: insertError } = await supabase
        .from('product_sizes')
        .insert(sizesToInsert)

      if (insertError) {
        console.error('[Products API] Error inserting sizes:', insertError)
      } else {
        console.log('[Products API] Sizes updated successfully')
      }
    } else {
      console.log('[Products API] No sizes provided in update')
    }

    // Invalidate cache so the updated product is fetched
    await CacheInvalidation.products()

    // Fetch the updated product with sizes to return to client
    const { data: updatedProduct } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        sizes:product_sizes(*)
      `)
      .eq('id', id)
      .single()

    console.log('[Products API] Updated product with sizes:', updatedProduct)

    return NextResponse.json({ product: updatedProduct })
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
