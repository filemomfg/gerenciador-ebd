'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, Plus, Calendar, Users, School, Church, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import { Aviso, Sala, Igreja } from '@/lib/types'
import { cn } from '@/lib/utils'

export function AvisosView() {
  const { user } = useAuth()
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [salas, setSalas] = useState<Sala[]>([])
  const [igrejas, setIgrejas] = useState<Igreja[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    tipo: 'geral' as 'geral' | 'igreja' | 'sala',
    igreja_id: '',
    sala_id: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: ''
  })

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar avisos do localStorage
      const avisosStorage = localStorage.getItem('avisos')
      if (avisosStorage) {
        const avisosData = JSON.parse(avisosStorage)
        let avisosFiltered = avisosData.filter((a: Aviso) => a.ativo)
        
        // Filtrar baseado no perfil do usuário
        if (user?.role === 'admin_igreja' || user?.role === 'professor') {
          avisosFiltered = avisosFiltered.filter((a: Aviso) => 
            a.igreja_id === user.igreja_id || a.tipo === 'geral'
          )
        }
        
        setAvisos(avisosFiltered)
      }

      // Carregar salas se necessário
      if (user?.role !== 'admin') {
        const salasStorage = localStorage.getItem('salas')
        if (salasStorage) {
          const salasData = JSON.parse(salasStorage)
          const salasIgreja = user?.igreja_id 
            ? salasData.filter((s: Sala) => s.igreja_id === user.igreja_id)
            : salasData
          setSalas(salasIgreja)
        }
      }

      // Carregar igrejas para Admin Principal
      if (user?.role === 'admin') {
        const igrejasStorage = localStorage.getItem('igrejas')
        if (igrejasStorage) {
          const igrejasData = JSON.parse(igrejasStorage)
          setIgrejas(igrejasData)
        }
      }

    } catch (error) {
      console.error('Erro ao carregar avisos:', error)
      showMessage('error', 'Erro ao carregar avisos. Tente novamente.')
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
    
    if (!formData.titulo.trim()) {
      showMessage('error', 'Título é obrigatório')
      return
    }

    if (!formData.conteudo.trim()) {
      showMessage('error', 'Conteúdo é obrigatório')
      return
    }

    // Para Admin Principal enviando para igreja específica
    if (user?.role === 'admin' && formData.tipo === 'igreja' && !formData.igreja_id) {
      showMessage('error', 'Selecione uma igreja para o aviso')
      return
    }

    try {
      const avisoData: Aviso = {
        id: Date.now().toString(),
        titulo: formData.titulo,
        conteudo: formData.conteudo,
        tipo: formData.tipo,
        igreja_id: user?.role === 'admin' && formData.tipo === 'igreja' 
          ? formData.igreja_id 
          : (user?.igreja_id || ''),
        sala_id: formData.tipo === 'sala' ? formData.sala_id : undefined,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim || undefined,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Salvar no localStorage
      const avisosStorage = localStorage.getItem('avisos')
      const avisosArray = avisosStorage ? JSON.parse(avisosStorage) : []
      avisosArray.push(avisoData)
      localStorage.setItem('avisos', JSON.stringify(avisosArray))
      
      setAvisos(prev => [avisoData, ...prev])
      
      showMessage('success', 'Aviso criado com sucesso!')
      
      setFormData({
        titulo: '',
        conteudo: '',
        tipo: 'geral',
        igreja_id: '',
        sala_id: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: ''
      })
      setDialogOpen(false)
    } catch (error) {
      console.error('Erro ao criar aviso:', error)
      showMessage('error', 'Erro ao criar aviso. Tente novamente.')
    }
  }

  const handleDelete = async (aviso: Aviso) => {
    if (!confirm(`Tem certeza que deseja excluir o aviso "${aviso.titulo}"?`)) {
      return
    }

    try {
      // Remover do localStorage
      const avisosStorage = localStorage.getItem('avisos')
      if (avisosStorage) {
        const avisosArray = JSON.parse(avisosStorage)
        const avisosAtualizados = avisosArray.filter((a: Aviso) => a.id !== aviso.id)
        localStorage.setItem('avisos', JSON.stringify(avisosAtualizados))
        
        setAvisos(prev => prev.filter(a => a.id !== aviso.id))
        showMessage('success', 'Aviso removido com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao remover aviso:', error)
      showMessage('error', 'Erro ao remover aviso. Tente novamente.')
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'geral': return 'bg-blue-100 text-blue-800'
      case 'igreja': return 'bg-purple-100 text-purple-800'
      case 'sala': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'geral': return <Bell className="h-4 w-4" />
      case 'igreja': return <Church className="h-4 w-4" />
      case 'sala': return <School className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'geral': return 'Geral'
      case 'igreja': return 'Igreja'
      case 'sala': return 'Sala'
      default: return 'Geral'
    }
  }

  const getIgrejaNome = (igrejaId: string) => {
    const igreja = igrejas.find(i => i.id === igrejaId)
    return igreja?.nome || 'Igreja não encontrada'
  }

  const getSalaNome = (salaId: string) => {
    const sala = salas.find(s => s.id === salaId)
    return sala?.nome || 'Sala não encontrada'
  }

  const canCreateAvisos = user?.role === 'admin' || user?.role === 'admin_igreja' || user?.role === 'professor'
  const canDeleteAvisos = user?.role === 'admin' || user?.role === 'admin_igreja'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Avisos para Igrejas' : 'Avisos e Comunicados'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'Envie comunicados importantes para as igrejas do sistema'
              : 'Gerencie comunicações para a comunidade da EBD'
            }
          </p>
        </div>
        
        {canCreateAvisos && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Aviso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Aviso</DialogTitle>
                <DialogDescription>
                  {user?.role === 'admin' 
                    ? 'Crie um comunicado para enviar às igrejas'
                    : 'Crie um novo comunicado para a comunidade da EBD'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Título do aviso"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conteudo">Conteúdo *</Label>
                  <Textarea
                    id="conteudo"
                    value={formData.conteudo}
                    onChange={(e) => setFormData({...formData, conteudo: e.target.value})}
                    placeholder="Conteúdo do aviso"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value: any) => setFormData({...formData, tipo: value, igreja_id: '', sala_id: ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral (Todas as igrejas)</SelectItem>
                      {user?.role === 'admin' && (
                        <SelectItem value="igreja">Igreja Específica</SelectItem>
                      )}
                      {user?.role !== 'admin' && (
                        <SelectItem value="sala">Sala Específica</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seleção de Igreja - apenas para Admin Principal */}
                {user?.role === 'admin' && formData.tipo === 'igreja' && (
                  <div className="space-y-2">
                    <Label htmlFor="igreja">Igreja *</Label>
                    <Select value={formData.igreja_id} onValueChange={(value) => setFormData({...formData, igreja_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a igreja" />
                      </SelectTrigger>
                      <SelectContent>
                        {igrejas.map((igreja) => (
                          <SelectItem key={igreja.id} value={igreja.id}>
                            {igreja.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Seleção de Sala - para Admin Igreja e Professor */}
                {user?.role !== 'admin' && formData.tipo === 'sala' && (
                  <div className="space-y-2">
                    <Label htmlFor="sala">Sala *</Label>
                    <Select value={formData.sala_id} onValueChange={(value) => setFormData({...formData, sala_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a sala" />
                      </SelectTrigger>
                      <SelectContent>
                        {salas.map((sala) => (
                          <SelectItem key={sala.id} value={sala.id}>
                            {sala.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data de Início *</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data de Fim (opcional)</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({...formData, data_fim: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Criar Aviso
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

      {/* Lista de Avisos */}
      <div className="space-y-4">
        {avisos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum aviso encontrado</h3>
              <p className="text-gray-600">
                {canCreateAvisos 
                  ? 'Crie o primeiro aviso para sua comunidade'
                  : 'Não há avisos ativos no momento'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          avisos.map((aviso) => (
            <Card key={aviso.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {getTipoIcon(aviso.tipo)}
                      {aviso.titulo}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getTipoColor(aviso.tipo)}>
                          {getTipoLabel(aviso.tipo)}
                        </Badge>
                        <span className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(aviso.data_inicio).toLocaleDateString('pt-BR')}
                          {aviso.data_fim && (
                            <> até {new Date(aviso.data_fim).toLocaleDateString('pt-BR')}</>
                          )}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  {canDeleteAvisos && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(aviso)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{aviso.conteudo}</p>
                
                {/* Informações específicas */}
                {aviso.tipo === 'igreja' && aviso.igreja_id && user?.role === 'admin' && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Igreja:</span> {getIgrejaNome(aviso.igreja_id)}
                  </div>
                )}
                
                {aviso.sala_id && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Sala específica:</span> {getSalaNome(aviso.sala_id)}
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-500">
                  Criado em {new Date(aviso.created_at).toLocaleDateString('pt-BR')} às {new Date(aviso.created_at).toLocaleTimeString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}