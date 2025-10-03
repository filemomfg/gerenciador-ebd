'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  History, 
  Search, 
  Filter, 
  Calendar,
  User,
  Activity,
  Clock,
  FileText,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HistoricoAcao {
  id: string
  usuario_id: string
  usuario_nome: string
  usuario_role: string
  acao: string
  tipo: 'create' | 'update' | 'delete' | 'chamada' | 'login' | 'export'
  entidade: string
  entidade_id?: string
  detalhes: string
  ip_address?: string
  user_agent?: string
  timestamp: string
}

// Simulação de dados de histórico
const historicoMock: HistoricoAcao[] = [
  {
    id: '1',
    usuario_id: '2',
    usuario_nome: 'Pastor João',
    usuario_role: 'admin_igreja',
    acao: 'Cadastrou novo aluno',
    tipo: 'create',
    entidade: 'aluno',
    entidade_id: '10',
    detalhes: 'Aluno: Maria Silva - Sala: Juvenis',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min atrás
  },
  {
    id: '2',
    usuario_id: '3',
    usuario_nome: 'Professora Maria',
    usuario_role: 'professor',
    acao: 'Registrou chamada',
    tipo: 'chamada',
    entidade: 'chamada',
    entidade_id: '5',
    detalhes: 'Sala: Juvenis - 8 presentes, 2 visitantes',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2h atrás
  },
  {
    id: '3',
    usuario_id: '2',
    usuario_nome: 'Pastor João',
    usuario_role: 'admin_igreja',
    acao: 'Editou informações do professor',
    tipo: 'update',
    entidade: 'professor',
    entidade_id: '1',
    detalhes: 'Professor: João Santos - Atualizou telefone',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4h atrás
  },
  {
    id: '4',
    usuario_id: '1',
    usuario_nome: 'Admin Principal',
    usuario_role: 'admin',
    acao: 'Exportou relatório',
    tipo: 'export',
    entidade: 'relatorio',
    detalhes: 'Relatório mensal de frequência - Todas as igrejas',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6h atrás
  },
  {
    id: '5',
    usuario_id: '2',
    usuario_nome: 'Pastor João',
    usuario_role: 'admin_igreja',
    acao: 'Criou nova sala',
    tipo: 'create',
    entidade: 'sala',
    entidade_id: '3',
    detalhes: 'Sala: Adultos Jovens - Faixa etária: 18-35 anos',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 dia atrás
  }
]

export function HistoricoView() {
  const { user } = useAuth()
  const [historico, setHistorico] = useState<HistoricoAcao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
  const [selectedPeriodo, setSelectedPeriodo] = useState('7') // dias

  useEffect(() => {
    loadHistorico()
  }, [user, selectedPeriodo])

  const loadHistorico = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar baseado no perfil do usuário
      let historicoFiltrado = historicoMock
      
      if (user?.role === 'admin_igreja') {
        // Admin igreja vê apenas ações da sua igreja
        historicoFiltrado = historicoMock.filter(h => 
          h.usuario_role === 'admin_igreja' || h.usuario_role === 'professor'
        )
      } else if (user?.role === 'professor') {
        // Professor vê apenas suas próprias ações
        historicoFiltrado = historicoMock.filter(h => h.usuario_id === user.id)
      }
      
      // Filtrar por período
      const diasAtras = parseInt(selectedPeriodo)
      const dataLimite = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000)
      historicoFiltrado = historicoFiltrado.filter(h => 
        new Date(h.timestamp) >= dataLimite
      )
      
      setHistorico(historicoFiltrado)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistorico = historico.filter(item => {
    const matchesSearch = 
      item.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detalhes.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTipo = !selectedTipo || item.tipo === selectedTipo
    
    return matchesSearch && matchesTipo
  })

  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case 'create':
        return <UserPlus className="h-4 w-4 text-green-600" />
      case 'update':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />
      case 'chamada':
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      case 'export':
        return <FileText className="h-4 w-4 text-orange-600" />
      case 'login':
        return <User className="h-4 w-4 text-gray-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getBadgeForRole = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Admin Principal</Badge>
      case 'admin_igreja':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Admin Igreja</Badge>
      case 'professor':
        return <Badge variant="default" className="bg-green-100 text-green-800">Professor</Badge>
      default:
        return <Badge variant="secondary">Usuário</Badge>
    }
  }

  const formatarTempo = (timestamp: string) => {
    const agora = new Date()
    const data = new Date(timestamp)
    const diffMs = agora.getTime() - data.getTime()
    const diffMinutos = Math.floor(diffMs / (1000 * 60))
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutos < 60) {
      return `${diffMinutos} min atrás`
    } else if (diffHoras < 24) {
      return `${diffHoras}h atrás`
    } else if (diffDias < 7) {
      return `${diffDias} dia${diffDias > 1 ? 's' : ''} atrás`
    } else {
      return data.toLocaleDateString('pt-BR')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 p-2 rounded-lg">
            <History className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Histórico de Ações</h1>
            <p className="text-gray-600">
              Acompanhe todas as atividades realizadas no sistema
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por ação, usuário ou detalhes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                <option value="create">Criações</option>
                <option value="update">Edições</option>
                <option value="delete">Exclusões</option>
                <option value="chamada">Chamadas</option>
                <option value="export">Exportações</option>
                <option value="login">Logins</option>
              </select>
            </div>
            
            <div className="w-full md:w-32">
              <select
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="1">Hoje</option>
                <option value="7">7 dias</option>
                <option value="30">30 dias</option>
                <option value="90">90 dias</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{filteredHistorico.length}</p>
                <p className="text-sm text-gray-600">Total de Ações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredHistorico.filter(h => h.tipo === 'create').length}
                </p>
                <p className="text-sm text-gray-600">Criações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredHistorico.filter(h => h.tipo === 'chamada').length}
                </p>
                <p className="text-sm text-gray-600">Chamadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredHistorico.filter(h => h.tipo === 'update').length}
                </p>
                <p className="text-sm text-gray-600">Edições</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>
            Últimas {filteredHistorico.length} ações realizadas no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredHistorico.map(item => (
              <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getIconForTipo(item.tipo)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{item.acao}</h4>
                    <div className="flex items-center space-x-2">
                      {getBadgeForRole(item.usuario_role)}
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatarTempo(item.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{item.detalhes}</p>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="h-3 w-3 mr-1" />
                    <span>{item.usuario_nome}</span>
                    {item.entidade_id && (
                      <>
                        <span className="mx-2">•</span>
                        <span>ID: {item.entidade_id}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredHistorico.length === 0 && (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ação encontrada</h3>
              <p className="text-gray-600">
                {searchTerm || selectedTipo 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Nenhuma atividade registrada no período selecionado'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}