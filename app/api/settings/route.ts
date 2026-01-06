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

// GET /api/settings - Get all public settings
export async function GET(request: NextRequest) {
  try {
    console.log('[Settings API] Request received')

    const cacheKey = CACHE_KEYS.SETTINGS
    const clientETag = request.headers.get('if-none-match')

    // Try to get from Redis cache first
    try {
      const cachedData = await getFromCache<any>(cacheKey)
      if (cachedData) {
        const etag = generateETag(cachedData)
        if (clientETag && etagMatches(clientETag, etag)) {
          console.log('[Settings API] Returning 304 (Redis cache HIT)')
          return new Response(null, { status: 304 })
        }
        console.log('[Settings API] Returning cached data from Redis')
        return cachedJson(cachedData, CACHE_TTL.SHORT, {
          headers: {
            'ETag': etag,
            'X-Cache': 'HIT',
          },
        })
      }
    } catch (redisError) {
      console.warn('[Settings API] Redis cache error (continuing):', redisError.message)
    }

    // Check memory cache fallback
    const memoryCached = memoryCache.get(cacheKey)
    if (memoryCached) {
      const etag = generateETag(memoryCached)
      if (clientETag && etagMatches(clientETag, etag)) {
        console.log('[Settings API] Returning 304 (Memory cache HIT)')
        return new Response(null, { status: 304 })
      }
      console.log('[Settings API] Returning cached data from memory')
      return cachedJson(memoryCached, CACHE_TTL.SHORT, {
        headers: {
          'ETag': etag,
          'X-Cache': 'MEMORY',
        },
      })
    }

    // Cache miss - fetch from database
    console.log('[Settings API] Cache miss, fetching from database')
    const supabase = await createClient();

    // Get all settings from site_settings table
    const { data: settingsData, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value, category');

    if (error) {
      console.error('[Settings API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message, settings: {} },
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    console.log('[Settings API] Fetched', settingsData?.length || 0, 'settings from database')

    // Convert array to nested object grouped by category
    const settingsByCategory: Record<string, Record<string, string>> = {};
    const flatSettings: Record<string, string> = {};

    settingsData?.forEach(item => {
      const category = item.category || 'general';
      const key = item.setting_key;
      const value = item.setting_value || '';

      // Group by category
      if (!settingsByCategory[category]) {
        settingsByCategory[category] = {};
      }
      settingsByCategory[category][key] = value;

      // Also provide flat structure for easier access
      flatSettings[key] = value;
    });

    const responseData = {
      settings: flatSettings,
      settingsByCategory
    };

    // Generate ETag for cache validation
    const etag = generateETag(responseData)

    // Check if client's cached version is still valid
    if (clientETag && etagMatches(clientETag, etag)) {
      console.log('[Settings API] Returning 304 (fresh data)')
      return new Response(null, { status: 304 })
    }

    // Try to store in Redis cache (don't fail if Redis is down)
    try {
      await setCache(cacheKey, responseData, CACHE_TTL.SHORT)
      console.log('[Settings API] Stored in Redis cache')
    } catch (redisError) {
      console.warn('[Settings API] Failed to store in Redis (continuing):', redisError.message)
    }

    // Store in memory cache as fallback (2 minutes)
    memoryCache.set(cacheKey, responseData, 120)
    console.log('[Settings API] Stored in memory cache')

    // Return response with caching headers
    console.log('[Settings API] Returning fresh data')
    return cachedJson(responseData, CACHE_TTL.SHORT, {
      headers: {
        'ETag': etag,
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('[Settings API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', settings: {} },
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
