import { useEffect, useState, useCallback } from 'react'

/**
 * React Hook for CSRF Protection
 * Automatically fetches and includes CSRF token in API requests
 */

export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/csrf')
      const data = await response.json()

      if (response.ok) {
        setCsrfToken(data.token)
      } else {
        setError(data.error || 'Failed to fetch CSRF token')
      }
    } catch (err) {
      setError('Network error while fetching CSRF token')
      console.error('CSRF token fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCsrfToken()
  }, [fetchCsrfToken])

  /**
   * Wrapper around fetch that automatically includes CSRF token
   */
  const csrfFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    }

    // Add CSRF token for state-changing requests
    if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
      if (csrfToken) {
        (headers as any)['x-csrf-token'] = csrfToken
      }
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }

  return {
    csrfToken,
    loading,
    error,
    csrfFetch,
  }
}
