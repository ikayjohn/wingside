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
    const cacheKey = CACHE_KEYS.CATEGORIES
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
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    const responseData = { categories }

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
