import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedJson, generateETag, etagMatches } from '@/lib/cache-utils';
import {
  getFromCache,
  setCache,
  deleteFromCache,
  CACHE_KEYS,
  CACHE_TTL,
  memoryCache
} from '@/lib/redis';

// GET /api/stores - Get all active stores
export async function GET(request: NextRequest) {
  try {
    const cacheKey = CACHE_KEYS.STORES
    const clientETag = request.headers.get('if-none-match')

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

    // Cache miss - fetch from database
    const supabase = await createClient();

    // Get all active stores ordered by display_order
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching stores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stores', details: error.message },
        { status: 500 }
      );
    }

    const responseData = { stores: stores || [] };

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
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
