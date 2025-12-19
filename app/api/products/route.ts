import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/products - Fetch all active products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        sizes:product_sizes(*),
        flavors:product_flavors(
          flavor:flavors(*)
        ),
        simple_flavors,
        flavor_label
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Filter by category if provided
    if (category) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single()

      if (categoryData) {
        query = query.eq('category_id', categoryData.id)
      }
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Transform the data to match the frontend format
    const transformedProducts = products?.map((product) => {
      // Use simple_flavors if available (for products like "Regular", "Hot", "Iced")
      // Otherwise use wing flavors from the flavors table
      const flavors = product.simple_flavors && product.simple_flavors.length > 0
        ? product.simple_flavors
        : product.flavors?.map((pf: any) => pf.flavor.name) || []

      return {
        ...product,
        flavors,
        flavorLabel: product.flavor_label || undefined,
        sizes: product.sizes || [],
      }
    })

    return NextResponse.json({ products: transformedProducts })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
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

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
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
      })
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    // Insert sizes
    if (body.sizes && body.sizes.length > 0) {
      const { error: sizesError } = await supabase.from('product_sizes').insert(
        body.sizes.map((size: any) => ({
          product_id: product.id,
          name: size.name,
          price: size.price,
          is_default: size.is_default || false,
        }))
      )

      if (sizesError) {
        console.error('Error creating sizes:', sizesError)
      }
    }

    // Link flavors
    if (body.flavor_ids && body.flavor_ids.length > 0) {
      const { error: flavorsError } = await supabase
        .from('product_flavors')
        .insert(
          body.flavor_ids.map((flavorId: string) => ({
            product_id: product.id,
            flavor_id: flavorId,
          }))
        )

      if (flavorsError) {
        console.error('Error linking flavors:', flavorsError)
      }
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
