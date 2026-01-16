"use client";

import { usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const actualPath = useMemo(() => {
    // Get the actual browser URL, not the Next.js pathname
    // This handles rewrites where pathname != actual URL
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return pathname;
  }, [pathname]);

  const isAdmin = pathname?.startsWith('/admin');
  const isMaintenance = actualPath.startsWith('/maintenance');

  // Don't show Header/Footer for admin pages or maintenance page
  if (isAdmin || isMaintenance) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
