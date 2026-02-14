"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchSettings } from '@/lib/settings';
import { getVisibleLinks } from '@/lib/page-visibility';
import type { NavigationLink } from '@/lib/navigation-links';

export default function Header() {
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  const isOrderPage = pathname === '/order' || pathname === '/order/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [visibleHeaderLinks, setVisibleHeaderLinks] = useState<NavigationLink[]>([]);

  // Fetch visible navigation links
  useEffect(() => {
    fetchSettings().then(settings => {
      setVisibleHeaderLinks(getVisibleLinks(settings, 'header'));
    }).catch(error => {
      console.error('Failed to fetch navigation settings:', error);
      // Keep empty array if fetch fails - graceful degradation
    });
  }, []);

  // Handle scroll effect for homepage
  useEffect(() => {
    if (!isHomepage) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomepage]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          name: user.user_metadata.full_name || 'User',
          email: user.email || '',
        });
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata.full_name || 'User',
          email: session.user.email || '',
        });
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDashboardDropdownOpen(false);
      }
    }

    if (dashboardDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dashboardDropdownOpen]);

  const handleLogout = async () => {
    setDashboardDropdownOpen(false);
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setIsClosing(false);
    }, 300);
  };

  return (
    <>
      {/* Header */}
      <header
        className={`w-full z-50 transition-all duration-300 ${isOrderPage
            ? 'bg-white pt-2.5'
            : isHomepage
              ? isScrolled
                ? 'bg-white sticky top-0 shadow-md py-2.5'
                : 'bg-transparent absolute top-0 left-0 right-0 pt-2.5'
              : 'bg-white sticky top-0 shadow-md py-2.5'
          }`}
      >
        <div className="w-full gutter-x">
          <div className={`flex justify-between items-center ${(isHomepage && isScrolled) || (!isHomepage && !isOrderPage)
              ? 'lg:h-25 h-20'
              : 'h-34'
            }`}>
            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className={`flex items-center gap-2 cursor-pointer transition-colors ${isHomepage && !isScrolled
                  ? 'text-white hover:text-gray-200'
                  : 'text-gray-800 hover:text-gray-600'
                }`}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              <span className="text-sm font-medium">Menu</span>
            </button>

            {/* Logo - Centered - Optimized with Next.js Image */}
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 hover:opacity-80">
              <Image
                src={isHomepage && !isScrolled ? "/logo-white.png?v=2" : "/logo.png?v=2"}
                alt="Wingside Logo"
                width={150}
                height={150}
                quality={80}
                priority
                sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                className={`w-auto transition-all duration-300 ${(isHomepage && isScrolled) || (!isHomepage && !isOrderPage)
                    ? 'h-12 sm:h-16'
                    : 'h-16 sm:h-20 md:h-24'
                  }`}
              />
            </Link>

            {/* CTA Buttons */}
            <div className="flex gap-2 md:gap-3 lg:gap-4 items-center">
              {isLoggedIn ? (
                <div className="relative hidden sm:block" ref={dropdownRef}>
                  <button
                    onClick={() => setDashboardDropdownOpen(!dashboardDropdownOpen)}
                    className={`header-dashboard-btn ${isHomepage && !isScrolled ? '!border-transparent' : ''}`}
                    aria-label="Toggle dashboard menu"
                    aria-expanded={dashboardDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="header-avatar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="md:w-4 md:h-4">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <span className="hidden lg:inline">My Dashboard</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`ml-0 lg:ml-1 transition-transform ${dashboardDropdownOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {dashboardDropdownOpen && (
                    <div className="dashboard-dropdown" role="menu" aria-label="User dashboard menu">
                      {/* User Info */}
                      <div className="dashboard-dropdown-user">
                        <div className="dashboard-dropdown-avatar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <div className="dashboard-dropdown-status"></div>
                        </div>
                        <div>
                          <p className="dashboard-dropdown-name">{user?.name}</p>
                          <p className="dashboard-dropdown-email">{user?.email}</p>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="dashboard-dropdown-divider"></div>

                      <Link href="/my-account/dashboard" className="dashboard-dropdown-item" onClick={() => setDashboardDropdownOpen(false)} role="menuitem" tabIndex={0}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        Dashboard
                      </Link>

                      <Link href="/my-account/orders" className="dashboard-dropdown-item" onClick={() => setDashboardDropdownOpen(false)} role="menuitem" tabIndex={0}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Orders
                      </Link>

                      <Link href="/my-account/wallet-history" className="dashboard-dropdown-item" onClick={() => setDashboardDropdownOpen(false)} role="menuitem" tabIndex={0}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        Wallet History
                      </Link>

                      <Link href="/my-account/edit-profile" className="dashboard-dropdown-item" onClick={() => setDashboardDropdownOpen(false)} role="menuitem" tabIndex={0}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Edit Profile
                      </Link>

                      <Link href="/my-account/my-addresses" className="dashboard-dropdown-item" onClick={() => setDashboardDropdownOpen(false)} role="menuitem" tabIndex={0}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        My Addresses
                      </Link>

                      <div className="dashboard-dropdown-divider"></div>

                      <button onClick={handleLogout} className="dashboard-dropdown-item dashboard-dropdown-logout" role="menuitem" tabIndex={0}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/my-account"
                  className={`text-sm font-bold hidden sm:block transition-colors ${isHomepage && !isScrolled
                      ? 'text-white hover:text-gray-200'
                      : 'text-gray-700 hover:text-gray-900'
                    }`}
                >
                  Sign In
                </Link>
              )}
              <Link
                href="/order"
                className="btn-primary"
              >
                Order now
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className={`fixed inset-0 bg-black/50 z-50 sidebar-overlay ${isClosing ? 'closing' : ''}`}
          onClick={handleClose}
          role="presentation"
          aria-hidden="true"
        >
          <div
            className={`fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto sidebar-panel z-50 ${isClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Sidebar Header */}
            <div className="flex justify-between items-start px-10 py-10">
              <div>
                <img
                  src="/logo.png"
                  alt="Wingside Logo"
                  className="h-24 w-auto"
                  loading="lazy"
                />
              </div>
              <button
                onClick={handleClose}
                className="text-gray-800 hover:text-gray-600 p-1"
                aria-label="Close navigation menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Sidebar Links */}
            <nav className="px-10 py-4" aria-label="Main navigation">
              <ul className="space-y-4" role="menu">
                {isLoggedIn ? (
                  <>
                    <li role="none">
                      <Link
                        href="/my-account/dashboard"
                        className="sidebar-link"
                        onClick={handleClose}
                        role="menuitem"
                      >
                        Dashboard
                      </Link>
                    </li>
                    <li role="none">
                      <button
                        onClick={() => {
                          handleClose();
                          handleLogout();
                        }}
                        className="sidebar-link w-full text-left"
                        role="menuitem"
                      >
                        Log out
                      </button>
                    </li>
                  </>
                ) : (
                  <li role="none">
                    <Link
                      href="/my-account"
                      className="sidebar-link"
                      onClick={handleClose}
                      role="menuitem"
                    >
                      Sign In
                    </Link>
                  </li>
                )}

                {/* Valentine's Special Link */}
                <li role="none">
                  <Link
                    href="/valentines"
                    className="sidebar-link"
                    onClick={handleClose}
                    role="menuitem"
                  >
                    Valentine's Special
                  </Link>
                </li>

                {/* Dynamic navigation links based on visibility settings */}
                {visibleHeaderLinks.map((link) => (
                  <li key={link.id} role="none">
                    <Link
                      href={link.href}
                      className="sidebar-link"
                      onClick={handleClose}
                      role="menuitem"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Order Button */}
              <div className="mt-8">
                <Link
                  href="/order"
                  className="sidebar-order-btn"
                  onClick={handleClose}
                >
                  Order now
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
