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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Trash2, Users, Shield, GraduationCap, User, Crown, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { User as UserType, Igreja } from '@/lib/types'
import { cn } from '@/lib/utils'

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserType[]>([])
  const [igrejas, setIgrejas] = useState<Igreja[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'admin_igreja' as UserType['role'],
    igreja_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do localStorage
      const usersStorage = localStorage.getItem('users')
      const igrejasStorage = localStorage.getItem('igrejas')
      
      if (usersStorage) {
        const usersData = JSON.parse(usersStorage)
        setUsers(usersData)
      }
      
      if (igrejasStorage) {
        const igrejasData = JSON.parse(igrejasStorage)
        setIgrejas(igrejasData)
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

    if (!formData.email.trim()) {
      showMessage('error', 'Email é obrigatório')
      return
    }

    if (!formData.email.includes('@')) {
      showMessage('error', 'Email deve ter um formato válido')
      return
    }

    if (!editingUser && !formData.senha.trim()) {
      showMessage('error', 'Senha é obrigatória para novos usuários')
      return
    }

    if (formData.senha && formData.senha.length < 6) {
      showMessage('error', 'Senha deve ter pelo menos 6 caracteres')
      return
    }

    if (!formData.igreja_id && formData.role === 'admin_igreja') {
      showMessage('error', 'Selecione uma igreja para o AdminIgreja')
      return
    }

    try {
      setSaving(true)
      
      const userData = {
        id: editingUser?.id || Date.now().toString(),
        ...formData,
        // Manter senha anterior se não foi alterada
        senha: formData.senha || editingUser?.senha || '',
        ativo: true,
        created_at: editingUser?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Salvar no localStorage
      const usersStorage = localStorage.getItem('users')
      let usersArray = usersStorage ? JSON.parse(usersStorage) : []

      if (editingUser) {
        // Atualizar usuário existente
        usersArray = usersArray.map((u: UserType) => u.id === editingUser.id ? userData : u)
        setUsers(prev => prev.map(u => u.id === editingUser.id ? userData : u))
        showMessage('success', 'Usuário atualizado com sucesso!')
      } else {
        // Verificar se email já existe
        const emailExists = usersArray.some((u: UserType) => u.email === formData.email)
        if (emailExists) {
          showMessage('error', 'Este email já está sendo usado por outro usuário')
          return
        }

        // Criar novo usuário
        usersArray.push(userData)
        setUsers(prev => [...prev, userData])
        showMessage('success', 'Usuário cadastrado com sucesso! Credenciais de acesso criadas.')
      }

      localStorage.setItem('users', JSON.stringify(usersArray))
      
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      showMessage('error', 'Erro ao salvar usuário. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (user: UserType) => {
    setEditingUser(user)
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '', // Não mostrar senha atual
      role: user.role,
      igreja_id: user.igreja_id || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId)
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userToDelete?.nome}"?\n\nEsta ação não pode ser desfeita e removerá:\n- O acesso ao sistema\n- Todos os dados relacionados`)) {
      return
    }

    try {
      // Remover do localStorage
      const usersStorage = localStorage.getItem('users')
      if (usersStorage) {
        const usersArray = JSON.parse(usersStorage)
        const usersAtualizados = usersArray.filter((u: UserType) => u.id !== userId)
        localStorage.setItem('users', JSON.stringify(usersAtualizados))
        
        setUsers(prev => prev.filter(u => u.id !== userId))
        showMessage('success', 'Usuário removido com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      showMessage('error', 'Erro ao remover usuário. Tente novamente.')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      role: 'admin_igreja',
      igreja_id: ''
    })
    setEditingUser(null)
    setShowPassword(false)
  }

  const getRoleIcon = (role: UserType['role']) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />
      case 'admin_igreja':
        return <Shield className="h-4 w-4" />
      case 'professor':
        return <GraduationCap className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: UserType['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrador Principal'
      case 'admin_igreja':
        return 'AdminIgreja'
      case 'professor':
        return 'Professor'
      case 'aluno':
        return 'Aluno'
      default:
        return 'Usuário'
    }
  }

  const getRoleBadgeVariant = (role: UserType['role']) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'admin_igreja':
        return 'default'
      case 'professor':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleColor = (role: UserType['role']) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-600 bg-yellow-50'
      case 'admin_igreja':
        return 'text-blue-600 bg-blue-50'
      case 'professor':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta área. Apenas administradores principais podem gerenciar usuários.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600 text-lg">Cadastre AdminIgreja que poderão gerenciar suas igrejas</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Novo AdminIgreja
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingUser ? 'Editar Usuário' : 'Novo AdminIgreja'}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'Edite as informações do usuário'
                  : 'Cadastre um novo AdminIgreja que poderá gerenciar uma igreja específica'
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
                  placeholder="Nome completo do usuário"
                  required
                />
              </div>

              {/* Seção de Acesso ao Sistema */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Acesso ao Sistema</h3>
                
                <div className="space-y-4">
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
                      {editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        placeholder={editingUser ? "Nova senha (opcional)" : "Senha de acesso"}
                        required={!editingUser}
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

              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuário</Label>
                <Select value={formData.role} onValueChange={(value: UserType['role']) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_igreja">AdminIgreja</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  AdminIgreja pode cadastrar professores e gerenciar sua igreja
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="igreja">Igreja *</Label>
                <Select value={formData.igreja_id} onValueChange={(value) => setFormData({ ...formData, igreja_id: value })}>
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
                  Igreja que este AdminIgreja irá gerenciar
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    editingUser ? 'Salvar Alterações' : 'Cadastrar AdminIgreja'
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

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{user.nome}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.igreja_id && (
                      <p className="text-xs text-gray-500 mt-1">
                        Igreja: {igrejas.find(i => i.id === user.igreja_id)?.nome}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="px-3 py-1">
                    {getRoleLabel(user.role)}
                  </Badge>
                  
                  {user.id !== currentUser?.id && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        ))}

        {users.filter(u => u.role !== 'admin').length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-3">Nenhum AdminIgreja encontrado</h3>
              <p className="text-gray-600 mb-6 text-lg">Comece cadastrando o primeiro AdminIgreja do sistema</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeiro AdminIgreja
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hierarquia do Sistema */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Shield className="mr-3 h-6 w-6" />
            Hierarquia do Sistema
          </CardTitle>
          <CardDescription className="text-blue-700">
            Entenda como funciona a estrutura de permissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <Crown className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">Administrador Principal</p>
              <p className="text-sm text-yellow-700">Você - Gerencia todo o sistema e cadastra AdminIgreja</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-800">AdminIgreja</p>
              <p className="text-sm text-blue-700">Gerencia uma igreja específica e cadastra professores com acesso</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <GraduationCap className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Professor</p>
              <p className="text-sm text-green-700">Acessa apenas sua sala para chamadas e relatórios</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}