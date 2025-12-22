"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(user);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[#552627] text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Wingside Admin</h1>
        </div>

        <nav className="mt-6">
          <Link
            href="/admin"
            className="block px-6 py-3 hover:bg-[#6d3132] transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/analytics"
            className="block px-6 py-3 hover:bg-[#6d3132] transition-colors"
          >
            Analytics
          </Link>
          <Link
            href="/admin/products"
            className="block px-6 py-3 hover:bg-[#6d3132] transition-colors"
          >
            Products
          </Link>
          <Link
            href="/admin/orders"
            className="block px-6 py-3 hover:bg-[#6d3132] transition-colors"
          >
            Orders
          </Link>
          <Link
            href="/admin/customers"
            className="block px-6 py-3 hover:bg-[#6d3132] transition-colors"
          >
            Customers
          </Link>
          <Link
            href="/admin/users"
            className="block px-6 py-3 hover:bg-[#6d3132] transition-colors"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/delivery-areas"
            className="block px-6 py-3 hover:bg-[#6d3132] transition-colors"
          >
            Delivery Areas
          </Link>
          <Link
            href="/admin/promo-codes"
            className="block px-6 py-3 hover:bg-[#6d3132] transition-colors"
          >
            Promo Codes
          </Link>
          <Link
            href="/admin/stores"
            className="block px-6 py-3 hover:bg-[#6d3132] transition-colors"
          >
            Stores
          </Link>
          <Link
            href="/admin/settings"
            className="block px-6 py-3 hover:bg-[#6d3132] transition-colors"
          >
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-[#6d3132]">
          <p className="text-sm text-gray-300 mb-2">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="text-sm text-[#F7C400] hover:text-[#e5b800] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 p-8">
        {children}
      </div>
    </div>
  );
}
