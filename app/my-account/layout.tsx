"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { canAccessAdmin, UserRole } from '@/lib/permissions';

export default function MyAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Removed redirect from layout to prevent infinite loops
  // Redirects are handled in login page and my-account pages

  return <>{children}</>;
}
