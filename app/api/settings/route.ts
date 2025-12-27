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
    const cacheKey = CACHE_KEYS.SETTINGS
    const clientETag = request.headers.get('if-none-match')

    // Try to get from Redis cache first
    const cachedData = await getFromCache<any>(cacheKey)
    if (cachedData) {
      const etag = generateETag(cachedData)
      if (clientETag && etagMatches(clientETag, etag)) {
        return new Response(null, { status: 304 })
      }
      return cachedJson(cachedData, CACHE_TTL.SHORT, {
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
      return cachedJson(memoryCached, CACHE_TTL.SHORT, {
        headers: {
          'ETag': etag,
          'X-Cache': 'MEMORY',
        },
      })
    }

    // Cache miss - fetch from database
    const supabase = await createClient();

    // Get all settings from site_settings table
    const { data: settingsData, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value, category');

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message },
        { status: 500 }
      );
    }

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
      return new Response(null, { status: 304 })
    }

    // Store in Redis cache (5 minutes - settings may change)
    await setCache(cacheKey, responseData, CACHE_TTL.SHORT)

    // Store in memory cache as fallback (2 minutes)
    memoryCache.set(cacheKey, responseData, 120)

    // Return response with caching headers
    return cachedJson(responseData, CACHE_TTL.SHORT, {
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
