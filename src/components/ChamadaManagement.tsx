'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Clock, Users, BookOpen, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Aluno {
  id: string
  nome: string
  email: string
  turma_id: string
  created_at: string
}

interface Turma {
  id: string
  nome: string
  professor_id: string
  sala_id: string
  created_at: string
}

interface Professor {
  id: string
  nome: string
  email: string
  sala_id: string
  created_at: string
}

interface Chamada {
  id: string
  turma_id: string
  professor_id: string
  data: string
  horario: string
  capitulo: string
  atividade_descricao?: string
  observacoes?: string
  created_at: string
}

interface PresencaAluno {
  id: string
  chamada_id: string
  aluno_id: string
  presente: boolean
  justificativa?: string
  capitulos_lidos: number
  fez_atividade: boolean
  created_at: string
}

// Função auxiliar para clipboard com fallback
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Tentar usar a Clipboard API moderna
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback para método antigo
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const result = document.execCommand('copy')
      document.body.removeChild(textArea)
      return result
    }
  } catch (error) {
    console.warn('Erro ao copiar para clipboard:', error)
    return false
  }
}

export default function ChamadaManagement() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  const [chamadas, setChamadas] = useState<Chamada[]>([])
  const [presencas, setPresencas] = useState<PresencaAluno[]>([])
  
  const [selectedTurma, setSelectedTurma] = useState<string>('')
  const [selectedProfessor, setSelectedProfessor] = useState<string>('')
  const [selectedChamada, setSelectedChamada] = useState<string>('')
  
  const [novaChamada, setNovaChamada] = useState({
    data: new Date().toISOString().split('T')[0],
    horario: new Date().toTimeString().slice(0, 5),
    capitulo: '',
    atividade_descricao: '',
    observacoes: ''
  })
  
  const [presencaAlunos, setPresencaAlunos] = useState<{[key: string]: boolean}>({})
  const [justificativas, setJustificativas] = useState<{[key: string]: string}>({})
  const [capitulosLidos, setCapitulosLidos] = useState<{[key: string]: number}>({})
  const [atividadeFeita, setAtividadeFeita] = useState<{[key: string]: boolean}>({})
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar turmas
      const { data: turmasData, error: turmasError } = await supabase
        .from('turmas')
        .select('*')
        .order('nome')
      
      if (turmasError) throw turmasError
      setTurmas(turmasData || [])
      
      // Carregar professores
      const { data: professoresData, error: professoresError } = await supabase
        .from('professores')
        .select('*')
        .order('nome')
      
      if (professoresError) throw professoresError
      setProfessores(professoresData || [])
      
      // Carregar chamadas
      const { data: chamadasData, error: chamadasError } = await supabase
        .from('chamadas')
        .select('*')
        .order('data', { ascending: false })
      
      if (chamadasError) throw chamadasError
      setChamadas(chamadasData || [])
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Carregar alunos quando turma for selecionada
  useEffect(() => {
    if (selectedTurma) {
      carregarAlunos(selectedTurma)
    }
  }, [selectedTurma])

  const carregarAlunos = async (turmaId: string) => {
    try {
      const { data: alunosData, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turmaId)
        .order('nome')
      
      if (error) throw error
      setAlunos(alunosData || [])
      
      // Resetar estados de presença
      setPresencaAlunos({})
      setJustificativas({})
      setCapitulosLidos({})
      setAtividadeFeita({})
      
    } catch (err) {
      console.error('Erro ao carregar alunos:', err)
      setError('Erro ao carregar alunos')
    }
  }

  // Carregar presenças quando chamada for selecionada
  useEffect(() => {
    if (selectedChamada) {
      carregarPresencas(selectedChamada)
    }
  }, [selectedChamada])

  const carregarPresencas = async (chamadaId: string) => {
    try {
      const { data: presencasData, error } = await supabase
        .from('presencas_alunos')
        .select('*')
        .eq('chamada_id', chamadaId)
      
      if (error) throw error
      setPresencas(presencasData || [])
      
      // Preencher estados com dados existentes
      const presencaMap: {[key: string]: boolean} = {}
      const justificativaMap: {[key: string]: string} = {}
      const capitulosMap: {[key: string]: number} = {}
      const atividadeMap: {[key: string]: boolean} = {}
      
      presencasData?.forEach(presenca => {
        presencaMap[presenca.aluno_id] = presenca.presente
        if (presenca.justificativa) {
          justificativaMap[presenca.aluno_id] = presenca.justificativa
        }
        capitulosMap[presenca.aluno_id] = presenca.capitulos_lidos
        atividadeMap[presenca.aluno_id] = presenca.fez_atividade
      })
      
      setPresencaAlunos(presencaMap)
      setJustificativas(justificativaMap)
      setCapitulosLidos(capitulosMap)
      setAtividadeFeita(atividadeMap)
      
    } catch (err) {
      console.error('Erro ao carregar presenças:', err)
      setError('Erro ao carregar presenças')
    }
  }

  const criarChamada = async () => {
    if (!selectedTurma || !selectedProfessor || !novaChamada.capitulo) {
      setError('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Criar chamada
      const chamadaData = {
        id: `chamada_${Date.now()}`,
        turma_id: selectedTurma,
        professor_id: selectedProfessor,
        data: novaChamada.data,
        horario: novaChamada.horario,
        capitulo: novaChamada.capitulo,
        atividade_descricao: novaChamada.atividade_descricao || null,
        observacoes: novaChamada.observacoes || null,
        created_at: new Date().toISOString()
      }
      
      const { data: chamadaCriada, error: chamadaError } = await supabase
        .from('chamadas')
        .insert([chamadaData])
        .select()
        .single()
      
      if (chamadaError) throw chamadaError
      
      // Criar presenças para todos os alunos
      const presencasArray: PresencaAluno[] = []
      
      for (const aluno of alunos) {
        const alunoId = aluno.id
        const presente = presencaAlunos[alunoId] || false
        
        const presenca: PresencaAluno = {
          id: `${Date.now()}-${alunoId}`,
          chamada_id: chamadaCriada.id,
          aluno_id: alunoId,
          presente,
          justificativa: presente ? undefined : (justificativas[alunoId] || 'Falta sem justificativa'),
          capitulos_lidos: capitulosLidos[alunoId] || 0,
          fez_atividade: atividadeFeita[alunoId] || false,
          created_at: new Date().toISOString()
        }
        presencasArray.push(presenca)
      }
      
      if (presencasArray.length > 0) {
        const { error: presencaError } = await supabase
          .from('presencas_alunos')
          .insert(presencasArray)
        
        if (presencaError) throw presencaError
      }
      
      setSuccess('Chamada criada com sucesso!')
      
      // Resetar formulário
      setNovaChamada({
        data: new Date().toISOString().split('T')[0],
        horario: new Date().toTimeString().slice(0, 5),
        capitulo: '',
        atividade_descricao: '',
        observacoes: ''
      })
      
      // Recarregar dados
      carregarDados()
      
    } catch (err) {
      console.error('Erro ao criar chamada:', err)
      setError('Erro ao criar chamada')
    } finally {
      setLoading(false)
    }
  }

  const atualizarPresenca = async () => {
    if (!selectedChamada) {
      setError('Selecione uma chamada')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Atualizar presenças existentes
      for (const aluno of alunos) {
        const alunoId = aluno.id
        const presente = presencaAlunos[alunoId] || false
        
        const presencaData = {
          presente,
          justificativa: presente ? null : (justificativas[alunoId] || 'Falta sem justificativa'),
          capitulos_lidos: capitulosLidos[alunoId] || 0,
          fez_atividade: atividadeFeita[alunoId] || false
        }
        
        const { error } = await supabase
          .from('presencas_alunos')
          .update(presencaData)
          .eq('chamada_id', selectedChamada)
          .eq('aluno_id', alunoId)
        
        if (error) throw error
      }
      
      setSuccess('Presenças atualizadas com sucesso!')
      
    } catch (err) {
      console.error('Erro ao atualizar presenças:', err)
      setError('Erro ao atualizar presenças')
    } finally {
      setLoading(false)
    }
  }

  const togglePresenca = (alunoId: string) => {
    setPresencaAlunos(prev => ({
      ...prev,
      [alunoId]: !prev[alunoId]
    }))
  }

  const updateJustificativa = (alunoId: string, justificativa: string) => {
    setJustificativas(prev => ({
      ...prev,
      [alunoId]: justificativa
    }))
  }

  const updateCapitulos = (alunoId: string, capitulos: number) => {
    setCapitulosLidos(prev => ({
      ...prev,
      [alunoId]: capitulos
    }))
  }

  const toggleAtividade = (alunoId: string) => {
    setAtividadeFeita(prev => ({
      ...prev,
      [alunoId]: !prev[alunoId]
    }))
  }

  const getTurmaById = (id: string) => turmas.find(t => t.id === id)
  const getProfessorById = (id: string) => professores.find(p => p.id === id)
  const getChamadaById = (id: string) => chamadas.find(c => c.id === id)

  const estatisticas = {
    totalAlunos: alunos.length,
    presentes: Object.values(presencaAlunos).filter(Boolean).length,
    ausentes: Object.values(presencaAlunos).filter(p => !p).length,
    percentualPresenca: alunos.length > 0 ? Math.round((Object.values(presencaAlunos).filter(Boolean).length / alunos.length) * 100) : 0
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Gerenciamento de Chamadas</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Nova Chamada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Nova Chamada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="turma">Turma *</Label>
                <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map(turma => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="professor">Professor *</Label>
                <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores.map(professor => (
                      <SelectItem key={professor.id} value={professor.id}>
                        {professor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={novaChamada.data}
                  onChange={(e) => setNovaChamada(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="horario">Horário *</Label>
                <Input
                  id="horario"
                  type="time"
                  value={novaChamada.horario}
                  onChange={(e) => setNovaChamada(prev => ({ ...prev, horario: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="capitulo">Capítulo *</Label>
              <Input
                id="capitulo"
                placeholder="Ex: Capítulo 5 - Revolução Industrial"
                value={novaChamada.capitulo}
                onChange={(e) => setNovaChamada(prev => ({ ...prev, capitulo: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="atividade">Descrição da Atividade</Label>
              <Textarea
                id="atividade"
                placeholder="Descreva a atividade realizada na aula..."
                value={novaChamada.atividade_descricao}
                onChange={(e) => setNovaChamada(prev => ({ ...prev, atividade_descricao: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações gerais sobre a aula..."
                value={novaChamada.observacoes}
                onChange={(e) => setNovaChamada(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </div>

            <Button 
              onClick={criarChamada} 
              disabled={loading || !selectedTurma || !selectedProfessor || !novaChamada.capitulo}
              className="w-full"
            >
              {loading ? 'Criando...' : 'Criar Chamada'}
            </Button>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Estatísticas da Chamada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{estatisticas.totalAlunos}</div>
                <div className="text-sm text-gray-600">Total de Alunos</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{estatisticas.presentes}</div>
                <div className="text-sm text-gray-600">Presentes</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{estatisticas.ausentes}</div>
                <div className="text-sm text-gray-600">Ausentes</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{estatisticas.percentualPresenca}%</div>
                <div className="text-sm text-gray-600">Presença</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alunos para Chamada */}
      {selectedTurma && alunos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Chamada - {getTurmaById(selectedTurma)?.nome}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alunos.map(aluno => (
                <div key={aluno.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={presencaAlunos[aluno.id] || false}
                      onCheckedChange={() => togglePresenca(aluno.id)}
                    />
                    <div>
                      <div className="font-medium">{aluno.nome}</div>
                      <div className="text-sm text-gray-500">{aluno.email}</div>
                    </div>
                    {presencaAlunos[aluno.id] ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Presente
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Ausente
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Capítulos:</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={capitulosLidos[aluno.id] || 0}
                        onChange={(e) => updateCapitulos(aluno.id, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={atividadeFeita[aluno.id] || false}
                        onCheckedChange={() => toggleAtividade(aluno.id)}
                      />
                      <Label className="text-sm">Fez Atividade</Label>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Justificativas para ausentes */}
              {Object.keys(presencaAlunos).some(id => !presencaAlunos[id]) && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium text-lg">Justificativas de Ausência</h3>
                  {alunos
                    .filter(aluno => !presencaAlunos[aluno.id])
                    .map(aluno => (
                      <div key={`just-${aluno.id}`} className="space-y-2">
                        <Label>{aluno.nome}</Label>
                        <Textarea
                          placeholder="Justificativa da ausência..."
                          value={justificativas[aluno.id] || ''}
                          onChange={(e) => updateJustificativa(aluno.id, e.target.value)}
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chamadas Existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Chamadas Existentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Selecionar Chamada para Editar</Label>
              <Select value={selectedChamada} onValueChange={setSelectedChamada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma chamada" />
                </SelectTrigger>
                <SelectContent>
                  {chamadas.map(chamada => {
                    const turma = getTurmaById(chamada.turma_id)
                    const professor = getProfessorById(chamada.professor_id)
                    return (
                      <SelectItem key={chamada.id} value={chamada.id}>
                        {turma?.nome} - {chamada.data} {chamada.horario} - {professor?.nome}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedChamada && (
              <div className="mt-4">
                <Button onClick={atualizarPresenca} disabled={loading}>
                  {loading ? 'Atualizando...' : 'Atualizar Presenças'}
                </Button>
              </div>
            )}

            {chamadas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma chamada encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}