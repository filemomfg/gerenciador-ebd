'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Church, MapPin, Phone, Mail, Settings, Trash2, CheckCircle, AlertCircle, Upload, Image } from 'lucide-react'
import { Igreja } from '@/lib/types'
import { cn } from '@/lib/utils'

export function IgrejaManagement() {
  const { user } = useAuth()
  const [igrejas, setIgrejas] = useState<Igreja[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIgreja, setEditingIgreja] = useState<Igreja | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    logo_url: '',
    configuracoes: {
      contabiliza_capitulos: true,
      contabiliza_atividades: true,
      contabiliza_visitantes: true,
      dias_chamada: ['domingo'],
      meta_capitulos_semana: 7
    }
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadIgrejas()
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const loadIgrejas = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do localStorage
      const igrejasStorage = localStorage.getItem('igrejas')
      if (igrejasStorage) {
        const igrejasData = JSON.parse(igrejasStorage)
        
        // Filtrar igrejas baseado no perfil do usuário
        if (user?.role === 'admin_igreja' && user.igreja_id) {
          setIgrejas(igrejasData.filter((igreja: Igreja) => igreja.id === user.igreja_id))
        } else {
          setIgrejas(igrejasData)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar igrejas:', error)
      showMessage('error', 'Erro ao carregar dados das igrejas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nome.trim()) {
      setError('Nome da igreja é obrigatório')
      return
    }

    try {
      const igrejaData = {
        ...formData,
        admin_id: user?.id || '',
        id: editingIgreja?.id || Date.now().toString(),
        created_at: editingIgreja?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Salvar no localStorage
      const igrejasStorage = localStorage.getItem('igrejas')
      let igrejasArray = igrejasStorage ? JSON.parse(igrejasStorage) : []

      if (editingIgreja) {
        // Atualizar igreja existente
        igrejasArray = igrejasArray.map((i: Igreja) => i.id === editingIgreja.id ? igrejaData : i)
        setIgrejas(prev => prev.map(i => i.id === editingIgreja.id ? igrejaData : i))
        showMessage('success', 'Igreja atualizada com sucesso!')
      } else {
        // Criar nova igreja
        igrejasArray.push(igrejaData)
        setIgrejas(prev => [...prev, igrejaData])
        showMessage('success', 'Igreja cadastrada com sucesso!')
      }

      localStorage.setItem('igrejas', JSON.stringify(igrejasArray))
      
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      setError('Erro ao salvar igreja')
      showMessage('error', 'Erro ao salvar igreja. Tente novamente.')
    }
  }

  const handleEdit = (igreja: Igreja) => {
    setEditingIgreja(igreja)
    setFormData({
      nome: igreja.nome,
      endereco: igreja.endereco,
      cidade: igreja.cidade,
      estado: igreja.estado,
      cep: igreja.cep,
      telefone: igreja.telefone || '',
      email: igreja.email || '',
      logo_url: igreja.logo_url || '',
      configuracoes: igreja.configuracoes
    })
    setDialogOpen(true)
  }

  const handleDelete = async (igreja: Igreja) => {
    if (!confirm(`Tem certeza que deseja excluir a igreja "${igreja.nome}"?\n\nEsta ação não pode ser desfeita e removerá:\n- A igreja do sistema\n- Todas as salas vinculadas\n- Todos os professores e alunos\n- Todos os dados relacionados`)) {
      return
    }

    try {
      // Remover do localStorage
      const igrejasStorage = localStorage.getItem('igrejas')
      if (igrejasStorage) {
        const igrejasArray = JSON.parse(igrejasStorage)
        const igrejasAtualizadas = igrejasArray.filter((i: Igreja) => i.id !== igreja.id)
        localStorage.setItem('igrejas', JSON.stringify(igrejasAtualizadas))
        
        // Remover salas da igreja
        const salasStorage = localStorage.getItem('salas')
        if (salasStorage) {
          const salasArray = JSON.parse(salasStorage)
          const salasAtualizadas = salasArray.filter((s: any) => s.igreja_id !== igreja.id)
          localStorage.setItem('salas', JSON.stringify(salasAtualizadas))
        }

        // Remover professores da igreja
        const professoresStorage = localStorage.getItem('professores')
        if (professoresStorage) {
          const professoresArray = JSON.parse(professoresStorage)
          const professoresAtualizados = professoresArray.filter((p: any) => p.igreja_id !== igreja.id)
          localStorage.setItem('professores', JSON.stringify(professoresAtualizados))
        }

        // Remover alunos da igreja
        const alunosStorage = localStorage.getItem('alunos')
        if (alunosStorage) {
          const alunosArray = JSON.parse(alunosStorage)
          const alunosAtualizados = alunosArray.map((a: any) => 
            a.igreja_id === igreja.id ? { ...a, ativo: false, updated_at: new Date().toISOString() } : a
          )
          localStorage.setItem('alunos', JSON.stringify(alunosAtualizados))
        }

        // Remover usuários da igreja
        const usersStorage = localStorage.getItem('users')
        if (usersStorage) {
          const usersArray = JSON.parse(usersStorage)
          const usersAtualizados = usersArray.filter((u: any) => u.igreja_id !== igreja.id)
          localStorage.setItem('users', JSON.stringify(usersAtualizados))
        }
        
        setIgrejas(prev => prev.filter(i => i.id !== igreja.id))
        showMessage('success', 'Igreja removida com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao remover igreja:', error)
      showMessage('error', 'Erro ao remover igreja. Tente novamente.')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      telefone: '',
      email: '',
      logo_url: '',
      configuracoes: {
        contabiliza_capitulos: true,
        contabiliza_atividades: true,
        contabiliza_visitantes: true,
        dias_chamada: ['domingo'],
        meta_capitulos_semana: 7
      }
    })
    setEditingIgreja(null)
    setError('')
  }

  const canCreateIgreja = user?.role === 'admin' || (user?.role === 'admin_igreja' && igrejas.length === 0)
  const canDeleteIgreja = user?.role === 'admin'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Igrejas</h1>
          <p className="text-gray-600">Cadastre e configure as igrejas do sistema</p>
        </div>

        {canCreateIgreja && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Igreja
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingIgreja ? 'Editar Igreja' : 'Nova Igreja'}
                </DialogTitle>
                <DialogDescription>
                  {editingIgreja 
                    ? 'Edite as informações da igreja'
                    : 'Cadastre uma nova igreja no sistema'
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Igreja</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Campo para Logo da Igreja */}
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo da Igreja (URL da imagem)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="logo_url"
                      type="url"
                      placeholder="https://exemplo.com/logo.png"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Cole o link de uma imagem online ou faça upload de uma imagem
                  </p>
                  {formData.logo_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.logo_url} 
                        alt="Preview da logo" 
                        className="h-16 w-16 object-contain rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>

                {/* Configurações da EBD */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium">Configurações da EBD</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="capitulos">Contabilizar Capítulos Lidos</Label>
                        <p className="text-sm text-gray-500">Registrar quantos capítulos cada aluno leu</p>
                      </div>
                      <Switch
                        id="capitulos"
                        checked={formData.configuracoes.contabiliza_capitulos}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData,
                            configuracoes: { ...formData.configuracoes, contabiliza_capitulos: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="atividades">Contabilizar Atividades</Label>
                        <p className="text-sm text-gray-500">Registrar se o aluno fez as atividades</p>
                      </div>
                      <Switch
                        id="atividades"
                        checked={formData.configuracoes.contabiliza_atividades}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData,
                            configuracoes: { ...formData.configuracoes, contabiliza_atividades: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="visitantes">Contabilizar Visitantes</Label>
                        <p className="text-sm text-gray-500">Registrar número de visitantes por sala</p>
                      </div>
                      <Switch
                        id="visitantes"
                        checked={formData.configuracoes.contabiliza_visitantes}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData,
                            configuracoes: { ...formData.configuracoes, contabiliza_visitantes: checked }
                          })
                        }
                      />
                    </div>

                    {formData.configuracoes.contabiliza_capitulos && (
                      <div className="space-y-2">
                        <Label htmlFor="meta">Meta de Capítulos por Semana</Label>
                        <Input
                          id="meta"
                          type="number"
                          min="1"
                          max="50"
                          value={formData.configuracoes.meta_capitulos_semana}
                          onChange={(e) => 
                            setFormData({
                              ...formData,
                              configuracoes: { 
                                ...formData.configuracoes, 
                                meta_capitulos_semana: parseInt(e.target.value) || 7 
                              }
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingIgreja ? 'Salvar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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

      <div className="grid gap-6">
        {igrejas.map((igreja) => (
          <Card key={igreja.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    {igreja.logo_url ? (
                      <img 
                        src={igreja.logo_url} 
                        alt={`Logo ${igreja.nome}`}
                        className="h-5 w-5 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling!.style.display = 'block'
                        }}
                      />
                    ) : null}
                    <Church className={`h-5 w-5 text-blue-600 ${igreja.logo_url ? 'hidden' : ''}`} />
                  </div>
                  <div>
                    <CardTitle>{igreja.nome}</CardTitle>
                    <CardDescription>
                      Cadastrada em {new Date(igreja.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(igreja)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  {canDeleteIgreja && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(igreja)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{igreja.endereco}, {igreja.cidade} - {igreja.estado}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500">CEP:</span>
                    <span>{igreja.cep}</span>
                  </div>
                  {igreja.telefone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{igreja.telefone}</span>
                    </div>
                  )}
                  {igreja.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{igreja.email}</span>
                    </div>
                  )}
                  {igreja.logo_url && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Image className="h-4 w-4 text-gray-500" />
                      <span>Logo configurada</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Configurações da EBD</span>
                  </div>
                  <div className="text-sm space-y-1 ml-6">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${igreja.configuracoes.contabiliza_capitulos ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>Capítulos lidos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${igreja.configuracoes.contabiliza_atividades ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>Atividades</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${igreja.configuracoes.contabiliza_visitantes ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>Visitantes</span>
                    </div>
                    {igreja.configuracoes.contabiliza_capitulos && (
                      <div className="text-xs text-gray-500">
                        Meta: {igreja.configuracoes.meta_capitulos_semana} capítulos/semana
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {igrejas.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Church className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma igreja encontrada</h3>
              <p className="text-gray-600 mb-4">
                {user?.role === 'admin' 
                  ? 'Comece cadastrando a primeira igreja no sistema'
                  : 'Você ainda não tem uma igreja cadastrada'
                }
              </p>
              {canCreateIgreja && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Igreja
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}