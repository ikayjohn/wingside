'use client';

import { useEffect } from 'react';
import { registerSW } from '@/lib/service-worker';

export default function ServiceWorkerProvider() {
  useEffect(() => {
    // Only register in production or when explicitly enabled
    if (
      process.env.NEXT_PUBLIC_ENABLE_SW === 'true' ||
      process.env.NODE_ENV === 'production'
    ) {
      registerSW();
    }
  }, []);

  return null;
}
