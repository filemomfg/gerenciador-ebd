'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Igreja, IgrejaConfiguracoes } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Church, 
  Users, 
  BookOpen, 
  Calendar,
  Bell,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function ConfiguracoesView() {
  const { user } = useAuth()
  const [igreja, setIgreja] = useState<Igreja | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Estados para configurações
  const [configuracoes, setConfiguracoes] = useState<IgrejaConfiguracoes>({
    contabiliza_capitulos: true,
    contabiliza_atividades: true,
    contabiliza_visitantes: true,
    dias_chamada: ['domingo'],
    meta_capitulos_semana: 7
  })

  // Estados para informações da igreja
  const [infoIgreja, setInfoIgreja] = useState({
    nome: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: ''
  })

  useEffect(() => {
    loadIgrejaData()
  }, [user])

  const loadIgrejaData = async () => {
    if (!user?.igreja_id) return
    
    try {
      setLoading(true)
      const igrejaData = await api.getIgrejaById(user.igreja_id)
      if (igrejaData) {
        setIgreja(igrejaData)
        setConfiguracoes(igrejaData.configuracoes)
        setInfoIgreja({
          nome: igrejaData.nome,
          endereco: igrejaData.endereco,
          cidade: igrejaData.cidade,
          estado: igrejaData.estado,
          cep: igrejaData.cep,
          telefone: igrejaData.telefone || '',
          email: igrejaData.email || ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados da igreja:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfiguracoes = async () => {
    if (!igreja) return

    try {
      setSaving(true)
      await api.updateIgreja(igreja.id, {
        configuracoes,
        ...infoIgreja
      })
      
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' })
    } finally {
      setSaving(false)
    }
  }

  const toggleDiaChamada = (dia: string) => {
    setConfiguracoes(prev => ({
      ...prev,
      dias_chamada: prev.dias_chamada.includes(dia)
        ? prev.dias_chamada.filter(d => d !== dia)
        : [...prev.dias_chamada, dia]
    }))
  }

  const diasSemana = [
    { key: 'domingo', label: 'Domingo' },
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600">Gerencie as configurações da sua igreja</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSaveConfiguracoes}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={cn(
          "p-4 rounded-lg border flex items-center space-x-2",
          message.type === 'success' 
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        )}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Igreja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Church className="h-5 w-5 text-blue-600" />
              <span>Informações da Igreja</span>
            </CardTitle>
            <CardDescription>
              Dados básicos da sua igreja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Igreja</Label>
              <Input
                id="nome"
                value={infoIgreja.nome}
                onChange={(e) => setInfoIgreja(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome da igreja"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={infoIgreja.endereco}
                onChange={(e) => setInfoIgreja(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Endereço completo"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={infoIgreja.cidade}
                  onChange={(e) => setInfoIgreja(prev => ({ ...prev, cidade: e.target.value }))}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={infoIgreja.estado}
                  onChange={(e) => setInfoIgreja(prev => ({ ...prev, estado: e.target.value }))}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={infoIgreja.cep}
                onChange={(e) => setInfoIgreja(prev => ({ ...prev, cep: e.target.value }))}
                placeholder="00000-000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={infoIgreja.telefone}
                onChange={(e) => setInfoIgreja(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(00) 0000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={infoIgreja.email}
                onChange={(e) => setInfoIgreja(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contato@igreja.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações da EBD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <span>Configurações da EBD</span>
            </CardTitle>
            <CardDescription>
              Configure como a EBD será gerenciada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contabilizações */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Contabilizações</span>
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Capítulos Bíblicos</Label>
                    <p className="text-sm text-gray-500">Contar capítulos lidos pelos alunos</p>
                  </div>
                  <Switch
                    checked={configuracoes.contabiliza_capitulos}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, contabiliza_capitulos: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atividades</Label>
                    <p className="text-sm text-gray-500">Contar atividades realizadas</p>
                  </div>
                  <Switch
                    checked={configuracoes.contabiliza_atividades}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, contabiliza_atividades: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Visitantes</Label>
                    <p className="text-sm text-gray-500">Contar visitantes nas aulas</p>
                  </div>
                  <Switch
                    checked={configuracoes.contabiliza_visitantes}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, contabiliza_visitantes: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Meta de Capítulos */}
            {configuracoes.contabiliza_capitulos && (
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Meta de Capítulos por Semana</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={configuracoes.meta_capitulos_semana || 7}
                  onChange={(e) => 
                    setConfiguracoes(prev => ({ 
                      ...prev, 
                      meta_capitulos_semana: parseInt(e.target.value) || 7 
                    }))
                  }
                />
                <p className="text-sm text-gray-500">
                  Meta semanal de capítulos para os alunos
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dias de Chamada */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span>Dias de Chamada</span>
            </CardTitle>
            <CardDescription>
              Selecione os dias da semana em que há aulas da EBD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {diasSemana.map((dia) => (
                <Button
                  key={dia.key}
                  variant={configuracoes.dias_chamada.includes(dia.key) ? "default" : "outline"}
                  onClick={() => toggleDiaChamada(dia.key)}
                  className={cn(
                    "h-auto py-3 px-2 flex flex-col items-center space-y-1",
                    configuracoes.dias_chamada.includes(dia.key)
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "hover:bg-blue-50"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">{dia.label}</span>
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Dias selecionados: {configuracoes.dias_chamada.length > 0 
                ? configuracoes.dias_chamada.map(d => 
                    diasSemana.find(dia => dia.key === d)?.label
                  ).join(', ')
                : 'Nenhum dia selecionado'
              }
            </p>
          </CardContent>
        </Card>

        {/* Configurações de Segurança */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span>Segurança e Privacidade</span>
            </CardTitle>
            <CardDescription>
              Configurações de segurança dos dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Proteção de Dados</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Todos os dados pessoais (como datas de nascimento) são protegidos e criptografados. 
                    Apenas administradores autorizados têm acesso a informações sensíveis.
                  </p>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-yellow-600">✓ Dados criptografados</p>
                    <p className="text-xs text-yellow-600">✓ Acesso controlado por perfil</p>
                    <p className="text-xs text-yellow-600">✓ Histórico de ações registrado</p>
                    <p className="text-xs text-yellow-600">✓ Backup automático</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}