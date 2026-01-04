/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',  // Necessário para Docker/Cloud Run

  // Otimizações para Cloud Run
  poweredByHeader: false, // Remove header X-Powered-By

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Otimização de imagens para Cloud Run
    minimumCacheTTL: 60,
  },

  // Server Actions - permite origens Cloud Run
  experimental: {
    serverActions: {
      // Aceita requisições de qualquer origem (Cloud Run gera URLs dinâmicas)
      allowedOrigins: ['localhost:3000'],
      // Em produção, o Cloud Run configura automaticamente
    },
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
