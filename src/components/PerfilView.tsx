'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Edit, Mail, Phone, Calendar, Church, GraduationCap, Users, Crown, Shield, BookOpen, CheckCircle, AlertCircle } from 'lucide-react'
import { Igreja, Sala, Professor } from '@/lib/types'
import { cn } from '@/lib/utils'

export function PerfilView() {
  const { user, logout } = useAuth()
  const [igreja, setIgreja] = useState<Igreja | null>(null)
  const [salas, setSalas] = useState<Sala[]>([])
  const [professor, setProfessor] = useState<Professor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || ''
  })

  useEffect(() => {
    loadProfileData()
  }, [user])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do localStorage
      if (user?.igreja_id) {
        const igrejasStorage = localStorage.getItem('igrejas')
        if (igrejasStorage) {
          const igrejasData = JSON.parse(igrejasStorage)
          const igrejaData = igrejasData.find((i: Igreja) => i.id === user.igreja_id)
          setIgreja(igrejaData || null)
        }
      }

      if (user?.role === 'professor') {
        const professoresStorage = localStorage.getItem('professores')
        if (professoresStorage) {
          const professoresData = JSON.parse(professoresStorage)
          const professorData = professoresData.find((p: Professor) => p.user_id === user.id)
          if (professorData) {
            setProfessor(professorData)
            
            const salasStorage = localStorage.getItem('salas')
            if (salasStorage) {
              const salasData = JSON.parse(salasStorage)
              const minhasSalas = salasData.filter((s: Sala) => s.professor_id === professorData.id)
              setSalas(minhasSalas)
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      showMessage('error', 'Erro ao carregar dados do perfil')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim() || !formData.email.trim()) {
      showMessage('error', 'Nome e email são obrigatórios')
      return
    }

    try {
      setSaving(true)
      
      if (user) {
        // Atualizar no localStorage
        const usersStorage = localStorage.getItem('users')
        if (usersStorage) {
          const usersData = JSON.parse(usersStorage)
          const updatedUsers = usersData.map((u: any) => 
            u.id === user.id 
              ? { ...u, ...formData, updated_at: new Date().toISOString() }
              : u
          )
          localStorage.setItem('users', JSON.stringify(updatedUsers))
          
          // Atualizar usuário atual
          const updatedUser = { ...user, ...formData, updated_at: new Date().toISOString() }
          localStorage.setItem('currentUser', JSON.stringify(updatedUser))
          
          setEditDialogOpen(false)
          showMessage('success', 'Perfil atualizado com sucesso!')
          
          // Recarregar página após um pequeno delay para mostrar a mensagem
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      showMessage('error', 'Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'Administrador Principal',
          icon: Crown,
          color: 'bg-yellow-100 text-yellow-800',
          description: 'Acesso total ao sistema'
        }
      case 'admin_igreja':
        return {
          title: 'AdminIgreja',
          icon: Shield,
          color: 'bg-blue-100 text-blue-800',
          description: 'Gerencia uma igreja específica'
        }
      case 'professor':
        return {
          title: 'Professor da EBD',
          icon: BookOpen,
          color: 'bg-green-100 text-green-800',
          description: 'Leciona em salas da EBD'
        }
      case 'aluno':
        return {
          title: 'Aluno da EBD',
          icon: User,
          color: 'bg-purple-100 text-purple-800',
          description: 'Participa das aulas'
        }
      default:
        return {
          title: 'Usuário',
          icon: User,
          color: 'bg-gray-100 text-gray-800',
          description: 'Usuário do sistema'
        }
    }
  }

  const roleInfo = getRoleInfo()
  const RoleIcon = roleInfo.icon

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600">Gerencie suas informações pessoais e configurações</p>
          </div>
        </div>
        
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Editar Perfil</DialogTitle>
              <DialogDescription>
                Atualize suas informações pessoais
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
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
                    'Salvar Alterações'
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

      {/* Informações do Usuário */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center text-xl">
            <User className="mr-3 h-6 w-6 text-blue-600" />
            Informações Pessoais
          </CardTitle>
          <CardDescription className="text-base">
            Seus dados principais no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${roleInfo.color.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                <RoleIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{user?.nome}</p>
                <p className="text-gray-600 flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2" />
                  {user?.email}
                </p>
              </div>
            </div>
            <Badge className={`${roleInfo.color} px-3 py-1 text-sm font-medium`}>
              {roleInfo.title}
            </Badge>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800 mb-1">Tipo de Acesso</p>
            <p className="text-blue-700">{roleInfo.description}</p>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Membro desde: {new Date(user?.created_at || '').toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Igreja */}
      {igreja && (
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="flex items-center text-xl">
              <Church className="mr-3 h-6 w-6 text-green-600" />
              Igreja Vinculada
            </CardTitle>
            <CardDescription className="text-base">
              Informações da sua igreja
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="font-bold text-gray-900 text-lg">{igreja.nome}</p>
              <p className="text-gray-600 mt-1">{igreja.endereco}</p>
              <p className="text-gray-600">{igreja.cidade}, {igreja.estado} - {igreja.cep}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {igreja.telefone && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Telefone</p>
                    <p className="text-gray-600">{igreja.telefone}</p>
                  </div>
                </div>
              )}
              
              {igreja.email && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-gray-600">{igreja.email}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações do Professor */}
      {user?.role === 'professor' && professor && (
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center text-xl">
              <GraduationCap className="mr-3 h-6 w-6 text-purple-600" />
              Informações de Professor
            </CardTitle>
            <CardDescription className="text-base">
              Suas responsabilidades como professor
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{professor.nome}</p>
                {professor.data_nascimento && (
                  <p className="text-gray-600 mt-1">
                    Nascimento: {new Date(professor.data_nascimento).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              
              {professor.telefone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">{professor.telefone}</span>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
              <p className="font-medium text-indigo-800 mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Salas que leciona:
              </p>
              {salas.length === 0 ? (
                <p className="text-indigo-700">Nenhuma sala atribuída</p>
              ) : (
                <div className="space-y-2">
                  {salas.map((sala) => (
                    <div key={sala.id} className="flex items-center p-2 bg-white rounded border border-indigo-100">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3">
                        <Users className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{sala.nome}</span>
                        {sala.faixa_etaria && (
                          <span className="text-gray-600 ml-2">({sala.faixa_etaria})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Configurações da Conta</CardTitle>
          <CardDescription className="text-base">
            Gerencie sua conta e preferências
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
              <div>
                <p className="font-semibold text-red-900 text-lg">Sair da Conta</p>
                <p className="text-red-700">Desconectar-se do sistema EBD Digital Pro</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 px-6 py-2"
              >
                Sair do Sistema
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}