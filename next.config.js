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
  }
}

module.exports = nextConfig 