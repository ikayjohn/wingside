import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // Static export for Hostinger and other static hosts
  output: 'export',
  trailingSlash: true,

  // Image optimization - unoptimized for static export
  images: {
    unoptimized: true,
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

  // Build optimizations
  webpack: (config, { isServer }) => {
    // Optimize for static hosting
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

export default withBundleAnalyzer(nextConfig)