"use client";

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [actualPath, setActualPath] = useState('/');

  useEffect(() => {
    // Get the actual browser URL, not the Next.js pathname
    // This handles rewrites where pathname != actual URL
    setActualPath(window.location.pathname);

    // Debug logging
    console.log('[AdminLayout] Next.js pathname:', pathname);
    console.log('[AdminLayout] Browser pathname:', window.location.pathname);
  }, [pathname]);

  const isAdmin = pathname?.startsWith('/admin');
  const isMaintenance = actualPath.startsWith('/maintenance');

  console.log('[AdminLayout] Final check:', { isAdmin, isMaintenance, actualPath });

  // Don't show Header/Footer for admin pages or maintenance page
  if (isAdmin || isMaintenance) {
    console.log('[AdminLayout] Skipping Header/Footer');
    return <>{children}</>;
  }

  console.log('[AdminLayout] Showing Header/Footer');
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
