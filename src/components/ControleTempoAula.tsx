'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Bell, 
  AlertTriangle,
  Timer,
  Settings,
  Volume2,
  VolumeX,
  Zap,
  Users,
  BellRing,
  CheckCircle
} from 'lucide-react'
import { Sala, Professor } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AulaAtiva {
  id: string
  sala_id: string
  professor_id: string
  duracao_minutos: number
  inicio: string
  status: 'ativa' | 'pausada' | 'finalizada'
  notificacao_10min_enviada: boolean
}

export function ControleTempoAula() {
  const { user } = useAuth()
  const [salas, setSalas] = useState<Sala[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  const [aulasAtivas, setAulasAtivas] = useState<AulaAtiva[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para nova aula
  const [salaId, setSalaId] = useState('')
  const [professorId, setProfessorId] = useState('')
  const [duracaoHoras, setDuracaoHoras] = useState(1)
  const [duracaoMinutos, setDuracaoMinutos] = useState(20)
  
  // Estados para controle de som e alarme global
  const [somAtivo, setSomAtivo] = useState(true)
  const [alarmeGlobalAtivo, setAlarmeGlobalAtivo] = useState(false)
  const [tempoAlarmeGlobal, setTempoAlarmeGlobal] = useState(60) // minutos
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Timer para atualização
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadData()
    
    // Configurar áudio de alarme
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/Eeyw')
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Atualizar timer a cada segundo
    if (aulasAtivas.length > 0) {
      intervalRef.current = setInterval(() => {
        setAulasAtivas(prev => prev.map(aula => {
          if (aula.status === 'ativa') {
            const agora = new Date()
            const inicio = new Date(aula.inicio)
            const tempoDecorrido = Math.floor((agora.getTime() - inicio.getTime()) / 1000 / 60)
            const tempoRestante = aula.duracao_minutos - tempoDecorrido
            
            // Verificar se deve enviar notificação de 10 minutos
            if (tempoRestante <= 10 && tempoRestante > 0 && !aula.notificacao_10min_enviada) {
              enviarNotificacao10Min(aula)
              return { ...aula, notificacao_10min_enviada: true }
            }
            
            // Verificar se o tempo acabou
            if (tempoRestante <= 0) {
              finalizarAulaAutomaticamente(aula)
              return { ...aula, status: 'finalizada' as const }
            }
          }
          return aula
        }))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [aulasAtivas])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do localStorage
      const salasStorage = localStorage.getItem('salas')
      const professoresStorage = localStorage.getItem('professores')
      const aulasStorage = localStorage.getItem('aulas_ativas')
      
      if (salasStorage) {
        const salasData = JSON.parse(salasStorage)
        const salasIgreja = user?.igreja_id 
          ? salasData.filter((s: Sala) => s.igreja_id === user.igreja_id)
          : salasData
        setSalas(salasIgreja)
      }
      
      if (professoresStorage) {
        const professoresData = JSON.parse(professoresStorage)
        const professoresIgreja = user?.igreja_id 
          ? professoresData.filter((p: Professor) => p.igreja_id === user.igreja_id)
          : professoresData
        setProfessores(professoresIgreja)
      }
      
      if (aulasStorage) {
        setAulasAtivas(JSON.parse(aulasStorage))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const iniciarAula = () => {
    if (!salaId || !professorId) {
      alert('Por favor, selecione uma sala e um professor')
      return
    }

    const novaAula: AulaAtiva = {
      id: Date.now().toString(),
      sala_id: salaId,
      professor_id: professorId,
      duracao_minutos: (duracaoHoras * 60) + duracaoMinutos,
      inicio: new Date().toISOString(),
      status: 'ativa',
      notificacao_10min_enviada: false
    }

    const novasAulas = [...aulasAtivas, novaAula]
    setAulasAtivas(novasAulas)
    localStorage.setItem('aulas_ativas', JSON.stringify(novasAulas))

    // Resetar formulário
    setSalaId('')
    setProfessorId('')
    setDuracaoHoras(1)
    setDuracaoMinutos(20)
  }

  const iniciarTodasAulas = () => {
    if (salas.length === 0) {
      alert('Nenhuma sala disponível para iniciar')
      return
    }

    const salasDisponiveis = salas.filter(sala => 
      !aulasAtivas.some(aula => aula.sala_id === sala.id && aula.status === 'ativa')
    )

    if (salasDisponiveis.length === 0) {
      alert('Todas as salas já possuem aulas ativas')
      return
    }

    const novasAulas = salasDisponiveis.map(sala => {
      const professor = professores.find(p => p.sala_id === sala.id)
      return {
        id: `${Date.now()}-${sala.id}`,
        sala_id: sala.id,
        professor_id: professor?.id || professores[0]?.id || '',
        duracao_minutos: (duracaoHoras * 60) + duracaoMinutos,
        inicio: new Date().toISOString(),
        status: 'ativa' as const,
        notificacao_10min_enviada: false
      }
    })

    const todasAulas = [...aulasAtivas, ...novasAulas]
    setAulasAtivas(todasAulas)
    localStorage.setItem('aulas_ativas', JSON.stringify(todasAulas))
    
    alert(`${novasAulas.length} aulas iniciadas simultaneamente!`)
  }

  const aplicarAlarmeTodasSalas = () => {
    if (aulasAtivas.length === 0) {
      alert('Nenhuma aula ativa para aplicar alarme')
      return
    }

    // Tocar alarme sonoro
    if (somAtivo && audioRef.current) {
      audioRef.current.play().catch(console.error)
    }

    // Notificação para todas as salas
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 Alarme Geral - EBD Digital', {
        body: `Alarme aplicado simultaneamente em todas as ${aulasAtivas.length} salas ativas`,
        icon: '/icon.svg'
      })
    }

    // Alerta visual
    alert(`🔔 ALARME GERAL ATIVADO!\n\nAlarme aplicado simultaneamente em todas as ${aulasAtivas.length} salas ativas.\n\nTempo configurado: ${tempoAlarmeGlobal} minutos`)
  }

  const pausarAula = (aulaId: string) => {
    const aulasAtualizadas = aulasAtivas.map(aula =>
      aula.id === aulaId ? { ...aula, status: 'pausada' as const } : aula
    )
    setAulasAtivas(aulasAtualizadas)
    localStorage.setItem('aulas_ativas', JSON.stringify(aulasAtualizadas))
  }

  const retomarAula = (aulaId: string) => {
    const aulasAtualizadas = aulasAtivas.map(aula =>
      aula.id === aulaId ? { ...aula, status: 'ativa' as const } : aula
    )
    setAulasAtivas(aulasAtualizadas)
    localStorage.setItem('aulas_ativas', JSON.stringify(aulasAtualizadas))
  }

  const finalizarAula = (aulaId: string) => {
    const aulasAtualizadas = aulasAtivas.filter(aula => aula.id !== aulaId)
    setAulasAtivas(aulasAtualizadas)
    localStorage.setItem('aulas_ativas', JSON.stringify(aulasAtualizadas))
  }

  const finalizarTodasAulas = () => {
    if (aulasAtivas.length === 0) {
      alert('Nenhuma aula ativa para finalizar')
      return
    }

    if (confirm(`Tem certeza que deseja finalizar todas as ${aulasAtivas.length} aulas ativas?`)) {
      setAulasAtivas([])
      localStorage.setItem('aulas_ativas', JSON.stringify([]))
      alert('Todas as aulas foram finalizadas!')
    }
  }

  const enviarNotificacao10Min = (aula: AulaAtiva) => {
    const sala = salas.find(s => s.id === aula.sala_id)
    const professor = professores.find(p => p.id === aula.professor_id)
    
    // Simular notificação (em produção seria via WebSocket/Push)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Aviso de Tempo - EBD Digital', {
        body: `Faltam 10 minutos para o término da aula na ${sala?.nome}. Professor: ${professor?.nome}`,
        icon: '/icon.svg'
      })
    }
    
    // Mostrar alerta visual
    alert(`⏰ AVISO: Faltam 10 minutos para o término da aula na ${sala?.nome}!`)
  }

  const finalizarAulaAutomaticamente = (aula: AulaAtiva) => {
    const sala = salas.find(s => s.id === aula.sala_id)
    const professor = professores.find(p => p.id === aula.professor_id)
    
    // Tocar alarme sonoro
    if (somAtivo && audioRef.current) {
      audioRef.current.play().catch(console.error)
    }
    
    // Notificação
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 Tempo Esgotado - EBD Digital', {
        body: `A aula na ${sala?.nome} foi finalizada. Professor: ${professor?.nome}`,
        icon: '/icon.svg'
      })
    }
    
    // Alerta visual
    alert(`🔔 TEMPO ESGOTADO!\n\nA aula na ${sala?.nome} foi finalizada.\nProfessor: ${professor?.nome}`)
  }

  const calcularTempoRestante = (aula: AulaAtiva) => {
    if (aula.status !== 'ativa') return { minutos: 0, segundos: 0, percentual: 0 }
    
    const agora = new Date()
    const inicio = new Date(aula.inicio)
    const tempoDecorrido = Math.floor((agora.getTime() - inicio.getTime()) / 1000)
    const tempoTotal = aula.duracao_minutos * 60
    const tempoRestante = Math.max(0, tempoTotal - tempoDecorrido)
    
    const minutos = Math.floor(tempoRestante / 60)
    const segundos = tempoRestante % 60
    const percentual = ((tempoTotal - tempoRestante) / tempoTotal) * 100
    
    return { minutos, segundos, percentual }
  }

  const formatarTempo = (minutos: number, segundos: number) => {
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
  }

  const solicitarPermissaoNotificacao = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <Timer className="mr-3 h-7 w-7" />
              Controle de Tempo de Aula
            </h1>
            <p className="text-red-100">
              Gerencie a duração das aulas e receba notificações automáticas
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSomAtivo(!somAtivo)}
              className="text-white hover:bg-white/20"
            >
              {somAtivo ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={solicitarPermissaoNotificacao}
              className="text-white hover:bg-white/20"
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Controles Globais - AdminIgreja */}
      {(user?.role === 'admin' || user?.role === 'admin_igreja') && (
        <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <Zap className="mr-2 h-5 w-5" />
              Controles Globais - AdminIgreja
            </CardTitle>
            <CardDescription>
              Aplique ações simultaneamente em todas as salas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alarme Global */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-2">
                    <BellRing className="h-4 w-4 text-orange-600" />
                    <span>Alarme Simultâneo</span>
                  </Label>
                  <Switch
                    checked={alarmeGlobalAtivo}
                    onCheckedChange={setAlarmeGlobalAtivo}
                  />
                </div>
                
                {alarmeGlobalAtivo && (
                  <div className="space-y-2">
                    <Label htmlFor="tempo-alarme">Tempo do Alarme (minutos)</Label>
                    <Input
                      id="tempo-alarme"
                      type="number"
                      min="1"
                      max="120"
                      value={tempoAlarmeGlobal}
                      onChange={(e) => setTempoAlarmeGlobal(parseInt(e.target.value) || 60)}
                      className="w-full"
                    />
                    <Button
                      onClick={aplicarAlarmeTodasSalas}
                      disabled={aulasAtivas.length === 0}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    >
                      <BellRing className="mr-2 h-4 w-4" />
                      Aplicar Alarme em Todas as Salas ({aulasAtivas.length})
                    </Button>
                  </div>
                )}
              </div>

              {/* Controles de Massa */}
              <div className="space-y-3">
                <Label className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Controles em Massa</span>
                </Label>
                
                <div className="space-y-2">
                  <Button
                    onClick={iniciarTodasAulas}
                    disabled={salas.length === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar Todas as Salas ({salas.length})
                  </Button>
                  
                  <Button
                    onClick={finalizarTodasAulas}
                    disabled={aulasAtivas.length === 0}
                    variant="destructive"
                    className="w-full"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Finalizar Todas as Aulas ({aulasAtivas.length})
                  </Button>
                </div>
              </div>
            </div>

            {/* Status Global */}
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{salas.length}</div>
                  <div className="text-sm text-gray-600">Total de Salas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{aulasAtivas.filter(a => a.status === 'ativa').length}</div>
                  <div className="text-sm text-gray-600">Aulas Ativas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{aulasAtivas.filter(a => a.status === 'pausada').length}</div>
                  <div className="text-sm text-gray-600">Aulas Pausadas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{professores.length}</div>
                  <div className="text-sm text-gray-600">Professores</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Formulário para Nova Aula */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <Play className="mr-2 h-5 w-5" />
            Iniciar Nova Aula Individual
          </CardTitle>
          <CardDescription>
            Configure a duração e inicie o controle de tempo para uma aula específica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sala">Sala</Label>
              <select
                id="sala"
                value={salaId}
                onChange={(e) => setSalaId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione uma sala</option>
                {salas.map(sala => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nome} {sala.faixa_etaria && `(${sala.faixa_etaria})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="professor">Professor</Label>
              <select
                id="professor"
                value={professorId}
                onChange={(e) => setProfessorId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um professor</option>
                {professores.map(professor => (
                  <option key={professor.id} value={professor.id}>
                    {professor.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duração da Aula</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="horas" className="text-sm">Horas:</Label>
                <Input
                  id="horas"
                  type="number"
                  min="0"
                  max="5"
                  value={duracaoHoras}
                  onChange={(e) => setDuracaoHoras(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="minutos" className="text-sm">Minutos:</Label>
                <Input
                  id="minutos"
                  type="number"
                  min="0"
                  max="59"
                  value={duracaoMinutos}
                  onChange={(e) => setDuracaoMinutos(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              <div className="text-sm text-gray-600">
                Total: {duracaoHoras}h {duracaoMinutos}min
              </div>
            </div>
          </div>

          <Button
            onClick={iniciarAula}
            disabled={!salaId || !professorId || (duracaoHoras === 0 && duracaoMinutos === 0)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Iniciar Aula Individual
          </Button>
        </CardContent>
      </Card>

      {/* Aulas Ativas */}
      {aulasAtivas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-600" />
            Aulas em Andamento ({aulasAtivas.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aulasAtivas.map(aula => {
              const sala = salas.find(s => s.id === aula.sala_id)
              const professor = professores.find(p => p.id === aula.professor_id)
              const { minutos, segundos, percentual } = calcularTempoRestante(aula)
              const tempoRestanteTotal = minutos + (segundos > 0 ? 1 : 0)
              
              return (
                <Card key={aula.id} className={cn(
                  "border-2 transition-all duration-300",
                  aula.status === 'ativa' 
                    ? tempoRestanteTotal <= 10 
                      ? 'border-red-300 bg-red-50 shadow-red-100 shadow-lg' 
                      : 'border-green-300 bg-green-50 shadow-green-100 shadow-lg'
                    : 'border-yellow-300 bg-yellow-50 shadow-yellow-100 shadow-lg'
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{sala?.nome || 'Sala não encontrada'}</CardTitle>
                        <CardDescription>
                          Professor: {professor?.nome || 'Professor não encontrado'}
                        </CardDescription>
                      </div>
                      <Badge variant={
                        aula.status === 'ativa' 
                          ? tempoRestanteTotal <= 10 ? 'destructive' : 'default'
                          : 'secondary'
                      }>
                        {aula.status === 'ativa' ? 'Em andamento' : 'Pausada'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Timer Visual */}
                    <div className="text-center">
                      <div className={cn(
                        "text-4xl font-mono font-bold",
                        tempoRestanteTotal <= 10 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {formatarTempo(minutos, segundos)}
                      </div>
                      <p className="text-sm text-gray-600">Tempo restante</p>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progresso</span>
                        <span>{percentual.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={cn(
                            "h-3 rounded-full transition-all duration-1000",
                            tempoRestanteTotal <= 10 
                              ? 'bg-gradient-to-r from-red-400 to-red-600' 
                              : 'bg-gradient-to-r from-green-400 to-green-600'
                          )}
                          style={{ width: `${Math.min(percentual, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Alertas */}
                    {tempoRestanteTotal <= 10 && tempoRestanteTotal > 0 && aula.status === 'ativa' && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          ⚠️ Atenção! Faltam apenas {tempoRestanteTotal} minuto{tempoRestanteTotal !== 1 ? 's' : ''} para o término da aula.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Controles */}
                    <div className="flex space-x-2">
                      {aula.status === 'ativa' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pausarAula(aula.id)}
                          className="flex-1"
                        >
                          <Pause className="mr-1 h-4 w-4" />
                          Pausar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retomarAula(aula.id)}
                          className="flex-1"
                        >
                          <Play className="mr-1 h-4 w-4" />
                          Retomar
                        </Button>
                      )}
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => finalizarAula(aula.id)}
                        className="flex-1"
                      >
                        <Square className="mr-1 h-4 w-4" />
                        Finalizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Instruções */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <Settings className="mr-2 h-5 w-5" />
            Como Funciona o Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Controles Globais:</strong> AdminIgreja pode aplicar alarmes simultaneamente em todas as salas ativas</p>
          <p>• <strong>Iniciar em Massa:</strong> Inicie todas as salas de uma vez com a mesma duração</p>
          <p>• <strong>Notificação 10 minutos:</strong> O sistema enviará uma notificação automática quando faltarem 10 minutos para o término</p>
          <p>• <strong>Alarme final:</strong> Quando o tempo esgotar, será emitido um alarme sonoro e visual</p>
          <p>• <strong>Controles individuais:</strong> Você pode pausar, retomar ou finalizar uma aula a qualquer momento</p>
          <p>• <strong>Permissões:</strong> Clique no ícone de sino para permitir notificações do navegador</p>
        </CardContent>
      </Card>
    </div>
  )
}