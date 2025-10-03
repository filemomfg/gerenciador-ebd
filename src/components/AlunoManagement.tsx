'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Aluno, Sala } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Calendar,
  Phone,
  MapPin,
  User,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Filter,
  School
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlunoFormData {
  nome: string
  data_nascimento: string
  telefone: string
  endereco: string
  responsavel: string
  telefone_responsavel: string
  sala_id: string
}

export function AlunoManagement() {
  const { user } = useAuth()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [salas, setSalas] = useState<Sala[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSala, setSelectedSala] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState<AlunoFormData>({
    nome: '',
    data_nascimento: '',
    telefone: '',
    endereco: '',
    responsavel: '',
    telefone_responsavel: '',
    sala_id: ''
  })

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do localStorage
      const alunosStorage = localStorage.getItem('alunos')
      const salasStorage = localStorage.getItem('salas')
      
      if (alunosStorage) {
        const alunosData = JSON.parse(alunosStorage)
        const alunosIgreja = user?.igreja_id 
          ? alunosData.filter((a: Aluno) => a.igreja_id === user.igreja_id && a.ativo !== false)
          : alunosData.filter((a: Aluno) => a.ativo !== false)
        setAlunos(alunosIgreja)
      }
      
      if (salasStorage) {
        const salasData = JSON.parse(salasStorage)
        const salasIgreja = user?.igreja_id 
          ? salasData.filter((s: Sala) => s.igreja_id === user.igreja_id)
          : salasData
        setSalas(salasIgreja)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showMessage('error', 'Erro ao carregar dados dos alunos')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim() || !formData.sala_id) {
      showMessage('error', 'Nome e sala são obrigatórios')
      return
    }

    try {
      setSaving(true)
      
      const alunoData = {
        id: editingAluno?.id || Date.now().toString(),
        ...formData,
        igreja_id: user?.igreja_id || '',
        ativo: true,
        created_at: editingAluno?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Salvar no localStorage
      const alunosStorage = localStorage.getItem('alunos')
      let alunosArray = alunosStorage ? JSON.parse(alunosStorage) : []

      if (editingAluno) {
        // Atualizar aluno existente
        alunosArray = alunosArray.map((a: Aluno) => a.id === editingAluno.id ? alunoData : a)
        setAlunos(prev => prev.map(a => a.id === editingAluno.id ? alunoData : a))
        showMessage('success', 'Aluno atualizado com sucesso!')
      } else {
        // Criar novo aluno
        alunosArray.push(alunoData)
        setAlunos(prev => [...prev, alunoData])
        showMessage('success', 'Aluno cadastrado com sucesso!')
      }

      localStorage.setItem('alunos', JSON.stringify(alunosArray))

      resetForm()
    } catch (error) {
      console.error('Erro ao salvar aluno:', error)
      showMessage('error', 'Erro ao salvar aluno. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno)
    setFormData({
      nome: aluno.nome,
      data_nascimento: aluno.data_nascimento || '',
      telefone: aluno.telefone || '',
      endereco: aluno.endereco || '',
      responsavel: aluno.responsavel || '',
      telefone_responsavel: aluno.telefone_responsavel || '',
      sala_id: aluno.sala_id
    })
    setShowForm(true)
  }

  const handleDelete = async (aluno: Aluno) => {
    if (!confirm(`Tem certeza que deseja excluir o aluno "${aluno.nome}"?\n\nEsta ação não pode ser desfeita e removerá:\n- O aluno da sala\n- Todos os registros de presença\n- Dados pessoais do aluno`)) {
      return
    }

    try {
      // Marcar como inativo no localStorage
      const alunosStorage = localStorage.getItem('alunos')
      if (alunosStorage) {
        const alunosArray = JSON.parse(alunosStorage)
        const alunosAtualizados = alunosArray.map((a: Aluno) => 
          a.id === aluno.id 
            ? { ...a, ativo: false, updated_at: new Date().toISOString() }
            : a
        )
        localStorage.setItem('alunos', JSON.stringify(alunosAtualizados))
        
        // Remover da lista atual (filtrar apenas ativos)
        setAlunos(prev => prev.filter(a => a.id !== aluno.id))
        showMessage('success', 'Aluno removido com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao remover aluno:', error)
      showMessage('error', 'Erro ao remover aluno. Tente novamente.')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      data_nascimento: '',
      telefone: '',
      endereco: '',
      responsavel: '',
      telefone_responsavel: '',
      sala_id: ''
    })
    setEditingAluno(null)
    setShowForm(false)
  }

  const filteredAlunos = alunos.filter(aluno => {
    const matchesSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.responsavel?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSala = !selectedSala || aluno.sala_id === selectedSala
    return matchesSearch && matchesSala
  })

  const getSalaNome = (salaId: string) => {
    const sala = salas.find(s => s.id === salaId)
    return sala?.nome || 'Sala não encontrada'
  }

  const getSalaInfo = (salaId: string) => {
    const sala = salas.find(s => s.id === salaId)
    if (!sala) return { nome: 'Sala não encontrada', faixa_etaria: '' }
    return { nome: sala.nome, faixa_etaria: sala.faixa_etaria || '' }
  }

  const calcularIdade = (dataNascimento: string) => {
    if (!dataNascimento) return null
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const mes = hoje.getMonth() - nascimento.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }
    return idade
  }

  const canManageAlunos = user?.role === 'admin' || user?.role === 'admin_igreja'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-100 p-2 rounded-lg">
            <UserCheck className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Alunos</h1>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'Gerencie todos os alunos do sistema'
                : user?.role === 'admin_igreja'
                ? 'Gerencie os alunos da sua igreja'
                : 'Visualize os alunos da sua sala'
              }
            </p>
          </div>
        </div>
        
        {canManageAlunos && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        )}
      </div>

      {/* Mensagem de feedback */}
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

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome do aluno ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                value={selectedSala}
                onChange={(e) => setSelectedSala(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">Todas as salas</option>
                {salas.map(sala => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nome}
                  </option>
                ))}
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
              <Users className="h-8 w-8 text-cyan-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{filteredAlunos.length}</p>
                <p className="text-sm text-gray-600">Total de Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAlunos.filter(a => {
                    const idade = a.data_nascimento ? calcularIdade(a.data_nascimento) : null
                    return idade && idade < 18
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Menores de 18</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAlunos.filter(a => {
                    const idade = a.data_nascimento ? calcularIdade(a.data_nascimento) : null
                    return idade && idade >= 18
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Adultos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <School className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{salas.length}</p>
                <p className="text-sm text-gray-600">Salas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="border-2 border-cyan-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingAluno ? 'Editar Aluno' : 'Novo Aluno'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              {editingAluno ? 'Atualize as informações do aluno' : 'Preencha os dados do novo aluno'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome completo do aluno"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sala">Sala *</Label>
                  <select
                    id="sala"
                    value={formData.sala_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, sala_id: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
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
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                    placeholder="Nome do responsável"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone_responsavel">Telefone do Responsável</Label>
                  <Input
                    id="telefone_responsavel"
                    value={formData.telefone_responsavel}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone_responsavel: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Textarea
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Endereço completo"
                  rows={2}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingAluno ? 'Atualizar' : 'Cadastrar'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Alunos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlunos.map(aluno => {
          const idade = aluno.data_nascimento ? calcularIdade(aluno.data_nascimento) : null
          const salaInfo = getSalaInfo(aluno.sala_id)
          
          return (
            <Card key={aluno.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{aluno.nome}</CardTitle>
                  <Badge variant="outline" className="text-cyan-600 border-cyan-600 font-medium">
                    {salaInfo.nome}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {salaInfo.faixa_etaria && (
                    <CardDescription className="flex items-center text-xs">
                      <School className="h-3 w-3 mr-1" />
                      {salaInfo.faixa_etaria}
                    </CardDescription>
                  )}
                  {idade && (
                    <CardDescription className="flex items-center text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {idade} anos
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {aluno.telefone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {aluno.telefone}
                  </div>
                )}
                
                {aluno.responsavel && (
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">Responsável:</p>
                    <p className="text-gray-600">{aluno.responsavel}</p>
                    {aluno.telefone_responsavel && (
                      <p className="text-gray-500 text-xs">{aluno.telefone_responsavel}</p>
                    )}
                  </div>
                )}
                
                {aluno.endereco && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{aluno.endereco}</span>
                  </div>
                )}

                {canManageAlunos && (
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(aluno)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(aluno)}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredAlunos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum aluno encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedSala 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece cadastrando o primeiro aluno'
              }
            </p>
            {canManageAlunos && !searchTerm && !selectedSala && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Aluno
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}