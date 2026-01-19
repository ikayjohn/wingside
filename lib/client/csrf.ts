/**
 * Client-side CSRF utility
 * Fetches and manages CSRF tokens for API requests
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const TOKEN_CACHE_DURATION = 50 * 60 * 1000; // 50 minutes (tokens last 1 hour)

/**
 * Fetch a CSRF token from the server
 * Caches the token locally to avoid unnecessary requests
 */
export async function getCsrfToken(): Promise<string | null> {
  try {
    // Check if we have a cached token that's still valid
    const cached = localStorage.getItem(CSRF_TOKEN_KEY);
    if (cached) {
      const { token, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      // Use cached token if it's less than 50 minutes old
      if (age < TOKEN_CACHE_DURATION) {
        return token;
      }

      // Token is too old, remove it
      localStorage.removeItem(CSRF_TOKEN_KEY);
    }

    // Fetch a new token from the server
    const response = await fetch('/api/csrf/token');

    if (!response.ok) {
      console.error('Failed to fetch CSRF token:', response.statusText);
      return null;
    }

    const data = await response.json();

    // Cache the token
    localStorage.setItem(
      CSRF_TOKEN_KEY,
      JSON.stringify({
        token: data.token,
        timestamp: Date.now(),
      })
    );

    return data.token;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
}

/**
 * Make a fetch request with CSRF protection
 * Automatically includes the CSRF token in the headers
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getCsrfToken();

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  // Add CSRF token if we have one and this is a state-changing request
  if (token && options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
    (headers as any)['x-csrf-token'] = token;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Clear the cached CSRF token
 * Call this after logging out
 */
export function clearCsrfToken(): void {
  localStorage.removeItem(CSRF_TOKEN_KEY);
}
