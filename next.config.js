/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Segurança
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'qjrjkjknesacrurvcthu.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // API ENEM - imagens das questões
      {
        protocol: 'https',
        hostname: 'enem.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.enem.dev',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60,
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
