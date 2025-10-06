/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações essenciais para deploy
  output: 'standalone',
  
  // Otimizações de build
  swcMinify: true,
  
  // Configurações de imagem - mais permissivas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  // Configurações de domínio e CORS - totalmente abertas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Corrigido para SAMEORIGIN
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Permitir qualquer origem
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*', // Permitir qualquer header
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; font-src *; connect-src *; media-src *; object-src *; child-src *; frame-src *; worker-src *; frame-ancestors *; form-action *;"
          }
        ],
      },
      // Headers específicos para API
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
    ]
  },
  
  // Configurações experimentais para melhor performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    serverComponentsExternalPackages: []
  },
  
  // Configurações de webpack para resolver problemas de build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
    }
    
    return config
  },
  
  // Configurações de TypeScript - mais permissivas
  typescript: {
    ignoreBuildErrors: false, // Corrigido para false para detectar erros
  },
  
  // Configurações de ESLint - mais permissivas
  eslint: {
    ignoreDuringBuilds: false, // Corrigido para false
  },
  
  // Configurações de redirecionamento
  async redirects() {
    return []
  },
  
  // Configurações de rewrite para SPA
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  
  // Configurações de compressão
  compress: true,
  
  // Configurações de cache
  generateEtags: true, // Corrigido para true
  
  // Configurações de build
  distDir: '.next',
  
  // Configurações de domínio personalizado
  basePath: '',
  assetPrefix: '',
  
  // Configurações de performance
  poweredByHeader: false,
  
  // Configurações de build otimizadas
  productionBrowserSourceMaps: false,
  
  // Configurações de servidor
  serverRuntimeConfig: {},
  publicRuntimeConfig: {
    staticFolder: '/static',
  },
  
  // Configurações adicionais para evitar bloqueios
  trailingSlash: false,
  skipMiddlewareUrlNormalize: false, // Corrigido para false
  skipTrailingSlashRedirect: false, // Corrigido para false
}

export default nextConfig