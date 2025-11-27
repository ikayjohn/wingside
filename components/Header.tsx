"use client";

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="w-full bg-white z-50 pt-2.5">
        <div className="w-full gutter-x">
          <div className="flex justify-between items-center h-24">
            {/* Menu Button */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 text-gray-800 hover:text-gray-600"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMenuOpen(false)}>
          <div 
            className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl p-8 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-6">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-4">Menu</h3>
                <ul className="space-y-3">
                  <li>
                    <Link 
                      href="/menu" 
                      className="footer-link block text-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Our Flavors
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/order" 
                      className="footer-link block text-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Order Now
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/wingclub" 
                      className="footer-link block text-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Wingclub
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/delivery" 
                      className="footer-link block text-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Delivery
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-4">Company</h3>
                <ul className="space-y-3">
                  <li>
                    <Link 
                      href="/about" 
                      className="footer-link block text-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/contact" 
                      className="footer-link block text-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/careers" 
                      className="footer-link block text-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link 
                  href="/order"
                  className="btn-primary block text-center w-full"
                  onClick={() => setMenuOpen(false)}
                >
                  Order Now
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}