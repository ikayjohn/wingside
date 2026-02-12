import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions'
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
        ),
        addons:product_addons(*)
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
      flavor_ids: product.flavors?.map((pf: any) => pf.flavor.id) || [],
    }

    // Transform addons from product_addons table into the format expected by order page
    const riceOptions: { name: string; price: number }[] = []
    const drinkOptions: string[] = []
    const milkshakeOptions: string[] = []
    const cakeOptions: string[] = []
    let riceCount = 1
    let drinkCount = 1

    // Process addons
    if (product.addons && product.addons.length > 0) {
      product.addons.forEach((addon: any) => {
        switch (addon.type) {
          case 'rice':
            riceOptions.push({
              name: addon.name,
              price: addon.price || 0
            })
            riceCount = addon.max_selections || 1
            break
          case 'drink':
            drinkOptions.push(addon.name)
            drinkCount = addon.max_selections || 1
            break
          case 'milkshake':
            milkshakeOptions.push(addon.name)
            break
          case 'cake':
            cakeOptions.push(addon.name)
            break
        }
      })
    }

    transformedProduct.riceOptions = riceOptions.length > 0 ? riceOptions : undefined
    transformedProduct.riceCount = riceCount
    transformedProduct.drinkOptions = drinkOptions.length > 0 ? drinkOptions : undefined
    transformedProduct.drinkCount = drinkCount
    transformedProduct.milkshakeOptions = milkshakeOptions.length > 0 ? milkshakeOptions : undefined
    transformedProduct.cakeOptions = cakeOptions.length > 0 ? cakeOptions : undefined


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

    const userRole = (profile?.role || 'customer') as UserRole

    if (!canAccessAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    // Update addons if provided
    if (body.addons && body.addons.length > 0) {
      console.log('[Products API] Updating addons:', body.addons)

      // Delete existing addons
      const { error: deleteAddonsError } = await supabase
        .from('product_addons')
        .delete()
        .eq('product_id', id)

      if (deleteAddonsError) {
        console.error('[Products API] Error deleting addons:', deleteAddonsError)
      } else {
        console.log('[Products API] Deleted existing addons')
      }

      // Insert new addons
      const addonsToInsert = body.addons.map((addon: any) => ({
        product_id: id,
        type: addon.type,
        name: addon.name,
        price: addon.price || 0,
        max_selections: addon.max_selections || 1,
      }))
      console.log('[Products API] Inserting new addons:', addonsToInsert)

      const { error: insertAddonsError } = await supabase
        .from('product_addons')
        .insert(addonsToInsert)

      if (insertAddonsError) {
        console.error('[Products API] Error inserting addons:', insertAddonsError)
      } else {
        console.log('[Products API] Addons updated successfully')
      }
    } else {
      console.log('[Products API] No addons provided in update')
    }

    // Update flavors if provided
    if (body.flavor_ids && body.flavor_ids.length > 0) {
      console.log('[Products API] Updating flavors:', body.flavor_ids)

      // Delete existing flavors
      const { error: deleteFlavorsError } = await supabase
        .from('product_flavors')
        .delete()
        .eq('product_id', id)

      if (deleteFlavorsError) {
        console.error('[Products API] Error deleting flavors:', deleteFlavorsError)
      } else {
        console.log('[Products API] Deleted existing flavors')
      }

      // Insert new flavors
      const flavorsToInsert = body.flavor_ids.map((flavorId: string) => ({
        product_id: id,
        flavor_id: flavorId,
      }))
      console.log('[Products API] Inserting new flavors:', flavorsToInsert)

      const { error: insertFlavorsError } = await supabase
        .from('product_flavors')
        .insert(flavorsToInsert)

      if (insertFlavorsError) {
        console.error('[Products API] Error inserting flavors:', insertFlavorsError)
      } else {
        console.log('[Products API] Flavors updated successfully')
      }
    } else if (body.flavor_ids && body.flavor_ids.length === 0) {
      // If empty array is provided, delete all existing flavors
      console.log('[Products API] Removing all flavors from product')
      await supabase
        .from('product_flavors')
        .delete()
        .eq('product_id', id)
    } else {
      console.log('[Products API] No flavor_ids provided in update')
    }

    // Invalidate cache so the updated product is fetched
    await CacheInvalidation.products()

    // Fetch the updated product with sizes, addons, and flavors to return to client
    const { data: updatedProduct } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        sizes:product_sizes(*),
        addons:product_addons(*),
        flavors:product_flavors(
          flavor:flavors(*)
        )
      `)
      .eq('id', id)
      .single()

    console.log('[Products API] Updated product with sizes:', updatedProduct)

    // Transform the response to include flavor_ids
    const transformedProduct = updatedProduct ? {
      ...updatedProduct,
      flavors: updatedProduct.flavors?.map((pf: any) => pf.flavor.name) || [],
      flavor_ids: updatedProduct.flavors?.map((pf: any) => pf.flavor.id) || [],
    } : null

    return NextResponse.json({ product: transformedProduct })
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

    const userRole = (profile?.role || 'customer') as UserRole

    if (!canAccessAdmin(userRole)) {
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
