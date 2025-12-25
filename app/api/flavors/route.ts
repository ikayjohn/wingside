import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedJson, generateETag, etagMatches } from '@/lib/cache-utils';
import {
  getFromCache,
  setCache,
  CACHE_KEYS,
  CACHE_TTL,
  memoryCache
} from '@/lib/redis';

// GET /api/flavors - Fetch all active flavors (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const cacheKey = category
      ? CACHE_KEYS.FLAVORS_BY_CATEGORY(category)
      : CACHE_KEYS.FLAVORS

    // Check client's ETag for conditional request
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

    let query = supabase
      .from('flavors')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: flavors, error } = await query;

    if (error) {
      console.error('Error fetching flavors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch flavors' },
        { status: 500 }
      );
    }

    const responseData = { flavors: flavors || [] };

    // Generate ETag for cache validation
    const etag = generateETag(responseData);

    // Check if client's cached version is still valid
    if (clientETag && etagMatches(clientETag, etag)) {
      return new Response(null, { status: 304 });
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
    });
  } catch (error) {
    console.error('Get flavors error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
