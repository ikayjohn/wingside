import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cachedJson, generateETag, etagMatches } from '@/lib/cache-utils'
import {
  getFromCache,
  setCache,
  deleteFromCache,
  CACHE_KEYS,
  CACHE_TTL,
  memoryCache
} from '@/lib/redis'

// GET /api/delivery-areas - Fetch all delivery areas
export async function GET(request: NextRequest) {
  try {
    // Check for cache busting parameter
    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.has('_timestamp')

    if (bypassCache) {
      console.log('⚡ Cache bypass requested, fetching fresh data')
    }

    const cacheKey = CACHE_KEYS.DELIVERY_AREAS
    const clientETag = request.headers.get('if-none-match')

    // Skip cache if bypass requested
    if (!bypassCache) {
      // Try to get from Redis cache first
      const cachedData = await getFromCache<any>(cacheKey)
      if (cachedData) {
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

      // Check memory cache fallback
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
    console.log('💾 Fetching from database')
    const supabase = await createClient()

    const { data: deliveryAreas, error } = await supabase
      .from('delivery_areas')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching delivery areas:', error)
      return NextResponse.json(
        { error: 'Failed to fetch delivery areas' },
        { status: 500 }
      )
    }

    const responseData = { deliveryAreas }

    console.log(`✅ Fetched ${deliveryAreas?.length || 0} delivery areas`)

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

// POST /api/delivery-areas - Create new delivery area (admin only)
export async function POST(request: NextRequest) {
  try {
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

    // Use admin client to bypass RLS
    const admin = createAdminClient()

    const { data: deliveryArea, error } = await admin
      .from('delivery_areas')
      .insert({
        name: body.name,
        description: body.description,
        delivery_fee: body.delivery_fee,
        min_order_amount: body.min_order_amount || 0,
        estimated_time: body.estimated_time,
        is_active: body.is_active !== undefined ? body.is_active : true,
        display_order: body.display_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating delivery area:', error)
      return NextResponse.json(
        { error: 'Failed to create delivery area' },
        { status: 500 }
      )
    }

    // Invalidate cache after creating delivery area
    await deleteFromCache(CACHE_KEYS.DELIVERY_AREAS)
    memoryCache.delete(CACHE_KEYS.DELIVERY_AREAS)

    return NextResponse.json({ deliveryArea }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
