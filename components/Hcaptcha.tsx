'use client';

import React, { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    hcaptcha: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark';
          size?: 'normal' | 'compact' | 'invisible';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

interface HcaptchaProps {
  siteKey: string;
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark';
  className?: string;
  id?: string;
}

export const Hcaptcha: React.FC<HcaptchaProps> = ({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  theme = 'light',
  className = '',
  id = 'hcaptcha-container',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load hCaptcha script
  useEffect(() => {
    if (isLoaded || isScriptLoading || typeof window !== 'undefined' && window.hcaptcha) {
      setIsLoaded(true);
      return;
    }

    setIsScriptLoading(true);

    const script = document.createElement('script');
    script.src = 'https://hcaptcha.com/1/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
      setIsScriptLoading(false);
    };

    script.onerror = () => {
      console.error('Failed to load hCaptcha script');
      setIsScriptLoading(false);
      onError?.();
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isLoaded, isScriptLoading, onError]);

  // Render hCaptcha widget
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.hcaptcha) {
      return;
    }

    // Remove existing widget if any
    if (widgetIdRef.current) {
      window.hcaptcha.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    // Render new widget
    try {
      const widgetId = window.hcaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onSuccess?.(token);
        },
        'error-callback': () => {
          console.error('hCaptcha error');
          onError?.();
        },
        'expired-callback': () => {
          onExpire?.();
        },
        theme,
      });

      widgetIdRef.current = widgetId;
    } catch (error) {
      console.error('Failed to render hCaptcha widget:', error);
      onError?.();
    }

    return () => {
      if (widgetIdRef.current && window.hcaptcha) {
        try {
          window.hcaptcha.remove(widgetIdRef.current);
        } catch (error) {
          console.error('Failed to remove hCaptcha widget:', error);
        }
      }
    };
  }, [isLoaded, siteKey, onSuccess, onError, onExpire, theme]);

  // Reset widget when site key changes
  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.hcaptcha) {
        try {
          window.hcaptcha.reset(widgetIdRef.current);
        } catch (error) {
          console.error('Failed to reset hCaptcha widget:', error);
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

export default Hcaptcha;
