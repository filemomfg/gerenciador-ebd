'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Church, Shield, Users, BookOpen, HelpCircle, X, Zap, Target, Award } from 'lucide-react'

export function LoginForm() {
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = await login(loginData.email, loginData.password)
    if (!success) {
      setError('Email ou senha incorretos')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Padrão de fundo animado */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          animation: 'float 20s ease-in-out infinite'
        }}></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo e Título */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-2xl">
              <Church className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">EBD Digital Pro</h1>
          <p className="text-purple-200 text-lg">
            Transforme sua Escola Bíblica Dominical
          </p>
        </div>

        {/* Formulário de Login */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-gray-900">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-gray-600">
              Entre com suas credenciais para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  className="h-12 border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-gray-700 font-medium">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  className="h-12 border-gray-300 focus:border-blue-500"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Entrar no Sistema
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="text-white">
            <div className="bg-white/10 rounded-lg p-3 mb-2">
              <Zap className="h-6 w-6 mx-auto text-blue-300" />
            </div>
            <p className="text-xs text-purple-200">Rápido</p>
          </div>
          <div className="text-white">
            <div className="bg-white/10 rounded-lg p-3 mb-2">
              <Target className="h-6 w-6 mx-auto text-green-300" />
            </div>
            <p className="text-xs text-purple-200">Eficiente</p>
          </div>
          <div className="text-white">
            <div className="bg-white/10 rounded-lg p-3 mb-2">
              <Award className="h-6 w-6 mx-auto text-yellow-300" />
            </div>
            <p className="text-xs text-purple-200">Profissional</p>
          </div>
        </div>

        {/* Botão Tutorial */}
        <div className="text-center">
          <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <HelpCircle className="mr-2 h-4 w-4" />
                Como usar o sistema
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Tutorial - EBD Digital Pro
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTutorial(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <DialogDescription className="text-gray-600">
                  Guia completo para usar todas as funcionalidades do sistema
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Admin Principal */}
                <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Admin Principal
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Funcionalidades:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Gerenciar todas as igrejas do sistema</li>
                      <li>Cadastrar administradores de igreja</li>
                      <li>Visualizar relatórios globais</li>
                      <li>Configurar sistema geral</li>
                      <li>Enviar avisos para igrejas</li>
                    </ul>
                  </div>
                </div>

                {/* Admin Igreja */}
                <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Admin de Igreja
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Como obter acesso:</strong> Criado pelo Admin Principal</p>
                    <p><strong>Funcionalidades:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Gerenciar salas da sua igreja</li>
                      <li>Cadastrar e gerenciar professores</li>
                      <li>Cadastrar e gerenciar alunos</li>
                      <li>Visualizar relatórios da igreja</li>
                      <li>Configurar logo da igreja</li>
                      <li>Controlar chamadas e frequência</li>
                    </ul>
                  </div>
                </div>

                {/* Professor */}
                <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-yellow-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Professor
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Como obter acesso:</strong> Criado pelo Admin da Igreja</p>
                    <p><strong>Funcionalidades:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Fazer chamada dos alunos da sua sala</li>
                      <li>Registrar visitantes</li>
                      <li>Adicionar observações sobre a aula</li>
                      <li>Visualizar relatórios da sua sala</li>
                      <li>Gerenciar dados dos seus alunos</li>
                    </ul>
                  </div>
                </div>

                {/* Fluxo de Uso */}
                <div className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-slate-50">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    🚀 Fluxo Recomendado de Uso
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li><strong>Admin Principal:</strong> Cadastra a igreja e cria admin da igreja</li>
                    <li><strong>Admin Igreja:</strong> Configura logo, cria salas e cadastra professores</li>
                    <li><strong>Admin Igreja:</strong> Cadastra alunos e vincula às salas</li>
                    <li><strong>Professor:</strong> Faz login e registra chamadas semanalmente</li>
                    <li><strong>Todos:</strong> Acompanham relatórios e estatísticas</li>
                  </ol>
                </div>

                {/* Dicas Importantes */}
                <div className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <h3 className="text-lg font-semibold text-orange-800 mb-3">
                    💡 Dicas Importantes
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Cada professor tem acesso apenas à sua sala</li>
                    <li>Admins de igreja veem apenas dados da sua igreja</li>
                    <li>Chamadas podem ser configuradas para dias específicos</li>
                    <li>Relatórios são atualizados automaticamente</li>
                    <li>Sistema funciona offline - dados salvos localmente</li>
                    <li>Use botões "Remover" para excluir registros</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Nome do criador */}
        <div className="text-center">
          <p className="text-xs text-purple-300/70">
            Desenvolvido por Filemom Figueiredo
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
      `}</style>
    </div>
  )
}