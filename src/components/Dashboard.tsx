'use client'

// Atualizado - Forçar reload
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Church, 
  School, 
  GraduationCap, 
  UserCheck, 
  TrendingUp,
  Calendar,
  Bell,
  UserX,
  Eye,
  Target,
  Award,
  Activity,
  BarChart3,
  HelpCircle,
  X,
  Zap,
  Shield,
  BookOpen
} from 'lucide-react'
import { Igreja, Sala, Professor, Aluno, Chamada, Aviso } from '@/lib/types'

interface RelatorioSala {
  sala: Sala
  professor: Professor | null
  total_alunos: number
  presentes: number
  faltas: number
  visitantes: number
  total_presente_na_sala: number // presentes + visitantes
  percentual_presenca: number
}

export function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    igrejas: 0,
    salas: 0,
    professores: 0,
    alunos: 0,
    chamadas_hoje: 0,
    avisos_ativos: 0
  })
  const [relatoriosSalas, setRelatoriosSalas] = useState<RelatorioSala[]>([])
  const [totalGeral, setTotalGeral] = useState({
    presentes: 0,
    visitantes: 0,
    faltas: 0,
    total_presente_na_igreja: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados baseado no perfil do usuário
      const [igrejas, salas, professores, alunos, chamadas, avisos] = await Promise.all([
        api.getIgrejas(),
        api.getSalas(user?.igreja_id),
        api.getProfessores(user?.igreja_id),
        api.getAlunos(undefined, user?.igreja_id),
        api.getChamadas(undefined, user?.igreja_id),
        api.getAvisos(user?.igreja_id)
      ])

      // Calcular estatísticas
      const hoje = new Date().toISOString().split('T')[0]
      const chamadasHoje = chamadas.filter(c => c.data === hoje)

      setStats({
        igrejas: user?.role === 'admin' ? igrejas.length : 1,
        salas: salas.length,
        professores: professores.length,
        alunos: alunos.length,
        chamadas_hoje: chamadasHoje.length,
        avisos_ativos: avisos.length
      })

      // Gerar relatórios por sala para admin igreja
      if (user?.role === 'admin_igreja') {
        await gerarRelatoriosSalas(salas, professores, alunos, chamadas)
      }

      // Atividade recente (últimas chamadas)
      setRecentActivity(chamadas.slice(0, 5))

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const gerarRelatoriosSalas = async (
    salasData: Sala[], 
    professoresData: Professor[], 
    alunosData: Aluno[], 
    chamadasData: Chamada[]
  ) => {
    const relatorios: RelatorioSala[] = []
    let totalPresentes = 0
    let totalVisitantes = 0
    let totalFaltas = 0

    // Filtrar chamadas dos últimos 30 dias
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - 30)
    const chamadasRecentes = chamadasData.filter(c => new Date(c.data) >= dataLimite)

    for (const sala of salasData) {
      const professor = professoresData.find(p => p.id === sala.professor_id)
      const alunosSala = alunosData.filter(a => a.sala_id === sala.id)
      const chamadasSala = chamadasRecentes.filter(c => c.sala_id === sala.id)
      
      // Calcular estatísticas
      const presentes = chamadasSala.reduce((sum, c) => sum + c.total_presentes, 0)
      const visitantes = chamadasSala.reduce((sum, c) => sum + c.total_visitantes, 0)
      const totalChamadas = chamadasSala.length
      const totalPossivel = totalChamadas * alunosSala.length
      const faltas = totalPossivel - presentes
      const percentualPresenca = totalPossivel > 0 ? (presentes / totalPossivel) * 100 : 0
      const totalPresenteNaSala = presentes + visitantes

      relatorios.push({
        sala,
        professor,
        total_alunos: alunosSala.length,
        presentes,
        faltas,
        visitantes,
        total_presente_na_sala: totalPresenteNaSala,
        percentual_presenca: percentualPresenca
      })

      // Somar para o total geral
      totalPresentes += presentes
      totalVisitantes += visitantes
      totalFaltas += faltas
    }

    setRelatoriosSalas(relatorios)
    setTotalGeral({
      presentes: totalPresentes,
      visitantes: totalVisitantes,
      faltas: totalFaltas,
      total_presente_na_igreja: totalPresentes + totalVisitantes
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'admin':
        return 'Administrador Principal'
      case 'admin_igreja':
        return 'Administrador da Igreja'
      case 'professor':
        return 'Professor da EBD'
      default:
        return 'Usuário'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho de Boas-vindas */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Padrão de fundo */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {getGreeting()}, {user?.nome}! ✨
            </h1>
            <p className="text-blue-100 text-lg">
              {getRoleTitle()} - Transformando a EBD com tecnologia
            </p>
            <div className="mt-4 flex items-center space-x-4 text-sm text-blue-100">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {/* Botão Tutorial */}
            <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Tutorial
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
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Church className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'admin' && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Igrejas</CardTitle>
              <div className="bg-purple-500 p-2 rounded-lg">
                <Church className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{stats.igrejas}</div>
              <p className="text-xs text-purple-600 mt-1">
                Total de igrejas cadastradas
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Salas</CardTitle>
            <div className="bg-blue-500 p-2 rounded-lg">
              <School className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.salas}</div>
            <p className="text-xs text-blue-600 mt-1">
              Salas da EBD ativas
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Professores</CardTitle>
            <div className="bg-green-500 p-2 rounded-lg">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.professores}</div>
            <p className="text-xs text-green-600 mt-1">
              Professores cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Alunos</CardTitle>
            <div className="bg-orange-500 p-2 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{stats.alunos}</div>
            <p className="text-xs text-orange-600 mt-1">
              Alunos matriculados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios por Sala - APENAS para Admin Igreja */}
      {user?.role === 'admin_igreja' && relatoriosSalas.length > 0 && (
        <>
          {/* Resumo Geral */}
          <Card className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-800 text-xl">
                <Target className="mr-3 h-6 w-6" />
                Resumo Geral da Igreja - Últimos 30 dias
              </CardTitle>
              <CardDescription className="text-emerald-700 text-base">
                Consolidado de todas as salas da igreja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-white rounded-xl shadow-md border border-green-100">
                  <div className="text-4xl font-bold text-green-600 mb-2">{totalGeral.presentes}</div>
                  <p className="text-sm font-medium text-gray-700">Total de Presenças</p>
                  <div className="mt-2 bg-green-100 rounded-full p-2">
                    <UserCheck className="h-5 w-5 text-green-600 mx-auto" />
                  </div>
                </div>
                <div className="text-center p-6 bg-white rounded-xl shadow-md border border-blue-100">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{totalGeral.visitantes}</div>
                  <p className="text-sm font-medium text-gray-700">Total de Visitantes</p>
                  <div className="mt-2 bg-blue-100 rounded-full p-2">
                    <Eye className="h-5 w-5 text-blue-600 mx-auto" />
                  </div>
                </div>
                <div className="text-center p-6 bg-white rounded-xl shadow-md border border-red-100">
                  <div className="text-4xl font-bold text-red-600 mb-2">{totalGeral.faltas}</div>
                  <p className="text-sm font-medium text-gray-700">Total de Faltas</p>
                  <div className="mt-2 bg-red-100 rounded-full p-2">
                    <UserX className="h-5 w-5 text-red-600 mx-auto" />
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-lg border-2 border-purple-300">
                  <div className="text-4xl font-bold mb-2">{totalGeral.total_presente_na_igreja}</div>
                  <p className="text-sm font-medium">Total Presente na Igreja</p>
                  <p className="text-xs opacity-90 mt-1">(Presentes + Visitantes)</p>
                  <div className="mt-2 bg-white/20 rounded-full p-2">
                    <Award className="h-5 w-5 text-white mx-auto" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relatórios por Sala */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="mr-3 h-6 w-6 text-blue-600" />
              Relatório Detalhado por Sala
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatoriosSalas.map((relatorio) => (
                <Card key={relatorio.sala.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-gray-900">{relatorio.sala.nome}</CardTitle>
                        <CardDescription className="text-gray-600">
                          Professor: {relatorio.professor?.nome || 'Sem professor'}
                          {relatorio.sala.faixa_etaria && ` • ${relatorio.sala.faixa_etaria}`}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={relatorio.percentual_presenca >= 70 ? 'default' : 'secondary'}
                        className="text-sm px-3 py-1"
                      >
                        {relatorio.percentual_presenca.toFixed(1)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-2xl font-bold text-blue-600">{relatorio.total_alunos}</div>
                        <p className="text-xs text-gray-600 font-medium">Alunos</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="text-2xl font-bold text-green-600">{relatorio.presentes}</div>
                        <p className="text-xs text-gray-600 font-medium">Presenças</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{relatorio.faltas}</div>
                        <p className="text-xs text-gray-600 font-medium">Faltas</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="text-2xl font-bold text-purple-600">{relatorio.visitantes}</div>
                        <p className="text-xs text-gray-600 font-medium">Visitantes</p>
                      </div>
                    </div>

                    {/* Barra de Progresso da Presença */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span className="font-medium">Frequência</span>
                        <span className="font-bold">{relatorio.percentual_presenca.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            relatorio.percentual_presenca >= 70 
                              ? 'bg-gradient-to-r from-green-400 to-green-600' 
                              : relatorio.percentual_presenca >= 50 
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                              : 'bg-gradient-to-r from-red-400 to-red-600'
                          }`}
                          style={{ width: `${Math.min(relatorio.percentual_presenca, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Total presente na sala */}
                    <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                      <div className="text-center">
                        <span className="text-lg font-bold text-indigo-700">
                          {relatorio.total_presente_na_sala}
                        </span>
                        <p className="text-sm font-medium text-indigo-600">
                          Total presente na sala
                        </p>
                        <p className="text-xs text-indigo-500">
                          (Presentes + Visitantes)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Cards de Atividade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <Calendar className="mr-2 h-5 w-5" />
              Chamadas de Hoje
            </CardTitle>
            <CardDescription>
              Registro de presenças realizadas hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {stats.chamadas_hoje}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.chamadas_hoje === 0 
                ? 'Nenhuma chamada registrada hoje'
                : `${stats.chamadas_hoje} chamada${stats.chamadas_hoje > 1 ? 's' : ''} registrada${stats.chamadas_hoje > 1 ? 's' : ''}`
              }
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <Bell className="mr-2 h-5 w-5" />
              Avisos Ativos
            </CardTitle>
            <CardDescription>
              Comunicados e notificações importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {stats.avisos_ativos}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.avisos_ativos === 0 
                ? 'Nenhum aviso ativo'
                : `${stats.avisos_ativos} aviso${stats.avisos_ativos > 1 ? 's' : ''} ativo${stats.avisos_ativos > 1 ? 's' : ''}`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-700">
            <TrendingUp className="mr-2 h-5 w-5" />
            Atividade Recente
          </CardTitle>
          <CardDescription>
            Últimas chamadas registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma atividade recente encontrada
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((chamada) => (
                <div key={chamada.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-semibold text-gray-900">Chamada registrada</p>
                    <p className="text-sm text-gray-600">
                      {new Date(chamada.data).toLocaleDateString('pt-BR')} - 
                      {chamada.total_presentes} presente{chamada.total_presentes !== 1 ? 's' : ''}
                      {chamada.total_visitantes > 0 && `, ${chamada.total_visitantes} visitante${chamada.total_visitantes !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {new Date(chamada.created_at).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}