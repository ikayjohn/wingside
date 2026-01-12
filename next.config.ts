import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standard Next.js build (for Vercel, Node.js, or Hostinger VPS)
  trailingSlash: true,

  // Image optimization with Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Optimize for production
  compress: true,
  poweredByHeader: false,

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig