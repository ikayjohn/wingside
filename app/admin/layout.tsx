"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const checkUser = useCallback(async () => {
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
  }, [supabase, router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { href: '/admin/analytics', label: 'Analytics', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    {
      label: 'WingCommerce',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
      children: [
        { href: '/admin/orders', label: 'Orders' },
        { href: '/admin/products', label: 'Products' },
        { href: '/admin/categories', label: 'Categories' },
        { href: '/admin/flavors', label: 'Flavors' },
        { href: '/admin/delivery-areas', label: 'Delivery Areas' },
        { href: '/admin/promo-codes', label: 'Promo Codes' },
        { href: '/admin/customers', label: 'Customers' },
      ]
    },
    {
      label: 'CRM',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      children: [
        { href: '/admin/customers', label: 'Customers' },
        { href: '/admin/referrals', label: 'Referrals' },
        { href: '/admin/crm-analytics', label: 'CRM Analytics' },
      ]
    },
    { href: '/admin/events', label: 'Events', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { href: '/admin/blog/posts', label: 'Blog Posts', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
    { href: '/admin/sports-events', label: 'Sports Events', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { href: '/admin/notifications', label: 'Notifications', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    {
      label: 'Careers',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      children: [
        { href: '/admin/job-positions', label: 'Job Positions' },
        { href: '/admin/job-applications', label: 'Job Applications' },
      ]
    },
    { href: '/admin/stores', label: 'Stores', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { href: '/admin/wingpost-locations', label: 'Wingpost Locations', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { href: '/admin/contact-submissions', label: 'Contact Submissions', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { href: '/admin/social-verifications', label: 'Social Verifications', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    {
      label: 'Settings',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      children: [
        { href: '/admin/hero-slides', label: 'Hero Slides' },
        { href: '/admin/users', label: 'Manage Users' },
        { href: '/admin/settings', label: 'System Settings' },
        { href: '/admin/maintenance', label: 'Maintenance Mode' },
        { href: '/admin/test-embedly-sync', label: 'Embedly Sync Test' },
      ]
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#552627] mx-auto mb-4"></div>
          <div className="text-gray-600">Loading Wingside Cockpit...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Full Height */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[274px] bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-center relative">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden absolute left-6 text-gray-900 hover:text-[#552627] p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img
            src="/logo.png"
            alt="Wingside"
            className="h-[72px] w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item, index) => {
            const hasChildren = 'children' in item;
            const isActive = !hasChildren && pathname === item.href;
            const isDropdownOpen = openDropdown === item.label;
            const hasActiveChild = hasChildren && item.children?.some(child => pathname === child.href);

            if (hasChildren) {
              return (
                <div key={index} className="space-y-0.5">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    className={`
                      w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${item.label === 'WingCommerce'
                        ? 'bg-[#FFFDE7] text-gray-900 hover:bg-[#FFF9C4] font-extrabold'
                        : hasActiveChild
                          ? 'bg-[#552627] text-white font-semibold shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-[#552627]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className={`text-sm ${item.label === 'WingCommerce' ? 'font-extrabold' : 'font-medium'}`}>{item.label}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="ml-4 space-y-0.5">
                      {item.children?.map((child) => {
                        const childIsActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`
                              block px-4 py-2.5 rounded-lg text-xs transition-all duration-200
                              ${childIsActive
                                ? 'bg-[#552627] text-white font-semibold shadow-md'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-[#552627]'
                              }
                            `}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-[#552627] text-white font-semibold shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#552627]'
                  }
                `}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <span className="ml-auto">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Maintenance Mode Link at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/admin/maintenance"
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${pathname === '/admin/maintenance'
                ? 'bg-[#552627] text-white font-semibold shadow-md'
                : 'text-gray-700 hover:bg-gray-100 hover:text-[#552627]'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">Maintenance Mode</span>
            {pathname === '/admin/maintenance' && (
              <span className="ml-auto">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-[274px]">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Wingside® Cockpit</h1>

            {/* User Info & Actions */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#552627] rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-white">A</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F7C400] hover:bg-[#e5a800] text-gray-900 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="hidden sm:inline">View Site</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Links */}
              <div>
                <h3 className="text-sm font-semibold text-[#552627] uppercase tracking-wider mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/" target="_blank" className="block text-gray-600 hover:text-gray-900 text-sm transition-colors">
                    View Website
                  </Link>
                  <Link href="/admin" className="block text-gray-600 hover:text-gray-900 text-sm transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/admin/orders" className="block text-gray-600 hover:text-gray-900 text-sm transition-colors">
                    Recent Orders
                  </Link>
                </div>
              </div>

              {/* System Info */}
              <div>
                <h3 className="text-sm font-semibold text-[#552627] uppercase tracking-wider mb-3">System</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Server Time: <span className="text-gray-900">{new Date().toLocaleTimeString()}</span></p>
                  <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-sm font-semibold text-[#552627] uppercase tracking-wider mb-3">Support</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>admin@wingside.com</p>
                  <p>Wingside Cockpit</p>
                  <p className="text-xs text-gray-400">Version 1.0.0</p>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  © {new Date().getFullYear()} Wingside Foods Limited. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
