'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, GraduationCap, Phone, Mail, Calendar, School, Trash2, CheckCircle, AlertCircle, Eye, EyeOff, X } from 'lucide-react'
import { Professor, Sala, Igreja } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ProfessorManagement() {
  const { user } = useAuth()
  const [professores, setProfessores] = useState<Professor[]>([])
  const [salas, setSalas] = useState<Sala[]>([])
  const [igrejas, setIgrejas] = useState<Igreja[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedSalas, setSelectedSalas] = useState<string[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    data_nascimento: '',
    endereco: '',
    igreja_id: '',
    ativo: true
  })

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do localStorage
      const professoresStorage = localStorage.getItem('professores')
      const salasStorage = localStorage.getItem('salas')
      const igrejasStorage = localStorage.getItem('igrejas')
      
      if (professoresStorage) {
        const professoresData = JSON.parse(professoresStorage)
        const professoresIgreja = user?.igreja_id 
          ? professoresData.filter((p: Professor) => p.igreja_id === user.igreja_id)
          : professoresData
        setProfessores(professoresIgreja)
      }
      
      if (salasStorage) {
        const salasData = JSON.parse(salasStorage)
        const salasIgreja = user?.igreja_id 
          ? salasData.filter((s: Sala) => s.igreja_id === user.igreja_id)
          : salasData
        setSalas(salasIgreja)
      }

      if (igrejasStorage) {
        const igrejasData = JSON.parse(igrejasStorage)
        if (user?.role === 'admin') {
          setIgrejas(igrejasData)
        } else if (user?.igreja_id) {
          const igrejaUsuario = igrejasData.filter((i: Igreja) => i.id === user.igreja_id)
          setIgrejas(igrejaUsuario)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showMessage('error', 'Erro ao carregar dados. Tente novamente.')
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

    if (!formData.nome.trim()) {
      showMessage('error', 'Nome é obrigatório')
      return
    }

    if (!formData.data_nascimento) {
      showMessage('error', 'Data de nascimento é obrigatória')
      return
    }

    // Para admin principal, igreja é obrigatória
    if (user?.role === 'admin' && !formData.igreja_id) {
      showMessage('error', 'Selecione uma igreja para o professor')
      return
    }

    if (selectedSalas.length === 0) {
      showMessage('error', 'Selecione pelo menos uma sala para o professor')
      return
    }

    // Validar email e senha para novos professores ou quando alterados
    if (!editingProfessor || formData.email !== editingProfessor.email) {
      if (!formData.email.trim()) {
        showMessage('error', 'Email é obrigatório para acesso ao sistema')
        return
      }
      if (!formData.email.includes('@')) {
        showMessage('error', 'Email deve ter um formato válido')
        return
      }
    }

    if (!editingProfessor && !formData.senha.trim()) {
      showMessage('error', 'Senha é obrigatória para novos professores')
      return
    }

    if (formData.senha && formData.senha.length < 6) {
      showMessage('error', 'Senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      setSaving(true)
      
      const professorData = {
        id: editingProfessor?.id || Date.now().toString(),
        ...formData,
        // Usar igreja do usuário se não for admin principal
        igreja_id: user?.role === 'admin' ? formData.igreja_id : (user?.igreja_id || ''),
        // Manter senha anterior se não foi alterada
        senha: formData.senha || editingProfessor?.senha || '',
        // Compatibilidade com sistema antigo (primeira sala)
        sala_id: selectedSalas[0] || '',
        // Nova funcionalidade: múltiplas salas
        salas_ids: selectedSalas,
        created_at: editingProfessor?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Salvar no localStorage
      const professoresStorage = localStorage.getItem('professores')
      let professoresArray = professoresStorage ? JSON.parse(professoresStorage) : []

      if (editingProfessor) {
        // Atualizar professor existente
        professoresArray = professoresArray.map((p: Professor) => p.id === editingProfessor.id ? professorData : p)
        setProfessores(prev => prev.map(p => p.id === editingProfessor.id ? professorData : p))
        showMessage('success', `Professor atualizado com sucesso! Associado a ${selectedSalas.length} sala(s).`)
      } else {
        // Criar novo professor
        professoresArray.push(professorData)
        setProfessores(prev => [...prev, professorData])
        showMessage('success', `Professor cadastrado com sucesso! Associado a ${selectedSalas.length} sala(s). Credenciais de acesso criadas.`)
      }

      localStorage.setItem('professores', JSON.stringify(professoresArray))

      // Atualizar as salas com o professor (múltiplas salas)
      const salasStorage = localStorage.getItem('salas')
      if (salasStorage) {
        const salasArray = JSON.parse(salasStorage)
        const salasAtualizadas = salasArray.map((s: Sala) => {
          // Se a sala está selecionada, adicionar o professor
          if (selectedSalas.includes(s.id)) {
            const professoresIds = s.professores_ids || []
            const novoProfessoresIds = professoresIds.includes(professorData.id) 
              ? professoresIds 
              : [...professoresIds, professorData.id]
            
            return { 
              ...s, 
              professor_id: s.professor_id || professorData.id, // Compatibilidade
              professores_ids: novoProfessoresIds,
              updated_at: new Date().toISOString() 
            }
          }
          
          // Se estava editando, remover professor das salas não selecionadas
          if (editingProfessor) {
            const professoresIds = s.professores_ids || []
            if (professoresIds.includes(editingProfessor.id) && !selectedSalas.includes(s.id)) {
              return {
                ...s,
                professor_id: s.professor_id === editingProfessor.id ? '' : s.professor_id,
                professores_ids: professoresIds.filter(id => id !== editingProfessor.id),
                updated_at: new Date().toISOString()
              }
            }
          }
          
          return s
        })
        localStorage.setItem('salas', JSON.stringify(salasAtualizadas))
        setSalas(prev => prev.map(s => {
          if (selectedSalas.includes(s.id)) {
            const professoresIds = s.professores_ids || []
            const novoProfessoresIds = professoresIds.includes(professorData.id) 
              ? professoresIds 
              : [...professoresIds, professorData.id]
            
            return { 
              ...s, 
              professor_id: s.professor_id || professorData.id,
              professores_ids: novoProfessoresIds
            }
          }
          
          if (editingProfessor) {
            const professoresIds = s.professores_ids || []
            if (professoresIds.includes(editingProfessor.id) && !selectedSalas.includes(s.id)) {
              return {
                ...s,
                professor_id: s.professor_id === editingProfessor.id ? '' : s.professor_id,
                professores_ids: professoresIds.filter(id => id !== editingProfessor.id)
              }
            }
          }
          
          return s
        }))
      }

      // Salvar credenciais de usuário
      const usersStorage = localStorage.getItem('users')
      let usersArray = usersStorage ? JSON.parse(usersStorage) : []
      
      const userData = {
        id: professorData.id,
        email: professorData.email,
        senha: professorData.senha,
        role: 'professor',
        nome: professorData.nome,
        igreja_id: professorData.igreja_id,
        ativo: professorData.ativo,
        created_at: professorData.created_at,
        updated_at: professorData.updated_at
      }

      if (editingProfessor) {
        usersArray = usersArray.map((u: any) => u.id === editingProfessor.id ? userData : u)
      } else {
        usersArray.push(userData)
      }
      
      localStorage.setItem('users', JSON.stringify(usersArray))
      
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar professor:', error)
      showMessage('error', 'Erro ao salvar professor. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor)
    
    // Carregar salas do professor (compatibilidade com sistema antigo e novo)
    const salasIds = professor.salas_ids || []
    if (salasIds.length === 0 && professor.sala_id) {
      salasIds.push(professor.sala_id)
    }
    
    setSelectedSalas(salasIds)
    setFormData({
      nome: professor.nome,
      email: professor.email || '',
      senha: '', // Não mostrar senha atual
      telefone: professor.telefone || '',
      data_nascimento: professor.data_nascimento || '',
      endereco: professor.endereco || '',
      igreja_id: professor.igreja_id || '',
      ativo: professor.ativo
    })
    setDialogOpen(true)
  }

  const handleDelete = async (professor: Professor) => {
    const salasAssociadas = getSalasNomes(professor.id)
    const confirmMessage = salasAssociadas.length > 0 
      ? `Tem certeza que deseja excluir o professor "${professor.nome}"?\n\nEsta ação removerá:\n- O professor de ${salasAssociadas.length} sala(s): ${salasAssociadas.join(', ')}\n- O acesso ao sistema\n- Todos os dados relacionados\n\nEsta ação não pode ser desfeita.`
      : `Tem certeza que deseja excluir o professor "${professor.nome}"?\n\nEsta ação removerá:\n- O acesso ao sistema\n- Todos os dados relacionados\n\nEsta ação não pode ser desfeita.`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      // Remover do localStorage
      const professoresStorage = localStorage.getItem('professores')
      if (professoresStorage) {
        const professoresArray = JSON.parse(professoresStorage)
        const professoresAtualizados = professoresArray.filter((p: Professor) => p.id !== professor.id)
        localStorage.setItem('professores', JSON.stringify(professoresAtualizados))
        
        setProfessores(prev => prev.filter(p => p.id !== professor.id))

        // Remover professor das salas
        const salasStorage = localStorage.getItem('salas')
        if (salasStorage) {
          const salasArray = JSON.parse(salasStorage)
          const salasAtualizadas = salasArray.map((s: Sala) => {
            const professoresIds = s.professores_ids || []
            return {
              ...s,
              professor_id: s.professor_id === professor.id ? '' : s.professor_id,
              professores_ids: professoresIds.filter(id => id !== professor.id),
              updated_at: new Date().toISOString()
            }
          })
          localStorage.setItem('salas', JSON.stringify(salasAtualizadas))
          setSalas(prev => prev.map(s => {
            const professoresIds = s.professores_ids || []
            return {
              ...s,
              professor_id: s.professor_id === professor.id ? '' : s.professor_id,
              professores_ids: professoresIds.filter(id => id !== professor.id)
            }
          }))
        }

        // Remover usuário do sistema
        const usersStorage = localStorage.getItem('users')
        if (usersStorage) {
          const usersArray = JSON.parse(usersStorage)
          const usersAtualizados = usersArray.filter((u: any) => u.id !== professor.id)
          localStorage.setItem('users', JSON.stringify(usersAtualizados))
        }
        
        showMessage('success', 'Professor removido com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao remover professor:', error)
      showMessage('error', 'Erro ao remover professor. Tente novamente.')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      telefone: '',
      data_nascimento: '',
      endereco: '',
      igreja_id: user?.role === 'admin' ? '' : (user?.igreja_id || ''),
      ativo: true
    })
    setSelectedSalas([])
    setEditingProfessor(null)
    setShowPassword(false)
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getSalasNomes = (professorId: string) => {
    // Buscar salas onde o professor está associado (compatibilidade com ambos os sistemas)
    const salasAssociadas = salas.filter(s => {
      const professoresIds = s.professores_ids || []
      return s.professor_id === professorId || professoresIds.includes(professorId)
    })
    return salasAssociadas.map(s => s.nome)
  }

  const getIgrejaNome = (igrejaId: string) => {
    const igreja = igrejas.find(i => i.id === igrejaId)
    return igreja?.nome || 'Igreja não encontrada'
  }

  const getSalasDisponiveis = () => {
    const igrejaId = user?.role === 'admin' ? formData.igreja_id : user?.igreja_id
    if (!igrejaId) return []

    // Retornar TODAS as salas da igreja (permitir múltiplos professores por sala)
    return salas.filter(s => s.igreja_id === igrejaId && s.ativa)
  }

  const handleIgrejaChange = (igrejaId: string) => {
    setFormData(prev => ({ ...prev, igreja_id: igrejaId }))
    setSelectedSalas([]) // Limpar salas selecionadas ao trocar igreja
    
    // Atualizar salas disponíveis
    const salasStorage = localStorage.getItem('salas')
    if (salasStorage) {
      const salasData = JSON.parse(salasStorage)
      const salasIgreja = salasData.filter((s: Sala) => s.igreja_id === igrejaId)
      setSalas(salasIgreja)
    }
  }

  const toggleSala = (salaId: string) => {
    setSelectedSalas(prev => 
      prev.includes(salaId)
        ? prev.filter(id => id !== salaId)
        : [...prev, salaId]
    )
  }

  const removeSala = (salaId: string) => {
    setSelectedSalas(prev => prev.filter(id => id !== salaId))
  }

  const canManageProfessores = user?.role === 'admin' || user?.role === 'admin_igreja'

  if (!canManageProfessores) {
    return (
      <div className="text-center py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para gerenciar professores. Apenas administradores podem acessar esta funcionalidade.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <GraduationCap className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Professores</h1>
            <p className="text-gray-600">Cadastre professores e associe a múltiplas salas da EBD</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingProfessor ? 'Editar Professor' : 'Novo Professor'}
              </DialogTitle>
              <DialogDescription>
                {editingProfessor 
                  ? 'Edite as informações do professor e suas salas'
                  : 'Cadastre um novo professor e associe a múltiplas salas da EBD'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo do professor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  required
                />
              </div>

              {/* Seleção de Igreja - apenas para Admin Principal */}
              {user?.role === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="igreja">Igreja *</Label>
                  <Select 
                    value={formData.igreja_id} 
                    onValueChange={handleIgrejaChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma igreja" />
                    </SelectTrigger>
                    <SelectContent>
                      {igrejas.map((igreja) => (
                        <SelectItem key={igreja.id} value={igreja.id}>
                          {igreja.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Selecione primeiro a igreja para ver as salas disponíveis
                  </p>
                </div>
              )}

              {/* Seleção Múltipla de Salas */}
              <div className="space-y-2">
                <Label>Salas da EBD *</Label>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                  {getSalasDisponiveis().length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {user?.role === 'admin' && !formData.igreja_id 
                        ? 'Selecione uma igreja primeiro para ver as salas disponíveis'
                        : 'Nenhuma sala ativa encontrada. Cadastre salas primeiro.'
                      }
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Selecione uma ou mais salas (todas as salas da igreja estão disponíveis):
                      </div>
                      {getSalasDisponiveis().map((sala) => {
                        const isSelected = selectedSalas.includes(sala.id)
                        const outrosProfessores = salas.find(s => s.id === sala.id)?.professores_ids?.filter(id => id !== editingProfessor?.id) || []
                        
                        return (
                          <div key={sala.id} className={cn(
                            "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                            isSelected ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                          )}>
                            <input
                              type="checkbox"
                              id={`sala-${sala.id}`}
                              checked={isSelected}
                              onChange={() => toggleSala(sala.id)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <Label htmlFor={`sala-${sala.id}`} className="text-sm font-medium cursor-pointer">
                                {sala.nome}
                                {sala.faixa_etaria && (
                                  <span className="text-gray-500 ml-1">({sala.faixa_etaria})</span>
                                )}
                              </Label>
                              {outrosProfessores.length > 0 && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Já possui {outrosProfessores.length} outro(s) professor(es)
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                
                {/* Salas Selecionadas */}
                {selectedSalas.length > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-green-800 mb-2">
                      Salas selecionadas ({selectedSalas.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSalas.map(salaId => {
                        const sala = salas.find(s => s.id === salaId)
                        return sala ? (
                          <Badge key={salaId} variant="secondary" className="bg-green-100 text-green-800">
                            {sala.nome}
                            <button
                              type="button"
                              onClick={() => removeSala(salaId)}
                              className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  <School className="h-4 w-4 text-blue-600" />
                  <span>
                    {selectedSalas.length === 0 ? 'Nenhuma sala selecionada' :
                     selectedSalas.length === 1 ? '1 sala selecionada' :
                     `${selectedSalas.length} salas selecionadas`}
                  </span>
                </div>
              </div>

              {/* Seção de Acesso ao Sistema */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Acesso ao Sistema</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Acesso *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Email usado para fazer login no sistema
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha">
                      {editingProfessor ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        placeholder={editingProfessor ? "Nova senha (opcional)" : "Senha de acesso"}
                        required={!editingProfessor}
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Mínimo de 6 caracteres
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações de Contato */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações de Contato</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Endereço completo"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="ativo" className="font-medium">Professor Ativo</Label>
                  <p className="text-sm text-gray-500">Professor disponível para lecionar</p>
                </div>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    editingProfessor ? 'Salvar Alterações' : 'Cadastrar Professor'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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

      {/* Lista de Professores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professores.map((professor) => {
          const salasNomes = getSalasNomes(professor.id)
          
          return (
            <Card key={professor.id} className={`hover:shadow-lg transition-shadow ${!professor.ativo ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <GraduationCap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">{professor.nome}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {salasNomes.length === 0 ? 'Sem salas vinculadas' :
                         salasNomes.length === 1 ? salasNomes[0] :
                         `${salasNomes.length} salas`}
                        {user?.role === 'admin' && (
                          <span className="block text-xs text-blue-600">
                            {getIgrejaNome(professor.igreja_id)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={professor.ativo ? 'default' : 'secondary'}>
                    {professor.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Salas do Professor */}
                {salasNomes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <School className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">
                        {salasNomes.length === 1 ? 'Sala' : 'Salas'}:
                      </span>
                      {salasNomes.length > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          Múltiplas
                        </Badge>
                      )}
                    </div>
                    
                    <div className="ml-6 space-y-1 bg-gray-50 p-2 rounded-lg">
                      {salasNomes.map((nome, index) => (
                        <div key={index} className="text-xs text-gray-700 flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>{nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {professor.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{professor.email}</span>
                  </div>
                )}
                
                {professor.telefone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{professor.telefone}</span>
                  </div>
                )}
                
                {professor.data_nascimento && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{calculateAge(professor.data_nascimento)} anos</span>
                  </div>
                )}

                {professor.endereco && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{professor.endereco}</p>
                )}
                
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Cadastrado em {new Date(professor.created_at).toLocaleDateString('pt-BR')}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(professor)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(professor)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {professores.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum professor encontrado</h3>
                <p className="text-gray-600 mb-4">Comece cadastrando o primeiro professor da EBD</p>
                <Button 
                  onClick={() => setDialogOpen(true)} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Professor
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}