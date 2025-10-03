'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
// // // // // // // // // // // // import { api } from '@/lib/api' // Removido para evitar erro de build // Removido para evitar erro de build // Removido para evitar erro de build // Removido para evitar erro de build // Removido para evitar erro de build // Removido para evitar erro de build // Removido para evitar erro de build // Removido para evitar erro de build // Removido para evitar erro de build // Removido para evitar erro de build // Removido para evitar erro de build // Removido para evitar erro de build
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, School, Users, GraduationCap, AlertCircle, Trash2, CheckCircle, X } from 'lucide-react'
import { Sala, Professor } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SalaManagement() {
  const { user } = useAuth()
  const [salas, setSalas] = useState<Sala[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSala, setEditingSala] = useState<Sala | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedProfessores, setSelectedProfessores] = useState<string[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    faixa_etaria: '',
    descricao: '',
    ativa: true
  })

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do localStorage
      const salasStorage = localStorage.getItem('salas')
      const professoresStorage = localStorage.getItem('professores')
      
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
      showMessage('error', 'Nome da sala é obrigatório')
      return
    }

    try {
      setSaving(true)
      
      const salaData = {
        id: editingSala?.id || Date.now().toString(),
        ...formData,
        professor_id: selectedProfessores.length > 0 ? selectedProfessores[0] : '', // Compatibilidade
        professores_ids: selectedProfessores,
        igreja_id: user?.igreja_id || '',
        created_at: editingSala?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Salvar no localStorage
      const salasStorage = localStorage.getItem('salas')
      let salasArray = salasStorage ? JSON.parse(salasStorage) : []

      if (editingSala) {
        // Atualizar sala existente
        salasArray = salasArray.map((s: Sala) => s.id === editingSala.id ? salaData : s)
        setSalas(prev => prev.map(s => s.id === editingSala.id ? salaData : s))
        showMessage('success', `Sala "${salaData.nome}" atualizada com sucesso! ${selectedProfessores.length > 1 ? `${selectedProfessores.length} professores` : selectedProfessores.length === 1 ? '1 professor' : 'Nenhum professor'} associado(s).`)
      } else {
        // Criar nova sala
        salasArray.push(salaData)
        setSalas(prev => [...prev, salaData])
        showMessage('success', `Sala "${salaData.nome}" cadastrada com sucesso! ${selectedProfessores.length > 1 ? `${selectedProfessores.length} professores` : selectedProfessores.length === 1 ? '1 professor' : 'Nenhum professor'} associado(s).`)
      }

      localStorage.setItem('salas', JSON.stringify(salasArray))

      // Atualizar professores com a nova sala
      if (selectedProfessores.length > 0) {
        const professoresStorage = localStorage.getItem('professores')
        if (professoresStorage) {
          const professoresArray = JSON.parse(professoresStorage)
          const professoresAtualizados = professoresArray.map((p: Professor) => {
            if (selectedProfessores.includes(p.id)) {
              return { ...p, sala_id: salaData.id, updated_at: new Date().toISOString() }
            }
            // Se estava editando, remover professor da sala anterior se não está mais selecionado
            if (editingSala && p.sala_id === editingSala.id && !selectedProfessores.includes(p.id)) {
              return { ...p, sala_id: '', updated_at: new Date().toISOString() }
            }
            return p
          })
          localStorage.setItem('professores', JSON.stringify(professoresAtualizados))
          setProfessores(prev => prev.map(p => {
            if (selectedProfessores.includes(p.id)) {
              return { ...p, sala_id: salaData.id }
            }
            if (editingSala && p.sala_id === editingSala.id && !selectedProfessores.includes(p.id)) {
              return { ...p, sala_id: '' }
            }
            return p
          }))
        }
      }
      
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar sala:', error)
      showMessage('error', 'Erro ao salvar sala. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (sala: Sala) => {
    setEditingSala(sala)
    setFormData({
      nome: sala.nome,
      faixa_etaria: sala.faixa_etaria || '',
      descricao: sala.descricao || '',
      ativa: sala.ativa
    })
    
    // Carregar professores da sala
    const professoresDaSala = professores
      .filter(p => p.sala_id === sala.id)
      .map(p => p.id)
    setSelectedProfessores(professoresDaSala)
    
    setDialogOpen(true)
  }

  const handleDelete = async (sala: Sala) => {
    const professoresDaSala = professores.filter(p => p.sala_id === sala.id)
    const confirmMessage = professoresDaSala.length > 0 
      ? `Tem certeza que deseja excluir a sala "${sala.nome}"?\n\nEsta sala possui ${professoresDaSala.length} professor(es) associado(s) que serão desvinculados.\n\nEsta ação não pode ser desfeita e removerá todos os dados relacionados.`
      : `Tem certeza que deseja excluir a sala "${sala.nome}"?\n\nEsta ação não pode ser desfeita e removerá todos os dados relacionados.`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      // Remover do localStorage
      const salasStorage = localStorage.getItem('salas')
      if (salasStorage) {
        const salasArray = JSON.parse(salasStorage)
        const salasAtualizadas = salasArray.filter((s: Sala) => s.id !== sala.id)
        localStorage.setItem('salas', JSON.stringify(salasAtualizadas))
        
        // Remover alunos da sala
        const alunosStorage = localStorage.getItem('alunos')
        if (alunosStorage) {
          const alunosArray = JSON.parse(alunosStorage)
          const alunosAtualizados = alunosArray.map((a: any) => 
            a.sala_id === sala.id ? { ...a, ativo: false, updated_at: new Date().toISOString() } : a
          )
          localStorage.setItem('alunos', JSON.stringify(alunosAtualizados))
        }

        // Remover professores da sala
        const professoresStorage = localStorage.getItem('professores')
        if (professoresStorage) {
          const professoresArray = JSON.parse(professoresStorage)
          const professoresAtualizados = professoresArray.map((p: Professor) => 
            p.sala_id === sala.id ? { ...p, sala_id: '', updated_at: new Date().toISOString() } : p
          )
          localStorage.setItem('professores', JSON.stringify(professoresAtualizados))
          setProfessores(prev => prev.map(p => 
            p.sala_id === sala.id ? { ...p, sala_id: '' } : p
          ))
        }
        
        setSalas(prev => prev.filter(s => s.id !== sala.id))
        showMessage('success', `Sala "${sala.nome}" removida com sucesso! ${professoresDaSala.length > 0 ? `${professoresDaSala.length} professor(es) desvinculado(s).` : ''}`)
      }
    } catch (error) {
      console.error('Erro ao remover sala:', error)
      showMessage('error', 'Erro ao remover sala. Tente novamente.')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      faixa_etaria: '',
      descricao: '',
      ativa: true
    })
    setSelectedProfessores([])
    setEditingSala(null)
  }

  const getProfessoresNomes = (sala: Sala) => {
    const professoresDaSala = professores.filter(p => p.sala_id === sala.id)
    if (professoresDaSala.length === 0) return 'Sem professores'
    if (professoresDaSala.length === 1) return professoresDaSala[0].nome
    return `${professoresDaSala.length} professores`
  }

  const toggleProfessor = (professorId: string) => {
    setSelectedProfessores(prev => 
      prev.includes(professorId)
        ? prev.filter(id => id !== professorId)
        : [...prev, professorId]
    )
  }

  const canManageSalas = user?.role === 'admin' || user?.role === 'admin_igreja'

  if (!canManageSalas) {
    return (
      <div className="text-center py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para gerenciar salas. Apenas administradores podem acessar esta funcionalidade.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <School className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Salas</h1>
            <p className="text-gray-600">Cadastre e organize as salas da EBD com múltiplos professores</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Sala
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingSala ? 'Editar Sala' : 'Nova Sala'}
              </DialogTitle>
              <DialogDescription>
                {editingSala 
                  ? 'Edite as informações da sala e seus professores'
                  : 'Cadastre uma nova sala da EBD e associe professores'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Sala *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Juvenis, Adultos, Crianças..."
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faixa_etaria">Faixa Etária</Label>
                <Input
                  id="faixa_etaria"
                  placeholder="Ex: 12-17 anos, 18+ anos..."
                  value={formData.faixa_etaria}
                  onChange={(e) => setFormData({ ...formData, faixa_etaria: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Professores da Sala</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  {professores.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum professor cadastrado. Cadastre professores primeiro para associá-los às salas.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Selecione um ou mais professores:
                      </div>
                      {professores.map((professor) => {
                        const isSelected = selectedProfessores.includes(professor.id)
                        const isAssignedToOtherRoom = professor.sala_id && professor.sala_id !== editingSala?.id
                        
                        return (
                          <div key={professor.id} className={cn(
                            "flex items-center space-x-3 p-2 rounded-lg border transition-colors",
                            isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200",
                            isAssignedToOtherRoom && !isSelected ? "opacity-60" : ""
                          )}>
                            <input
                              type="checkbox"
                              id={`prof-${professor.id}`}
                              checked={isSelected}
                              onChange={() => toggleProfessor(professor.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <Label htmlFor={`prof-${professor.id}`} className="text-sm font-medium cursor-pointer">
                                {professor.nome}
                              </Label>
                              {isAssignedToOtherRoom && !isSelected && (
                                <p className="text-xs text-amber-600">
                                  Já associado a outra sala
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <span>
                    {selectedProfessores.length === 0 ? 'Nenhum professor selecionado' :
                     selectedProfessores.length === 1 ? '1 professor selecionado' :
                     `${selectedProfessores.length} professores selecionados`}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição da sala (opcional)"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="ativa" className="font-medium">Sala Ativa</Label>
                  <p className="text-sm text-gray-500">Sala disponível para uso</p>
                </div>
                <Switch
                  id="ativa"
                  checked={formData.ativa}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    editingSala ? 'Salvar Alterações' : 'Cadastrar Sala'
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

      {/* Lista de Salas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {salas.map((sala) => {
          const professoresDaSala = professores.filter(p => p.sala_id === sala.id)
          
          return (
            <Card key={sala.id} className={`hover:shadow-lg transition-shadow ${!sala.ativa ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <School className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">{sala.nome}</CardTitle>
                      {sala.faixa_etaria && (
                        <CardDescription className="text-gray-600">{sala.faixa_etaria}</CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant={sala.ativa ? 'default' : 'secondary'}>
                    {sala.ativa ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">
                      {professoresDaSala.length === 0 ? 'Sem professores' : 
                       professoresDaSala.length === 1 ? '1 professor' :
                       `${professoresDaSala.length} professores`}
                    </span>
                    {professoresDaSala.length > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        Múltiplos
                      </Badge>
                    )}
                  </div>
                  
                  {professoresDaSala.length > 0 && (
                    <div className="ml-6 space-y-1 bg-gray-50 p-2 rounded-lg">
                      {professoresDaSala.map(prof => (
                        <div key={prof.id} className="text-xs text-gray-700 flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>{prof.nome}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {sala.descricao && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{sala.descricao}</p>
                )}
                
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Criada em {new Date(sala.created_at).toLocaleDateString('pt-BR')}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(sala)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(sala)}
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

        {salas.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-8">
                <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma sala encontrada</h3>
                <p className="text-gray-600 mb-4">Comece cadastrando a primeira sala da EBD com seus professores</p>
                <Button 
                  onClick={() => setDialogOpen(true)} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Sala
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}