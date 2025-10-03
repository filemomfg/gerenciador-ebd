// Configurações de domínio e deploy para o EBD Digital Pro
export const deployConfig = {
  // Configurações de domínio
  domain: {
    production: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000',
    development: 'localhost:3000'
  },
  
  // Configurações de API
  api: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_DOMAIN}`
      : 'http://localhost:3000'
  },
  
  // Configurações de cache
  cache: {
    maxAge: 3600, // 1 hora
    staleWhileRevalidate: 86400 // 24 horas
  },
  
  // Configurações de segurança
  security: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'origin-when-cross-origin',
      'X-XSS-Protection': '1; mode=block'
    }
  }
}

// Função para obter URL base
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  if (process.env.NEXT_PUBLIC_DOMAIN) {
    return `https://${process.env.NEXT_PUBLIC_DOMAIN}`
  }
  
  return 'http://localhost:3000'
}

// Função para verificar se está em produção
export const isProduction = () => {
  return process.env.NODE_ENV === 'production'
}