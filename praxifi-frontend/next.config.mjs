/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
  // Increase timeout for long-running API requests (for large datasets)
  experimental: {
    proxyTimeout: 0, // No timeout
  },
  // Server-side fetch timeout configuration
  serverExternalPackages: [],
}

export default nextConfig
