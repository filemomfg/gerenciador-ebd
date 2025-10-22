/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações essenciais para deploy no Vercel
  output: 'standalone',
  
  // Configurações de imagem seguras e otimizadas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configurações básicas otimizadas
  compress: true,
  poweredByHeader: false,
  trailingSlash: false,
}

export default nextConfig