"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
      <header className="w-full bg-white z-50 pt-2.5">
        <div className="w-full gutter-x">
          <div className="flex justify-between items-center h-24">
            {/* Menu Button */}
            <button 
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-2 text-gray-800 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              <span className="text-sm font-medium">Menu</span>
            </button>
            
            {/* Logo - Centered */}
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 hover:opacity-80">
              <img 
                src="/logo.png" 
                alt="Wingside Logo" 
                className="h-24 w-auto"
              />
            </Link>

            {/* CTA Buttons */}
            <div className="flex gap-4 items-center">
              <Link 
                href="/wingclub" 
                className="text-sm text-gray-700 hover:text-gray-900 hidden sm:block"
              >
                Join the Wingclub
              </Link>
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
          className={`fixed inset-0 bg-black/50 z-40 sidebar-overlay ${isClosing ? 'closing' : ''}`} 
          onClick={handleClose}
        >
          <div 
            className={`fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto sidebar-panel ${isClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="flex justify-between items-start px-10 py-10">
              <div>
                <img 
                  src="/logo.png" 
                  alt="Wingside Logo" 
                  className="h-24 w-auto"
                />
              </div>
              <button 
                onClick={handleClose}
                className="text-gray-800 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* Sidebar Links */}
            <nav className="px-10 py-4">
              <ul className="space-y-4">
                <li>
                  <Link 
                    href="/business" 
                    className="sidebar-link"
                    onClick={handleClose}
                  >
                    Wingside Business
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/wingcafe" 
                    className="sidebar-link"
                    onClick={handleClose}
                  >
                    Wingcafé
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/gifts" 
                    className="sidebar-link"
                    onClick={handleClose}
                  >
                    Wingside Gifts
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/connect" 
                    className="sidebar-link"
                    onClick={handleClose}
                  >
                    Wingside Connect
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/hotspots" 
                    className="sidebar-link"
                    onClick={handleClose}
                  >
                    Wingside Hotspots
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/kids" 
                    className="sidebar-link"
                    onClick={handleClose}
                  >
                    Wingside Kids
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/sports" 
                    className="sidebar-link"
                    onClick={handleClose}
                  >
                    Wingside Sports
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/wingclub" 
                    className="sidebar-link"
                    onClick={handleClose}
                  >
                    Join the Wingclub
                  </Link>
                </li>
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