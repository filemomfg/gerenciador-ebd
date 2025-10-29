import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração de imagens simplificada
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configuração experimental mínima
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;