'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Aluno, Sala, Professor, Igreja, Chamada, PresencaAluno } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Calendar,
  School,
  UserCheck,
  Target,
  Award,
  Download,
  Filter,
  Church,
  GraduationCap,
  Activity,
  PieChart,
  BookOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RelatorioData {
  totalAlunos: number
  totalSalas: number
  totalProfessores: number
  totalIgrejas: number
  totalChamadas: number
  presencaMedia: number
  visitantesTotal: number
  salasMaisFrequentadas: Array<{
    sala: Sala
    totalPresencas: number
    percentualPresenca: number
  }>
  evolucaoSemanal: Array<{
    data: string
    presentes: number
    visitantes: number
  }>
  relatorioDiario: Array<{
    sala: string
    presentes: number
    visitantes: number
    total: number
  }>
}

export function RelatoriosView() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [salas, setSalas] = useState<Sala[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  const [igrejas, setIgrejas] = useState<Igreja[]>([])
  const [chamadas, setChamadas] = useState<Chamada[]>([])

  useEffect(() => {
    loadRelatorioData()
  }, [user, selectedDate])

  const loadRelatorioData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do localStorage
      const alunosStorage = localStorage.getItem('alunos')
      const salasStorage = localStorage.getItem('salas')
      const professoresStorage = localStorage.getItem('professores')
      const igrejasStorage = localStorage.getItem('igrejas')
      const chamadasStorage = localStorage.getItem('chamadas')

      let alunosData: Aluno[] = []
      let salasData: Sala[] = []
      let professoresData: Professor[] = []
      let igrejasData: Igreja[] = []
      let chamadasData: Chamada[] = []

      // Filtrar dados baseado no perfil do usuário
      if (alunosStorage) {
        const allAlunos = JSON.parse(alunosStorage)
        alunosData = user?.igreja_id 
          ? allAlunos.filter((a: Aluno) => a.igreja_id === user.igreja_id && a.ativo !== false)
          : allAlunos.filter((a: Aluno) => a.ativo !== false)
      }

      if (salasStorage) {
        const allSalas = JSON.parse(salasStorage)
        salasData = user?.igreja_id 
          ? allSalas.filter((s: Sala) => s.igreja_id === user.igreja_id)
          : allSalas
      }

      if (professoresStorage) {
        const allProfessores = JSON.parse(professoresStorage)
        professoresData = user?.igreja_id 
          ? allProfessores.filter((p: Professor) => p.igreja_id === user.igreja_id)
          : allProfessores
      }

      if (igrejasStorage) {
        const allIgrejas = JSON.parse(igrejasStorage)
        igrejasData = user?.role === 'admin' ? allIgrejas : 
          user?.igreja_id ? allIgrejas.filter((i: Igreja) => i.id === user.igreja_id) : []
      }

      if (chamadasStorage) {
        const allChamadas = JSON.parse(chamadasStorage)
        // Filtrar chamadas por data selecionada
        const selectedDateStr = selectedDate
        chamadasData = allChamadas.filter((c: Chamada) => {
          const chamadaDate = new Date(c.data).toISOString().split('T')[0]
          const matchesDate = chamadaDate === selectedDateStr
          const matchesIgreja = user?.igreja_id ? c.igreja_id === user.igreja_id : true
          return matchesDate && matchesIgreja
        })
      }

      setAlunos(alunosData)
      setSalas(salasData)
      setProfessores(professoresData)
      setIgrejas(igrejasData)
      setChamadas(chamadasData)

      // Calcular estatísticas
      const totalAlunos = alunosData.length
      const totalSalas = salasData.length
      const totalProfessores = professoresData.length
      const totalIgrejas = igrejasData.length
      const totalChamadas = chamadasData.length

      // Calcular presença média do dia selecionado
      const presencaMedia = totalChamadas > 0 ? 
        chamadasData.reduce((acc, chamada) => acc + chamada.total_presentes, 0) / totalChamadas : 0

      // Calcular total de visitantes do dia selecionado
      const visitantesTotal = chamadasData.reduce((acc, chamada) => acc + chamada.total_visitantes, 0)

      // Relatório diário por sala
      const relatorioDiario = salasData.map(sala => {
        const chamadasSala = chamadasData.filter(c => c.sala_id === sala.id)
        const presentes = chamadasSala.reduce((acc, c) => acc + c.total_presentes, 0)
        const visitantes = chamadasSala.reduce((acc, c) => acc + c.total_visitantes, 0)
        
        return {
          sala: sala.nome,
          presentes,
          visitantes,
          total: presentes + visitantes
        }
      }).filter(item => item.total > 0) // Apenas salas com presença no dia

      // Salas mais frequentadas (baseado em dados históricos)
      const salasMaisFrequentadas = salasData.map(sala => {
        const alunosSala = alunosData.filter(a => a.sala_id === sala.id).length
        const chamadasSala = chamadasData.filter(c => c.sala_id === sala.id)
        const totalPresencas = chamadasSala.reduce((acc, c) => acc + c.total_presentes, 0)
        const percentualPresenca = alunosSala > 0 && chamadasSala.length > 0 ? 
          (totalPresencas / (chamadasSala.length * alunosSala)) * 100 : 0
        
        return {
          sala,
          totalPresencas,
          percentualPresenca: Math.min(percentualPresenca, 100)
        }
      }).sort((a, b) => b.totalPresencas - a.totalPresencas)

      // Evolução semanal (últimas 4 semanas)
      const evolucaoSemanal = Array.from({ length: 4 }, (_, i) => {
        const data = new Date()
        data.setDate(data.getDate() - (i * 7))
        const dataStr = data.toISOString().split('T')[0]
        
        // Buscar chamadas dessa semana
        const chamadasSemana = JSON.parse(chamadasStorage || '[]').filter((c: Chamada) => {
          const chamadaDate = new Date(c.data).toISOString().split('T')[0]
          return chamadaDate === dataStr && (user?.igreja_id ? c.igreja_id === user.igreja_id : true)
        })
        
        return {
          data: data.toLocaleDateString('pt-BR'),
          presentes: chamadasSemana.reduce((acc: number, c: Chamada) => acc + c.total_presentes, 0),
          visitantes: chamadasSemana.reduce((acc: number, c: Chamada) => acc + c.total_visitantes, 0)
        }
      }).reverse()

      setRelatorioData({
        totalAlunos,
        totalSalas,
        totalProfessores,
        totalIgrejas,
        totalChamadas,
        presencaMedia,
        visitantesTotal,
        salasMaisFrequentadas,
        evolucaoSemanal,
        relatorioDiario
      })

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportarRelatorio = () => {
    if (!relatorioData) return

    const dados = {
      dataRelatorio: selectedDate,
      dataGeracao: new Date().toLocaleString('pt-BR'),
      estatisticas: {
        totalAlunos: relatorioData.totalAlunos,
        totalSalas: relatorioData.totalSalas,
        totalProfessores: relatorioData.totalProfessores,
        totalIgrejas: relatorioData.totalIgrejas,
        chamadasDoDia: relatorioData.totalChamadas,
        presencaMediaDia: relatorioData.presencaMedia.toFixed(1),
        visitantesDoDia: relatorioData.visitantesTotal
      },
      relatorioDiario: relatorioData.relatorioDiario,
      salasMaisFrequentadas: relatorioData.salasMaisFrequentadas.slice(0, 5).map(item => ({
        sala: item.sala.nome,
        totalPresencas: item.totalPresencas,
        percentualPresenca: item.percentualPresenca.toFixed(1) + '%'
      }))
    }

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-ebd-${selectedDate}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!relatorioData) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar relatórios</h3>
        <p className="text-gray-600">Tente recarregar a página</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-pink-100 p-2 rounded-lg">
            <BarChart3 className="h-6 w-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'Visão geral de todo o sistema'
                : user?.role === 'admin_igreja'
                ? 'Relatórios da sua igreja'
                : 'Relatórios da sua sala'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="date-filter" className="text-sm font-medium">
              Data:
            </Label>
            <Input
              id="date-filter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          
          <Button 
            onClick={exportarRelatorio}
            variant="outline"
            className="border-pink-600 text-pink-600 hover:bg-pink-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Indicador da Data Selecionada */}
      <Card className="border-l-4 border-l-pink-500 bg-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-pink-600" />
              <span className="font-medium text-pink-800">
                Relatório do dia: {new Date(selectedDate).toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            {relatorioData.totalChamadas === 0 && (
              <Badge variant="secondary" className="text-orange-600 bg-orange-100">
                Nenhuma chamada registrada neste dia
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'admin' && (
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Igrejas</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorioData.totalIgrejas}</p>
                </div>
                <Church className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Salas</p>
                <p className="text-2xl font-bold text-gray-900">{relatorioData.totalSalas}</p>
              </div>
              <School className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Professores</p>
                <p className="text-2xl font-bold text-gray-900">{relatorioData.totalProfessores}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Alunos</p>
                <p className="text-2xl font-bold text-gray-900">{relatorioData.totalAlunos}</p>
              </div>
              <Users className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas do Dia Selecionado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chamadas do Dia</p>
                <p className="text-2xl font-bold text-gray-900">{relatorioData.totalChamadas}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Presentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {relatorioData.relatorioDiario.reduce((acc, item) => acc + item.presentes, 0)}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visitantes do Dia</p>
                <p className="text-2xl font-bold text-gray-900">{relatorioData.visitantesTotal}</p>
              </div>
              <Target className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatório Diário por Sala */}
      {relatorioData.relatorioDiario.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
              Relatório Diário por Sala - {new Date(selectedDate).toLocaleDateString('pt-BR')}
            </CardTitle>
            <CardDescription>
              Frequência detalhada de cada sala no dia selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorioData.relatorioDiario.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <School className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.sala}</p>
                      <p className="text-sm text-gray-600">Sala da EBD</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Presentes</p>
                      <p className="font-bold text-green-600">{item.presentes}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Visitantes</p>
                      <p className="font-bold text-blue-600">{item.visitantes}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-bold text-purple-600">{item.total}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Total Geral */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-full">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">TOTAL GERAL</p>
                      <p className="text-sm text-blue-700">Todas as salas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-blue-700">Presentes</p>
                      <p className="font-bold text-green-600 text-lg">
                        {relatorioData.relatorioDiario.reduce((acc, item) => acc + item.presentes, 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-700">Visitantes</p>
                      <p className="font-bold text-blue-600 text-lg">
                        {relatorioData.relatorioDiario.reduce((acc, item) => acc + item.visitantes, 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-700">Total</p>
                      <p className="font-bold text-purple-600 text-lg">
                        {relatorioData.relatorioDiario.reduce((acc, item) => acc + item.total, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salas Mais Frequentadas (Histórico) */}
      {relatorioData.salasMaisFrequentadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-yellow-600" />
              Salas Mais Frequentadas (Histórico)
            </CardTitle>
            <CardDescription>
              Ranking das salas com maior frequência geral
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorioData.salasMaisFrequentadas.slice(0, 5).map((item, index) => (
                <div key={item.sala.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
                      index === 0 ? "bg-yellow-500" :
                      index === 1 ? "bg-gray-400" :
                      index === 2 ? "bg-orange-600" : "bg-blue-500"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.sala.nome}</p>
                      <p className="text-sm text-gray-600">{item.sala.faixa_etaria}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{item.totalPresencas} presenças</p>
                    <p className="text-sm text-gray-600">{item.percentualPresenca.toFixed(1)}% frequência</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolução Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
            Evolução Semanal
          </CardTitle>
          <CardDescription>
            Acompanhe a evolução da frequência nas últimas semanas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relatorioData.evolucaoSemanal.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{item.data}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Presentes</p>
                    <p className="font-bold text-green-600">{item.presentes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Visitantes</p>
                    <p className="font-bold text-blue-600">{item.visitantes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-bold text-purple-600">{item.presentes + item.visitantes}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights e Recomendações */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <Activity className="mr-2 h-5 w-5" />
            Insights do Dia Selecionado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">📊 Estatísticas do Dia:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {relatorioData.totalChamadas} chamadas realizadas</li>
                <li>• {relatorioData.relatorioDiario.reduce((acc, item) => acc + item.presentes, 0)} alunos presentes</li>
                <li>• {relatorioData.visitantesTotal} visitantes recebidos</li>
                <li>• {relatorioData.relatorioDiario.length} salas com atividade</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">💡 Observações:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {relatorioData.totalChamadas === 0 ? (
                  <li>• Nenhuma chamada foi registrada neste dia</li>
                ) : (
                  <>
                    <li>• Média de {(relatorioData.relatorioDiario.reduce((acc, item) => acc + item.total, 0) / relatorioData.relatorioDiario.length).toFixed(1)} pessoas por sala</li>
                    <li>• {relatorioData.visitantesTotal > 0 ? `Boa recepção de visitantes` : 'Nenhum visitante registrado'}</li>
                    <li>• {relatorioData.relatorioDiario.length} de {relatorioData.totalSalas} salas ativas</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}