/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://4.20.1.116:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Minimize layout shift
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // Security headers to protect the tribe
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevents clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevents MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Controls referrer info
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // XSS protection
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), encrypted-media=(self "https://w.soundcloud.com" "https://soundcloud.com"), autoplay=(self "https://w.soundcloud.com" "https://soundcloud.com")', // Allow audio playback for music player
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
