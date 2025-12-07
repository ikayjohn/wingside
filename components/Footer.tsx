import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <>
      {/* Newsletter Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-white border-b border-gray-200 footer-container">
        <div className="w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Logo */}
            <div className="flex justify-center md:justify-start">
              <div className="text-center md:text-left">
                <img 
                  src="/logo.png" 
                  alt="Wingside Logo" 
                  className="h-40 md:h-60 w-auto mb-3 md:mb-4 mx-auto md:mx-0"
                />
              </div>
            </div>

            {/* Right: Subscribe Form */}
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2" style={{ color: '#552627' }}>
                Subscribe for more
              </h2>
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2" style={{ color: '#F7C400' }}>
                DELICIOUSNESS
              </p>
              <p className="text-gray-500 text-xs md:text-sm mb-6 md:mb-8 leading-relaxed">
                Be the first to know about exclusive offers, benefits, events<br className="hidden lg:block" />
                and more sent via emails. We promise not to spam you.
              </p>
              
              {/* Email Input */}
              <div className="flex mb-6 md:mb-8 w-full max-w-[670px]">
                <div className="relative w-full">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="newsletter-input"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex gap-8">
                <a href="https://www.instagram.com/mywingside/" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="https://x.com/mywingside/" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://www.facebook.com/mywingside/" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/wingside" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/@mywingside" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <footer className="bg-white py-6 md:py-8 footer-container">
        <div className="w-full">
          {/* Footer Navigation */}
          <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4 mb-6 md:mb-8">
            {/* Company Section */}
            <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 gap-y-2">
              <span className="font-bold text-xs uppercase tracking-wide text-gray-900">COMPANY</span>
              <Link href="/order" className="footer-link">Order Now</Link>
              <Link href="/business" className="footer-link">Wingside Business</Link>
              <Link href="/wingcafe" className="footer-link">Wingcafé</Link>
              <Link href="/gifts" className="footer-link">Wingside Gifts</Link>
              <Link href="/connect" className="footer-link">Wingside Connect</Link>
              <Link href="/hotspots" className="footer-link">Wingside Hotspots</Link>
              <Link href="/kids" className="footer-link">Wingside Kids</Link>
              <Link href="/sports" className="footer-link">Wingside Sports</Link>
              <Link href="/wingclub" className="footer-link">Wingclub</Link>
            </div>
          </div>

          {/* Get in Touch Section */}
          <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-8 gap-y-2 mb-6 md:mb-8">
            <span className="font-bold text-xs uppercase tracking-wide text-gray-900">GET IN TOUCH</span>
            <Link href="/about" className="footer-link">About Us</Link>
            <Link href="/careers" className="footer-link">Careers</Link>
            <Link href="/contact" className="footer-link">Contact Us</Link>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-gray-500 pt-4 md:pt-6">
            © 2026 All rights reserved. Wingside Foods.
          </div>
        </div>
      </footer>
    </>
  );
}