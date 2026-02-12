import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions'
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

// GET /api/pickup-locations - Fetch all active pickup locations (public)
export async function GET(request: NextRequest) {
  try {
    const cacheKey = CACHE_KEYS.PICKUP_LOCATIONS
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
    const supabase = await createClient()

    const { data: pickupLocations, error } = await supabase
      .from('pickup_locations')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching pickup locations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pickup locations' },
        { status: 500 }
      )
    }

    const responseData = { pickupLocations }

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

// POST /api/pickup-locations - Create new pickup location (admin only)
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

    const userRole = (profile?.role || 'customer') as UserRole

    if (!canAccessAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()

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

    const { data: pickupLocation, error } = await admin
      .from('pickup_locations')
      .insert({
        name: body.name,
        address: body.address,
        city: body.city || 'Port Harcourt',
        state: body.state || 'Rivers',
        phone: body.phone || null,
        opening_hours: body.opening_hours || null,
        estimated_time: body.estimated_time || '15-20 mins',
        is_active: body.is_active !== undefined ? body.is_active : true,
        display_order: body.display_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating pickup location:', error)
      return NextResponse.json(
        { error: 'Failed to create pickup location' },
        { status: 500 }
      )
    }

    // Invalidate cache after creating pickup location
    await deleteFromCache(CACHE_KEYS.PICKUP_LOCATIONS)
    memoryCache.delete(CACHE_KEYS.PICKUP_LOCATIONS)

    return NextResponse.json({ pickupLocation }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
