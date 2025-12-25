/**
 * Cache utility functions for API responses
 * Optimizes performance by setting appropriate cache headers
 */

// Cache durations in seconds
export const CACHE_DURATIONS = {
  // Static data that rarely changes
  PRODUCTS: 3600, // 1 hour
  FLAVORS: 3600, // 1 hour
  CATEGORIES: 86400, // 24 hours
  SETTINGS: 300, // 5 minutes

  // Semi-static data
  DELIVERY_AREAS: 1800, // 30 minutes
  PICKUP_LOCATIONS: 1800, // 30 minutes
  STORES: 1800, // 30 minutes

  // Dynamic data
  ORDERS: 0, // No caching
  USER_PROFILE: 60, // 1 minute
  WALLET_BALANCE: 30, // 30 seconds

  // Public data
  PROMO_CODES: 300, // 5 minutes
} as const;

/**
 * Set cache headers on NextResponse
 */
export function setCacheHeaders(
  response: Response,
  maxAge: number,
  staleWhileRevalidate?: number
): Response {
  // Clone the response to modify headers
  const headers = new Headers(response.headers);

  // Cache-Control header
  let cacheControl = `public, max-age=${maxAge}`;

  if (staleWhileRevalidate) {
    cacheControl += `, stale-while-revalidate=${staleWhileRevalidate}`;
  }

  headers.set('Cache-Control', cacheControl);

  // Add CDN cache headers if using Vercel/CDN
  headers.set('CDN-Cache-Control', cacheControl);

  // Add ETag for validation
  headers.set('ETag', `"${Date.now()}"`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create a cached JSON response
 */
export function cachedJson(data: any, maxAge: number, init?: ResponseInit): Response {
  const response = new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${maxAge}`,
    },
  });

  return response;
}

/**
 * Generate ETag from data for cache validation
 */
export function generateETag(data: any): string {
  const str = JSON.stringify(data);
  // Simple hash using built-in crypto
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${hash.toString(16)}"`;
}

/**
 * Check if client's ETag matches current data
 */
export function etagMatches(clientETag: string | null, currentETag: string): boolean {
  return clientETag === currentETag;
}
