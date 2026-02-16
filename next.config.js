/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Segurança
  poweredByHeader: false,

  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'qjrjkjknesacrurvcthu.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      // CDN comum para imagens
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      // Imgur (caso usado)
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      // Wikipedia/Wikimedia (imagens de questões)
      {
        protocol: 'https',
        hostname: '*.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: '*.wikipedia.org',
      },
      // INEP / MEC (provas oficiais)
      {
        protocol: 'https',
        hostname: '*.inep.gov.br',
      },
      {
        protocol: 'https',
        hostname: '*.mec.gov.br',
      },
      // Catch-all para imagens educacionais
      {
        protocol: 'https',
        hostname: '*.wp.com',
      },
      {
        protocol: 'https',
        hostname: '*.staticflickr.com',
      },
    ],
    minimumCacheTTL: 60,
    // Desabilitar otimização para URLs externas problemáticas
    unoptimized: false,
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
