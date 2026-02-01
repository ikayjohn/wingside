import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cachedJson, generateETag, etagMatches } from '@/lib/cache-utils'
import {
  getFromCache,
  setCache,
  CACHE_KEYS,
  CACHE_TTL,
  memoryCache,
  CacheInvalidation
} from '@/lib/redis'

// GET /api/products - Fetch all active products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const cacheKey = category
      ? CACHE_KEYS.PRODUCTS_BY_CATEGORY(category)
      : (includeInactive ? CACHE_KEYS.PRODUCTS_ALL : CACHE_KEYS.PRODUCTS)

    // Check for cache-busting headers
    const cacheControl = request.headers.get('cache-control')
    const pragma = request.headers.get('pragma')
    const bypassCache = cacheControl?.includes('no-cache') || pragma?.includes('no-cache')

    // Check client's ETag for conditional request
    const clientETag = request.headers.get('if-none-match')

    // Only use cache if not bypassing
    if (!bypassCache) {
      // Try to get from Redis cache first
      const cachedData = await getFromCache<any>(cacheKey)
      if (cachedData) {
        console.log('[Products API] Redis cache HIT for key:', cacheKey)
        const etag = generateETag(cachedData)
        if (clientETag && etagMatches(clientETag, etag)) {
          return new Response(null, { status: 304 })
        }
        return cachedJson(cachedData, CACHE_TTL.MEDIUM, {
          headers: {
            'ETag': etag,
            'X-Cache': 'HIT',
          },
        })
      }
    }
    if (bypassCache) {
      console.log('[Products API] Cache bypass requested, fetching from database')
    } else {
      console.log('[Products API] Redis cache MISS for key:', cacheKey)
    }

    // Check memory cache fallback (only if not bypassing)
    if (!bypassCache) {
      const memoryCached = memoryCache.get(cacheKey)
      if (memoryCached) {
        const etag = generateETag(memoryCached)
        if (clientETag && etagMatches(clientETag, etag)) {
          return new Response(null, { status: 304 })
        }
        return cachedJson(memoryCached, CACHE_TTL.MEDIUM, {
          headers: {
            'ETag': etag,
            'X-Cache': 'MEMORY',
          },
        })
      }
    }

    // Cache miss - fetch from database
    const supabase = await createClient()

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        sizes:product_sizes(*),
        addons:product_addons(*)
      `)
      .order('created_at', { ascending: false })

    // Filter by active status unless requested otherwise
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

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

    // If no products, return empty array
    if (!products || products.length === 0) {
      return NextResponse.json({ products: [] })
    }

    // Get all product IDs to fetch their flavors
    const productIds = products.map(p => p.id)

    // Fetch flavors for all products in one query
    const { data: productFlavors } = await supabase
      .from('product_flavors')
      .select('product_id, flavor_id')
      .in('product_id', productIds)

    // Fetch all flavor details
    const flavorIds = productFlavors?.map(pf => pf.flavor_id) || []
    const { data: flavors } = await supabase
      .from('flavors')
      .select('*')
      .in('id', flavorIds)
      .eq('is_active', true)
      .eq('available_for_products', true)

    // Create a map of product_id -> array of flavor names
    const flavorMap: Record<string, string[]> = {}
    productFlavors?.forEach(pf => {
      const flavor = flavors?.find(f => f.id === pf.flavor_id)
      if (flavor) {
        if (!flavorMap[pf.product_id]) {
          flavorMap[pf.product_id] = []
        }
        flavorMap[pf.product_id].push(flavor.name)
      }
    })

    // Transform the data to match the frontend format
    const transformedProducts = products.map((product) => {
      // Use simple_flavors if available (for products like "Regular", "Hot", "Iced")
      // Otherwise use wing flavors from the flavors table
      const productFlavors = product.simple_flavors && product.simple_flavors.length > 0
        ? product.simple_flavors
        : (flavorMap[product.id] || [])

      // Get flavor IDs for this product
      const productFlavorIds = productFlavors?.map((flavorName: string) => {
        const flavor = flavors?.find((f: any) => f.name === flavorName)
        return flavor?.id
      }).filter(Boolean) || []

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

      return {
        ...product,
        flavors: productFlavors,
        flavor_ids: productFlavorIds,
        flavorLabel: product.flavor_label || undefined,
        sizes: product.sizes || [],
        riceOptions: riceOptions.length > 0 ? riceOptions : undefined,
        riceCount: riceCount,
        drinkOptions: drinkOptions.length > 0 ? drinkOptions : undefined,
        drinkCount: drinkCount,
        milkshakeOptions: milkshakeOptions.length > 0 ? milkshakeOptions : undefined,
        cakeOptions: cakeOptions.length > 0 ? cakeOptions : undefined,
      }
    })

    const responseData = { products: transformedProducts }

    // Generate ETag for cache validation
    const etag = generateETag(responseData)

    // Check if client's cached version is still valid
    if (clientETag && etagMatches(clientETag, etag)) {
      return new Response(null, { status: 304 })
    }

    // Store in Redis cache (30 minutes)
    await setCache(cacheKey, responseData, CACHE_TTL.MEDIUM)

    // Store in memory cache as fallback (5 minutes)
    memoryCache.set(cacheKey, responseData, CACHE_TTL.SHORT)

    // Return response with caching headers
    return cachedJson(responseData, CACHE_TTL.MEDIUM, {
      headers: {
        'ETag': etag,
        'X-Cache': 'MISS',
      },
    })
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (profile?.role !== 'admin') {
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

    // Insert product addons (rice, drinks, milkshakes, cakes)
    if (body.addons && body.addons.length > 0) {
      const { error: addonsError } = await supabase
        .from('product_addons')
        .insert(body.addons)

      if (addonsError) {
        console.error('Error creating addons:', addonsError)
      }
    }

    // Invalidate all product-related caches
    await CacheInvalidation.products()

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
