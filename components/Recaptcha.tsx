'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface RecaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
  action?: string;
}

export const Recaptcha: React.FC<RecaptchaProps> = ({
  siteKey,
  onVerify,
  action = 'submit',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if already loaded AND ready
    if (typeof window !== 'undefined' && window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
      setIsLoaded(true);
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for grecaptcha to be fully ready
      const checkReady = () => {
        if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
          setIsLoaded(true);
        } else {
          // Check again in 100ms
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    };

    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove the script as other components might need it
    };
  }, [siteKey]);

  const executeRecaptcha = async () => {
    if (!isLoaded || !window.grecaptcha) {
      console.warn('reCAPTCHA not loaded yet');
      return;
    }

    // Check if execute function is available (it might not be ready immediately)
    if (typeof window.grecaptcha.execute !== 'function') {
      console.warn('reCAPTCHA execute function not ready yet, retrying...');
      // Retry after a short delay
      setTimeout(() => executeRecaptcha(), 500);
      return;
    }

    try {
      const token = await window.grecaptcha.execute(siteKey, { action });
      onVerify(token);
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
    }
  };

  // Auto-execute when component mounts (invisible verification)
  useEffect(() => {
    if (isLoaded) {
      // Wait longer for script to fully initialize
      const timer = setTimeout(() => {
        executeRecaptcha();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  return null; // Invisible component
};

/**
 * Hook to use reCAPTCHA v3 in forms
 */
export function useRecaptcha(siteKey: string, action: string = 'submit') {
  const [token, setToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const execute = async (): Promise<string | null> => {
    if (typeof window === 'undefined' || !window.grecaptcha) {
      console.warn('reCAPTCHA not available');
      return null;
    }

    // Check if execute function is available
    if (typeof window.grecaptcha.execute !== 'function') {
      console.warn('reCAPTCHA execute function not ready');
      return null;
    }

    setIsVerifying(true);
    try {
      const newToken = await window.grecaptcha.execute(siteKey, { action });
      setToken(newToken);
      setIsVerifying(false);
      return newToken;
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      setIsVerifying(false);
      return null;
    }
  };

  const reset = () => {
    setToken(null);
  };

  return {
    token,
    isVerifying,
    execute,
    reset,
  };
}

export default Recaptcha;
