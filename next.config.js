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
}

module.exports = nextConfig 