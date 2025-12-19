import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Removed static export - now supports server-side features
  trailingSlash: true,
  images: {
    // Can now use Next.js image optimization
    domains: [], // Add image domains as needed
  },
}

export default nextConfig