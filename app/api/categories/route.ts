import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cachedJson, generateETag, etagMatches } from '@/lib/cache-utils'
import {
  getFromCache,
  setCache,
  CACHE_KEYS,
  CACHE_TTL,
  memoryCache
} from '@/lib/redis'

// GET /api/categories - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const cacheKey = includeInactive ? 'categories_all' : CACHE_KEYS.CATEGORIES
    const clientETag = request.headers.get('if-none-match')

    // Try to get from Redis cache first
    const cachedData = await getFromCache<any>(cacheKey)
    if (cachedData) {
      const etag = generateETag(cachedData)
      if (clientETag && etagMatches(clientETag, etag)) {
        return new Response(null, { status: 304 })
      }
      return cachedJson(cachedData, CACHE_TTL.EXTENDED, {
        headers: {
          'ETag': etag,
          'X-Cache': 'HIT',
        },
      })
    }

    // Check memory cache fallback
    const memoryCached = memoryCache.get(cacheKey)
    if (memoryCached) {
      const etag = generateETag(memoryCached)
      if (clientETag && etagMatches(clientETag, etag)) {
        return new Response(null, { status: 304 })
      }
      return cachedJson(memoryCached, CACHE_TTL.EXTENDED, {
        headers: {
          'ETag': etag,
          'X-Cache': 'MEMORY',
        },
      })
    }

    // Cache miss - fetch from database
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*, subcategories(*)')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Filter categories and subcategories based on active status unless requested otherwise
    let filteredCategories = categories.map(cat => ({
      ...cat,
      subcategories: (cat.subcategories || [])
        .filter((sub: any) => includeInactive || sub.is_active)
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
    }))

    if (!includeInactive) {
      filteredCategories = filteredCategories.filter(cat => cat.is_active)
    }

    const responseData = { categories: filteredCategories }

    // Generate ETag for cache validation
    const etag = generateETag(responseData)

    // Check if client's cached version is still valid
    if (clientETag && etagMatches(clientETag, etag)) {
      return new Response(null, { status: 304 })
    }

    // Store in Redis cache (24 hours - categories rarely change)
    await setCache(cacheKey, responseData, CACHE_TTL.EXTENDED)

    // Store in memory cache as fallback (5 minutes)
    memoryCache.set(cacheKey, responseData, CACHE_TTL.SHORT)

    // Return response with caching headers
    return cachedJson(responseData, CACHE_TTL.EXTENDED, {
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

// POST /api/categories - Create new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth/role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        display_order: body.display_order || 0,
        is_active: body.is_active !== undefined ? body.is_active : true
      })
      .select()
      .single()

    if (error) throw error

    // Invalidate caches
    memoryCache.delete('categories_all')
    memoryCache.delete(CACHE_KEYS.CATEGORIES)

    return NextResponse.json({ category: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
