'use client';

import React, { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          language?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

interface TurnstileProps {
  /**
   * Cloudflare Turnstile site key
   * Get one at: https://dash.cloudflare.com/?to=/:account/turnstile
   */
  siteKey: string;

  /**
   * Callback when verification succeeds
   */
  onSuccess?: (token: string) => void;

  /**
   * Callback when verification fails
   */
  onError?: () => void;

  /**
   * Callback when token expires
   */
  onExpire?: () => void;

  /**
   * Theme of the widget
   */
  theme?: 'light' | 'dark' | 'auto';

  /**
   * Language code
   */
  language?: string;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * ID for the container element
   */
  id?: string;
}

export const Turnstile: React.FC<TurnstileProps> = ({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  theme = 'auto',
  language = 'en',
  className = '',
  id = 'turnstile-container',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Turnstile script
  useEffect(() => {
    if (isLoaded || isScriptLoading || typeof window !== 'undefined' && window.turnstile) {
      setIsLoaded(true);
      return;
    }

    setIsScriptLoading(true);

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
      setIsScriptLoading(false);
    };

    script.onerror = () => {
      console.error('Failed to load Turnstile script');
      setIsScriptLoading(false);
      onError?.();
    };

    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isLoaded, isScriptLoading, onError]);

  // Render Turnstile widget
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) {
      return;
    }

    // Remove existing widget if any
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    // Render new widget
    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onSuccess?.(token);
        },
        'error-callback': () => {
          console.error('Turnstile error');
          onError?.();
        },
        'expired-callback': () => {
          onExpire?.();
        },
        theme,
        language,
      });

      widgetIdRef.current = widgetId;
    } catch (error) {
      console.error('Failed to render Turnstile widget:', error);
      onError?.();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error('Failed to remove Turnstile widget:', error);
        }
      }
    };
  }, [isLoaded, siteKey, onSuccess, onError, onExpire, theme, language]);

  // Reset widget when site key changes
  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (error) {
          console.error('Failed to reset Turnstile widget:', error);
        }
      }
    };
  }, [siteKey]);

  return (
    <div
      id={id}
      ref={containerRef}
      className={className}
    />
  );
};

/**
 * Hook to use Turnstile in forms
 */
export function useTurnstile(siteKey: string) {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isError, setIsError] = useState(false);

  const reset = () => {
    setToken(null);
    setIsVerified(false);
    setIsError(false);
  };

  const TurnstileComponent = React.useMemo(() => {
    return (props: Omit<TurnstileProps, 'siteKey'>) => (
      <Turnstile
        siteKey={siteKey}
        {...props}
        onSuccess={(t) => {
          setToken(t);
          setIsVerified(true);
          setIsError(false);
          props.onSuccess?.(t);
        }}
        onError={() => {
          setIsError(true);
          setIsVerified(false);
          props.onError?.();
        }}
        onExpire={() => {
          setToken(null);
          setIsVerified(false);
          props.onExpire?.();
        }}
      />
    );
  }, [siteKey]);

  return {
    token,
    isVerified,
    isError,
    reset,
    Turnstile: TurnstileComponent,
  };
}

export default Turnstile;
