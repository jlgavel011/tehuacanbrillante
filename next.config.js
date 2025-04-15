/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration options
  experimental: {
    // Disable strict mode for development
    strictNextHead: false,
  },
  
  // Add compiler options
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true
  },
  
  // Ensure environment variables are available to the client
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  
  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimization for production
  reactStrictMode: false,
  
  // Disable eslint in build
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 