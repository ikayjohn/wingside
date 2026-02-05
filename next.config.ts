import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standard Next.js build (for Vercel, Node.js, or Hostinger VPS)
  // IMPORTANT: trailingSlash causes webhook issues! API routes should NOT redirect.
  // Nomba webhook URL must include trailing slash: /api/payment/nomba/webhook/
  trailingSlash: true,

  // Redirects for unified authentication
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/my-account',
        permanent: true,
      },
      {
        source: '/login/',
        destination: '/my-account/',
        permanent: true,
      },
    ]
  },

  // Image optimization with Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cxbqochxrhokdscgijxe.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    unoptimized: false,
  },

  // Optimize for production
  compress: true,
  poweredByHeader: false,

  // Production optimizations for VPS
  reactStrictMode: true,

  // Output configuration for VPS
  output: 'standalone',

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },

  // Security headers (CSP removed due to conflicts with API routes)
  async headers() {
    return [
      {
        // Cache video files aggressively
        source: '/:path*.mp4',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        // Cache images aggressively
        source: '/:path*.(jpg|jpeg|png|gif|webp|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        // Cache fonts aggressively
        source: '/:path*.(woff|woff2|eot|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        // Cache static assets
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self)'
          },
        ],
      },
    ]
  },
}

export default nextConfig