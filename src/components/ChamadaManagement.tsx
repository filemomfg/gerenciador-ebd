'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  ClipboardList, 
  UserCheck, 
  UserX, 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Save,
  MessageSquare,
  Settings,
  AlertCircle,
  CalendarDays
} from 'lucide-react'
import { Sala, Professor, Aluno, Chamada, PresencaAluno } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ConfiguracaoChamada {
  dias_especificos: boolean
  dias_permitidos: string[] // ['domingo', 'quarta', etc]
  horario_inicio?: string
  horario_fim?: string
}

export function ChamadaManagement() {
  const { user } = useAuth()
  const [salas, setSalas] = useState<Sala[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [chamadas, setChamadas] = useState<Chamada[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Configurações de chamada
  const [configuracao, setConfiguracao] = useState<ConfiguracaoChamada>({
    dias_especificos: false,
    dias_permitidos: ['domingo']
  })
  const [showConfig, setShowConfig] = useState(false)
  
  // Estado da chamada atual
  const [chamadaAtual, setChamadaAtual] = useState({
    data: new Date().toISOString().split('T')[0],
    sala_id: '',
    total_visitantes: 0,
    observacoes: ''
  })
  
  // Estado das presenças e justificativas
  const [presencasAlunos, setPresencasAlunos] = useState<{[key: string]: boolean}>({})
  const [justificativas, setJustificativas] = useState<{[key: string]: string}>({})
  const [dialogJustificativa, setDialogJustificativa] = useState<{open: boolean, alunoId: string, alunoNome: string}>({
    open: false,
    alunoId: '',
    alunoNome: ''
  })

  const diasSemana = [
    { value: 'domingo', label: 'Domingo' },
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' }
  ]

  useEffect(() => {
    loadData()
    loadConfiguracao()
  }, [user])

  useEffect(() => {
    // Se for professor, definir automaticamente sua sala
    if (user?.role === 'professor') {
      // Buscar professor pelo ID do usuário
      const salasStorage = localStorage.getItem('salas')
      if (salasStorage) {
        const salasData = JSON.parse(salasStorage)
        const salaProfessor = salasData.find((s: Sala) => s.professor_id === user.id)
        if (salaProfessor) {
          console.log('Sala do professor encontrada:', salaProfessor)
          setChamadaAtual(prev => ({ ...prev, sala_id: salaProfessor.id }))
          loadAlunosSala(salaProfessor.id)
        } else {
          console.log('Nenhuma sala encontrada para o professor:', user.id)
        }
      }
    }
  }, [user])

  // Carregar alunos quando sala_id mudar
  useEffect(() => {
    if (chamadaAtual.sala_id) {
      loadAlunosSala(chamadaAtual.sala_id)
    }
  }, [chamadaAtual.sala_id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do localStorage
      const salasStorage = localStorage.getItem('salas')
      const professoresStorage = localStorage.getItem('professores')
      const chamadasStorage = localStorage.getItem('chamadas')
      
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
      
      if (chamadasStorage) {
        const chamadasData = JSON.parse(chamadasStorage)
        const chamadasIgreja = user?.igreja_id 
          ? chamadasData.filter((c: Chamada) => c.igreja_id === user.igreja_id)
          : chamadasData
        setChamadas(chamadasIgreja)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showMessage('error', 'Erro ao carregar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const loadConfiguracao = () => {
    try {
      const configStorage = localStorage.getItem(`config_chamada_${user?.igreja_id}`)
      if (configStorage) {
        setConfiguracao(JSON.parse(configStorage))
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    }
  }

  const salvarConfiguracao = () => {
    try {
      localStorage.setItem(`config_chamada_${user?.igreja_id}`, JSON.stringify(configuracao))
      showMessage('success', 'Configurações salvas com sucesso!')
      setShowConfig(false)
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      showMessage('error', 'Erro ao salvar configurações.')
    }
  }

  const loadAlunosSala = async (salaId: string) => {
    if (!salaId) {
      setAlunos([])
      return
    }
    
    try {
      console.log('Carregando alunos para sala:', salaId)
      
      // Carregar alunos do localStorage
      const alunosStorage = localStorage.getItem('alunos')
      if (alunosStorage) {
        const alunosData = JSON.parse(alunosStorage)
        console.log('Todos os alunos:', alunosData)
        
        // Filtrar alunos da sala específica e que estão ativos
        const alunosSala = alunosData.filter((a: Aluno) => 
          a.sala_id === salaId && a.ativo !== false
        )
        console.log('Alunos da sala:', alunosSala)
        
        setAlunos(alunosSala)
        
        // Inicializar presenças como false e justificativas vazias
        const presencasIniciais: {[key: string]: boolean} = {}
        const justificativasIniciais: {[key: string]: string} = {}
        alunosSala.forEach((aluno: Aluno) => {
          presencasIniciais[aluno.id] = false
          justificativasIniciais[aluno.id] = ''
        })
        setPresencasAlunos(presencasIniciais)
        setJustificativas(justificativasIniciais)
        
        console.log('Presenças inicializadas:', presencasIniciais)
      } else {
        console.log('Nenhum aluno encontrado no localStorage')
        setAlunos([])
      }
      
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
      showMessage('error', 'Erro ao carregar alunos da sala.')
      setAlunos([])
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const verificarDiaPermitido = (data: string) => {
    if (!configuracao.dias_especificos) return true
    
    const dataObj = new Date(data + 'T00:00:00')
    const diaSemana = dataObj.getDay()
    const diasMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
    const diaAtual = diasMap[diaSemana]
    
    return configuracao.dias_permitidos.includes(diaAtual)
  }

  const togglePresenca = (alunoId: string) => {
    const novoStatus = !presencasAlunos[alunoId]
    
    setPresencasAlunos(prev => ({
      ...prev,
      [alunoId]: novoStatus
    }))

    // Se marcou como falta, abrir dialog para justificativa
    if (!novoStatus) {
      const aluno = alunos.find(a => a.id === alunoId)
      setDialogJustificativa({
        open: true,
        alunoId: alunoId,
        alunoNome: aluno?.nome || ''
      })
    } else {
      // Se marcou como presente, limpar justificativa
      setJustificativas(prev => ({
        ...prev,
        [alunoId]: ''
      }))
    }
  }

  const salvarJustificativa = () => {
    setDialogJustificativa({ open: false, alunoId: '', alunoNome: '' })
  }

  const handleSalvarChamada = async () => {
    if (!chamadaAtual.sala_id) {
      showMessage('error', 'Selecione uma sala para a chamada')
      return
    }

    if (!verificarDiaPermitido(chamadaAtual.data)) {
      showMessage('error', 'Chamada não permitida neste dia. Verifique as configurações.')
      return
    }

    try {
      setSalvando(true)

      // Encontrar o professor da sala
      let professor = null
      if (user?.role === 'professor') {
        // Se for professor, usar o próprio usuário
        professor = professores.find(p => p.id === user.id)
      } else {
        // Se for admin, encontrar professor da sala
        professor = professores.find(p => {
          const salasStorage = localStorage.getItem('salas')
          if (salasStorage) {
            const salasData = JSON.parse(salasStorage)
            const sala = salasData.find((s: Sala) => s.id === chamadaAtual.sala_id)
            return sala && sala.professor_id === p.id
          }
          return false
        })
      }

      if (!professor) {
        showMessage('error', 'Professor não encontrado para esta sala')
        return
      }

      // Contar presenças
      const totalPresentes = Object.values(presencasAlunos).filter(presente => presente).length

      // Criar chamada
      const novaChamada: Chamada = {
        id: Date.now().toString(),
        data: chamadaAtual.data,
        sala_id: chamadaAtual.sala_id,
        professor_id: professor.id,
        igreja_id: user?.igreja_id || '',
        total_presentes: totalPresentes,
        total_visitantes: chamadaAtual.total_visitantes,
        observacoes: chamadaAtual.observacoes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Salvar chamada no localStorage
      const chamadasStorage = localStorage.getItem('chamadas')
      const chamadasArray = chamadasStorage ? JSON.parse(chamadasStorage) : []
      chamadasArray.push(novaChamada)
      localStorage.setItem('chamadas', JSON.stringify(chamadasArray))

      // Criar presenças dos alunos
      const presencasStorage = localStorage.getItem('presencas_alunos')
      const presencasArray = presencasStorage ? JSON.parse(presencasStorage) : []

      for (const [alunoId, presente] of Object.entries(presencasAlunos)) {
        const presenca: PresencaAluno = {
          id: `${Date.now()}-${alunoId}`,
          chamada_id: novaChamada.id,
          aluno_id: alunoId,
          presente,
          justificativa: presente ? undefined : (justificativas[alunoId] || 'Falta sem justificativa'),
          capitulos_lidos: 0,
          fez_atividade: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        presencasArray.push(presenca)
      }

      localStorage.setItem('presencas_alunos', JSON.stringify(presencasArray))

      showMessage('success', 'Chamada salva com sucesso!')
      
      // Atualizar dashboard e relatórios (simulação)
      atualizarDashboardRelatorios(novaChamada)
      
      // Resetar formulário
      setChamadaAtual({
        data: new Date().toISOString().split('T')[0],
        sala_id: user?.role === 'professor' ? chamadaAtual.sala_id : '',
        total_visitantes: 0,
        observacoes: ''
      })
      
      // Resetar presenças e justificativas
      const presencasIniciais: {[key: string]: boolean} = {}
      const justificativasIniciais: {[key: string]: string} = {}
      alunos.forEach(aluno => {
        presencasIniciais[aluno.id] = false
        justificativasIniciais[aluno.id] = ''
      })
      setPresencasAlunos(presencasIniciais)
      setJustificativas(justificativasIniciais)
      
      // Recarregar dados
      await loadData()

    } catch (error) {
      console.error('Erro ao salvar chamada:', error)
      showMessage('error', 'Erro ao salvar chamada. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const atualizarDashboardRelatorios = (chamada: Chamada) => {
    try {
      // Atualizar estatísticas do dashboard
      const statsStorage = localStorage.getItem('dashboard_stats')
      const stats = statsStorage ? JSON.parse(statsStorage) : {
        total_chamadas: 0,
        total_presentes_mes: 0,
        total_visitantes_mes: 0,
        frequencia_media: 0
      }

      stats.total_chamadas += 1
      stats.total_presentes_mes += chamada.total_presentes
      stats.total_visitantes_mes += chamada.total_visitantes

      localStorage.setItem('dashboard_stats', JSON.stringify(stats))

      // Atualizar dados para relatórios
      const relatoriosStorage = localStorage.getItem('dados_relatorios')
      const dadosRelatorios = relatoriosStorage ? JSON.parse(relatoriosStorage) : []
      
      dadosRelatorios.push({
        data: chamada.data,
        sala_id: chamada.sala_id,
        presentes: chamada.total_presentes,
        visitantes: chamada.total_visitantes,
        total: chamada.total_presentes + chamada.total_visitantes,
        timestamp: new Date().toISOString()
      })

      localStorage.setItem('dados_relatorios', JSON.stringify(dadosRelatorios))
      
    } catch (error) {
      console.error('Erro ao atualizar dashboard/relatórios:', error)
    }
  }

  const getSalaNome = (salaId: string) => {
    const sala = salas.find(s => s.id === salaId)
    return sala?.nome || 'Sala não encontrada'
  }

  const getProfessorNome = (professorId: string) => {
    const professor = professores.find(p => p.id === professorId)
    return professor?.nome || 'Professor não encontrado'
  }

  const totalPresentes = Object.values(presencasAlunos).filter(presente => presente).length
  const totalFaltas = alunos.length - totalPresentes
  const totalGeralPresentes = totalPresentes + chamadaAtual.total_visitantes

  const podeRegistrarChamada = verificarDiaPermitido(chamadaAtual.data)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registro de Chamada</h1>
          <p className="text-gray-600 text-lg">Registre a presença dos alunos na EBD</p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'admin_igreja') && (
          <Button
            onClick={() => setShowConfig(true)}
            variant="outline"
            className="flex items-center"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
        )}
      </div>

      {message && (
        <Alert className={cn(
          "border-l-4",
          message.type === 'success' 
            ? "border-green-500 bg-green-50 text-green-800"
            : "border-red-500 bg-red-50 text-red-800"
        )}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Configurações de Chamada */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-blue-600" />
              Configurações de Chamada
            </DialogTitle>
            <DialogDescription>
              Configure quando as chamadas podem ser registradas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <Label className="font-medium">Restringir por dias específicos</Label>
                <p className="text-sm text-gray-600">Permitir chamadas apenas em dias definidos</p>
              </div>
              <Switch
                checked={configuracao.dias_especificos}
                onCheckedChange={(checked) => setConfiguracao(prev => ({ ...prev, dias_especificos: checked }))}
              />
            </div>

            {configuracao.dias_especificos && (
              <div className="space-y-3">
                <Label className="font-medium">Dias permitidos para chamada</Label>
                <div className="grid grid-cols-2 gap-3">
                  {diasSemana.map((dia) => (
                    <div key={dia.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={dia.value}
                        checked={configuracao.dias_permitidos.includes(dia.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfiguracao(prev => ({
                              ...prev,
                              dias_permitidos: [...prev.dias_permitidos, dia.value]
                            }))
                          } else {
                            setConfiguracao(prev => ({
                              ...prev,
                              dias_permitidos: prev.dias_permitidos.filter(d => d !== dia.value)
                            }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor={dia.value} className="text-sm">{dia.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarConfiguracao} className="bg-blue-600 hover:bg-blue-700">
                Salvar Configurações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerta de dia não permitido */}
      {configuracao.dias_especificos && !podeRegistrarChamada && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Chamadas não são permitidas na data selecionada. Dias permitidos: {configuracao.dias_permitidos.map(d => diasSemana.find(ds => ds.value === d)?.label).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Dialog para Justificativa */}
      <Dialog open={dialogJustificativa.open} onOpenChange={(open) => setDialogJustificativa(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-orange-600" />
              Justificativa de Falta
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da falta de <strong>{dialogJustificativa.alunoNome}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="justificativa">Motivo da falta</Label>
              <Textarea
                id="justificativa"
                placeholder="Ex: Doença, viagem, compromisso familiar..."
                value={justificativas[dialogJustificativa.alunoId] || ''}
                onChange={(e) => setJustificativas(prev => ({
                  ...prev,
                  [dialogJustificativa.alunoId]: e.target.value
                }))}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setDialogJustificativa({ open: false, alunoId: '', alunoNome: '' })}
              >
                Cancelar
              </Button>
              <Button onClick={salvarJustificativa} className="bg-orange-600 hover:bg-orange-700">
                Salvar Justificativa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulário de Chamada */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center text-xl">
            <ClipboardList className="mr-3 h-6 w-6 text-blue-600" />
            Nova Chamada
          </CardTitle>
          <CardDescription className="text-base">
            Preencha os dados da chamada e marque a presença dos alunos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="data" className="font-medium">Data da Chamada</Label>
              <Input
                id="data"
                type="date"
                value={chamadaAtual.data}
                onChange={(e) => setChamadaAtual({ ...chamadaAtual, data: e.target.value })}
                className="h-12"
              />
            </div>

            {user?.role !== 'professor' && (
              <div className="space-y-2">
                <Label htmlFor="sala" className="font-medium">Sala</Label>
                <Select
                  value={chamadaAtual.sala_id}
                  onValueChange={(value) => {
                    setChamadaAtual({ ...chamadaAtual, sala_id: value })
                  }}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione uma sala" />
                  </SelectTrigger>
                  <SelectContent>
                    {salas.map((sala) => (
                      <SelectItem key={sala.id} value={sala.id}>
                        {sala.nome} {sala.faixa_etaria && `(${sala.faixa_etaria})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="visitantes" className="font-medium">Visitantes</Label>
              <Input
                id="visitantes"
                type="number"
                min="0"
                value={chamadaAtual.total_visitantes}
                onChange={(e) => setChamadaAtual({ ...chamadaAtual, total_visitantes: parseInt(e.target.value) || 0 })}
                className="h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="font-medium">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre a aula (opcional)"
              value={chamadaAtual.observacoes}
              onChange={(e) => setChamadaAtual({ ...chamadaAtual, observacoes: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alunos */}
      {chamadaAtual.sala_id && (
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="mr-3 h-6 w-6 text-green-600" />
                Lista de Alunos - {getSalaNome(chamadaAtual.sala_id)}
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {alunos.length} aluno{alunos.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <CardDescription className="text-base">
              {alunos.length === 0 
                ? 'Nenhum aluno cadastrado nesta sala'
                : 'Clique nos cards dos alunos para marcar presença ou falta'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {alunos.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Nenhum aluno cadastrado nesta sala</p>
                <p className="text-gray-500 text-sm">Cadastre alunos para poder fazer a chamada</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {alunos.map((aluno) => {
                    const presente = presencasAlunos[aluno.id] || false
                    const temJustificativa = justificativas[aluno.id] && justificativas[aluno.id].trim() !== ''
                    
                    return (
                      <Card
                        key={aluno.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          presente 
                            ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-300 shadow-md' 
                            : 'bg-gradient-to-r from-red-50 to-red-100 border-red-300'
                        }`}
                        onClick={() => togglePresenca(aluno.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${
                                presente ? 'bg-green-500' : 'bg-red-500'
                              }`}>
                                {presente ? (
                                  <CheckCircle className="h-5 w-5 text-white" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-white" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{aluno.nome}</h3>
                                <p className={`text-sm font-medium ${
                                  presente ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {presente ? 'Presente' : 'Falta'}
                                </p>
                                {!presente && temJustificativa && (
                                  <div className="flex items-center mt-1">
                                    <MessageSquare className="h-3 w-3 text-orange-600 mr-1" />
                                    <span className="text-xs text-orange-600">Com justificativa</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge 
                                variant={presente ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {presente ? 'P' : 'F'}
                              </Badge>
                              {!presente && temJustificativa && (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  Justificada
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {!presente && temJustificativa && (
                            <div className="mt-3 p-2 bg-orange-50 rounded border border-orange-200">
                              <p className="text-xs text-orange-800 font-medium">Justificativa:</p>
                              <p className="text-xs text-orange-700">{justificativas[aluno.id]}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Resumo da Chamada */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{totalPresentes}</div>
                      <p className="text-sm text-green-700 font-medium">Presentes</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{totalFaltas}</div>
                      <p className="text-sm text-red-700 font-medium">Faltas</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{chamadaAtual.total_visitantes}</div>
                      <p className="text-sm text-blue-700 font-medium">Visitantes</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{totalGeralPresentes}</div>
                      <p className="text-sm text-purple-700 font-medium">Total Presente</p>
                      <p className="text-xs text-purple-600">(Presentes + Visitantes)</p>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={handleSalvarChamada}
                  disabled={salvando || !chamadaAtual.sala_id || !podeRegistrarChamada}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold"
                >
                  {salvando ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Salvando Chamada...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Salvar Chamada
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chamadas Recentes */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Calendar className="mr-3 h-6 w-6 text-purple-600" />
            Chamadas Recentes
          </CardTitle>
          <CardDescription className="text-base">
            Últimas chamadas registradas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {chamadas.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Nenhuma chamada registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chamadas.slice(0, 5).map((chamada) => (
                <div key={chamada.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-semibold text-gray-900">{getSalaNome(chamada.sala_id)}</p>
                    <p className="text-sm text-gray-600">
                      {getProfessorNome(chamada.professor_id)} • {new Date(chamada.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-green-600">{chamada.total_presentes}</div>
                        <div className="text-xs text-gray-500">Presentes</div>
                      </div>
                      {chamada.total_visitantes > 0 && (
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-600">{chamada.total_visitantes}</div>
                          <div className="text-xs text-gray-500">Visitantes</div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-sm font-bold text-purple-600">
                          {chamada.total_presentes + chamada.total_visitantes}
                        </div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}