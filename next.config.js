/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages in server components
  experimental: {
    // External packages in server components
    serverExternalPackages: ['@prisma/client'],
    
    // Disable strict mode for development
    strictNextHead: false,
  },
}

module.exports = nextConfig 