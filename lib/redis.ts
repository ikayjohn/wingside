/**
 * Redis Client Configuration
 * Provides caching layer for frequently accessed data
 */

import type { Redis as RedisType } from 'ioredis';

let Redis: typeof import('ioredis').default | null = null;
try {
  Redis = require('ioredis');
} catch (e) {
  // ioredis not available, caching will be disabled
  console.warn('ioredis package not found. Caching disabled.');
}

// Get Redis connection URL from environment
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_LOCAL_URL;

// Create Redis client singleton
let redis: RedisType | null = null;

export function getRedisClient(): RedisType | null {
  if (!REDIS_URL || !Redis) {
    if (!Redis) {
      console.warn('[Redis] Package not available. Using in-memory cache fallback.');
    } else {
      console.warn('[Redis] URL not configured. Using in-memory cache fallback.');
    }
    return null;
  }

  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      // Fallback to in-memory caching if Redis is unavailable
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
      redis = null;
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
  }

  return redis;
}

/**
 * Cache keys with namespacing
 */
export const CACHE_KEYS = {
  PRODUCTS: 'wingside:products',
  PRODUCTS_ALL: 'wingside:products:all',
  PRODUCTS_BY_CATEGORY: (categoryId: string) => `wingside:products:category:${categoryId}`,
  FLAVORS: 'wingside:flavors',
  FLAVORS_BY_CATEGORY: (category: string) => `wingside:flavors:category:${category}`,
  CATEGORIES: 'wingside:categories',
  DELIVERY_AREAS: 'wingside:delivery-areas',
  PICKUP_LOCATIONS: 'wingside:pickup-locations',
  STORES: 'wingside:stores',
  SETTINGS: 'wingside:settings',
  PROMO_CODES: 'wingside:promo-codes',
  USER_PROFILE: (userId: string) => `wingside:user:${userId}`,
  USER_WALLET: (userId: string) => `wingside:wallet:${userId}`,
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CACHE_TTL = {
  SHORT: 300,        // 5 minutes - user data, wallet
  MEDIUM: 1800,      // 30 minutes - delivery areas, locations
  LONG: 3600,        // 1 hour - products, flavors
  EXTENDED: 86400,   // 24 hours - categories, settings
} as const;

/**
 * Get data from Redis cache
 * Returns null if Redis is unavailable - API routes will fall back to memory cache
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    // Graceful degradation: return null if Redis unavailable
    if (!client) return null;

    const data = await client.get(key);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (error) {
    console.error('[Redis] GET error:', error);
    return null;
  }
}

/**
 * Set data in Redis cache
 * Silently fails if Redis is unavailable - memory cache is used as fallback
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<void> {
  try {
    const client = getRedisClient();
    // Graceful degradation: return early if Redis unavailable
    if (!client) return;

    await client.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('[Redis] SET error:', error);
  }
}

/**
 * Delete data from Redis cache
 */
export async function deleteFromCache(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) return;

    await client.del(key);
  } catch (error) {
    console.error('Redis DELETE error:', error);
  }
}

/**
 * Delete multiple cache keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) return;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error('Redis DELETE pattern error:', error);
  }
}

/**
 * Clear all Wingside cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) return;

    const keys = await client.keys('wingside:*');
    if (keys.length > 0) {
      await client.del(...keys);
      console.log(`✅ Cleared ${keys.length} cache entries`);
    }
  } catch (error) {
    console.error('Redis CLEAR error:', error);
  }
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  // Invalidate all product-related caches
  async products() {
    console.log('[Cache Invalidation] Clearing product caches')
    await deleteCachePattern('wingside:products*');
    // Also clear memory cache
    memoryCache.deletePattern('wingside:products*');
    console.log('[Cache Invalidation] Product caches cleared')
  },

  // Invalidate all flavor-related caches
  async flavors() {
    await deleteCachePattern('wingside:flavors*');
    // Also clear memory cache
    memoryCache.deletePattern('wingside:flavors*');
  },

  // Invalidate categories cache
  async categories() {
    console.log('[Cache Invalidation] Clearing categories cache')
    await deleteFromCache(CACHE_KEYS.CATEGORIES);
    // Also clear memory cache
    memoryCache.delete(CACHE_KEYS.CATEGORIES);
    memoryCache.delete('categories_all');
    console.log('[Cache Invalidation] Categories cache cleared')
  },

  // Invalidate user-specific caches
  async user(userId: string) {
    await deleteFromCache(CACHE_KEYS.USER_PROFILE(userId));
    await deleteFromCache(CACHE_KEYS.USER_WALLET(userId));
    // Also clear memory cache
    memoryCache.delete(CACHE_KEYS.USER_PROFILE(userId));
    memoryCache.delete(CACHE_KEYS.USER_WALLET(userId));
  },

  // Invalidate all location caches
  async locations() {
    await deleteFromCache(CACHE_KEYS.DELIVERY_AREAS);
    await deleteFromCache(CACHE_KEYS.PICKUP_LOCATIONS);
    await deleteFromCache(CACHE_KEYS.STORES);
    // Also clear memory cache
    memoryCache.delete(CACHE_KEYS.DELIVERY_AREAS);
    memoryCache.delete(CACHE_KEYS.PICKUP_LOCATIONS);
    memoryCache.delete(CACHE_KEYS.STORES);
  },

  // Invalidate settings cache
  async settings() {
    await deleteFromCache(CACHE_KEYS.SETTINGS);
    // Also clear memory cache
    memoryCache.delete(CACHE_KEYS.SETTINGS);
  },
};

/**
 * Graceful degradation: Fallback to in-memory cache if Redis fails
 */
class MemoryCache {
  private cache = new Map<string, { value: unknown; expiry: number }>();

  set(key: string, value: unknown, ttl: number): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
  }

  get(key: string): unknown {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Delete all keys matching a pattern
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    console.log(`[Memory Cache] Deleted ${deletedCount} keys matching pattern: ${pattern}`)
  }
}

// Fallback in-memory cache
const memoryCache = new MemoryCache();

export { memoryCache };
