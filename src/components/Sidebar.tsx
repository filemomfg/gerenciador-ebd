'use client'

import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Church,
  School,
  GraduationCap,
  UserCheck,
  ClipboardList,
  BarChart3,
  Bell,
  User,
  X,
  Crown,
  Shield,
  BookOpen,
  LogOut,
  Timer,
  Settings,
  Calendar,
  Zap,
  History
} from 'lucide-react'

type ActiveView = 'dashboard' | 'usuarios' | 'igrejas' | 'salas' | 'professores' | 'alunos' | 'chamadas' | 'relatorios' | 'avisos' | 'perfil' | 'controle-tempo' | 'configuracoes' | 'historico'

interface SidebarProps {
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function Sidebar({ activeView, setActiveView, isOpen, setIsOpen }: SidebarProps) {
  const { user, logout } = useAuth()

  // Menu reorganizado especificamente para AdminIgreja
  const getMenuItems = () => {
    if (user?.role === 'admin_igreja') {
      return [
        {
          id: 'dashboard' as ActiveView,
          label: 'Dashboard',
          icon: LayoutDashboard,
          color: 'text-blue-600',
          category: 'principal'
        },
        {
          id: 'salas' as ActiveView,
          label: 'Salas',
          icon: School,
          color: 'text-orange-600',
          category: 'gestao'
        },
        {
          id: 'professores' as ActiveView,
          label: 'Professores',
          icon: GraduationCap,
          color: 'text-indigo-600',
          category: 'gestao'
        },
        {
          id: 'alunos' as ActiveView,
          label: 'Alunos',
          icon: UserCheck,
          color: 'text-cyan-600',
          category: 'gestao'
        },
        {
          id: 'chamadas' as ActiveView,
          label: 'Chamada',
          icon: ClipboardList,
          color: 'text-emerald-600',
          category: 'operacional'
        },
        {
          id: 'controle-tempo' as ActiveView,
          label: 'Controle de Tempo',
          icon: Timer,
          color: 'text-red-600',
          category: 'operacional',
          special: true
        },
        {
          id: 'relatorios' as ActiveView,
          label: 'Relatórios',
          icon: BarChart3,
          color: 'text-pink-600',
          category: 'relatorios'
        },
        {
          id: 'historico' as ActiveView,
          label: 'Histórico',
          icon: History,
          color: 'text-gray-600',
          category: 'relatorios'
        },
        {
          id: 'perfil' as ActiveView,
          label: 'Perfil',
          icon: User,
          color: 'text-gray-600',
          category: 'pessoal'
        },
        {
          id: 'configuracoes' as ActiveView,
          label: 'Configurações',
          icon: Settings,
          color: 'text-purple-600',
          category: 'configuracao'
        }
      ]
    }

    // Menu para outros perfis
    return [
      {
        id: 'dashboard' as ActiveView,
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'admin_igreja', 'professor'],
        color: 'text-blue-600',
        category: 'principal'
      },
      
      // SEÇÃO ADMINISTRATIVA (Admin Principal)
      {
        id: 'usuarios' as ActiveView,
        label: 'Usuários',
        icon: Users,
        roles: ['admin'],
        color: 'text-purple-600',
        category: 'admin'
      },
      
      // SEÇÃO GESTÃO (Admin Igreja)
      {
        id: 'igrejas' as ActiveView,
        label: 'Igrejas',
        icon: Church,
        roles: ['admin', 'admin_igreja'],
        color: 'text-green-600',
        category: 'gestao'
      },
      {
        id: 'salas' as ActiveView,
        label: 'Salas',
        icon: School,
        roles: ['admin', 'admin_igreja'],
        color: 'text-orange-600',
        category: 'gestao'
      },
      {
        id: 'professores' as ActiveView,
        label: 'Professores',
        icon: GraduationCap,
        roles: ['admin', 'admin_igreja'],
        color: 'text-indigo-600',
        category: 'gestao'
      },
      {
        id: 'alunos' as ActiveView,
        label: 'Alunos',
        icon: UserCheck,
        roles: ['admin', 'admin_igreja', 'professor'],
        color: 'text-cyan-600',
        category: 'gestao'
      },
      
      // SEÇÃO OPERACIONAL (Aulas e Controle)
      {
        id: 'controle-tempo' as ActiveView,
        label: 'Controle de Tempo',
        icon: Timer,
        roles: ['admin_igreja'],
        color: 'text-red-600',
        category: 'operacional'
      },
      {
        id: 'chamadas' as ActiveView,
        label: 'Chamadas',
        icon: ClipboardList,
        roles: ['admin', 'admin_igreja', 'professor'],
        color: 'text-emerald-600',
        category: 'operacional'
      },
      
      // SEÇÃO RELATÓRIOS E COMUNICAÇÃO
      {
        id: 'relatorios' as ActiveView,
        label: 'Relatórios',
        icon: BarChart3,
        roles: ['admin', 'admin_igreja', 'professor'],
        color: 'text-pink-600',
        category: 'relatorios'
      },
      {
        id: 'historico' as ActiveView,
        label: 'Histórico',
        icon: History,
        roles: ['admin', 'admin_igreja', 'professor'],
        color: 'text-gray-600',
        category: 'relatorios'
      },
      {
        id: 'avisos' as ActiveView,
        label: 'Avisos',
        icon: Bell,
        roles: ['admin', 'admin_igreja', 'professor'],
        color: 'text-yellow-600',
        category: 'comunicacao'
      },
      
      // SEÇÃO PESSOAL
      {
        id: 'perfil' as ActiveView,
        label: 'Perfil',
        icon: User,
        roles: ['admin', 'admin_igreja', 'professor', 'aluno'],
        color: 'text-gray-600',
        category: 'pessoal'
      }
    ].filter(item => 
      !item.roles || item.roles.includes(user?.role || '')
    )
  }

  const menuItems = getMenuItems()

  // Agrupar itens por categoria
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof menuItems>)

  const handleItemClick = (viewId: ActiveView) => {
    setActiveView(viewId)
    setIsOpen(false) // Fecha o sidebar no mobile
  }

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'Administrador Principal',
          icon: Crown,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 'admin_igreja':
        return {
          title: 'Admin da Igreja',
          icon: Shield,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case 'professor':
        return {
          title: 'Professor da EBD',
          icon: BookOpen,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      default:
        return {
          title: 'Usuário',
          icon: User,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'principal': return 'Principal'
      case 'admin': return 'Administração'
      case 'gestao': return 'Gestão'
      case 'operacional': return 'Operacional'
      case 'relatorios': return 'Relatórios'
      case 'comunicacao': return 'Comunicação'
      case 'configuracao': return 'Configuração'
      case 'pessoal': return 'Pessoal'
      default: return 'Outros'
    }
  }

  const roleInfo = getRoleInfo()
  const RoleIcon = roleInfo.icon

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-white to-gray-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 border-r border-gray-200",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header do Sidebar */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Church className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg">EBD Digital</span>
                <p className="text-blue-100 text-xs">Sistema Profissional</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="md:hidden text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Informações do Usuário */}
          <div className={cn(
            "p-4 m-4 rounded-xl border-2",
            roleInfo.bgColor,
            roleInfo.borderColor
          )}>
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-lg bg-white shadow-sm",
                roleInfo.color
              )}>
                <RoleIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.nome}</p>
                <p className={cn("text-sm font-medium", roleInfo.color)}>
                  {roleInfo.title}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items Agrupados */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="space-y-1">
                {/* Título da Categoria */}
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {getCategoryTitle(category)}
                  </h3>
                </div>
                
                {/* Items da Categoria */}
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeView === item.id
                  
                  // Destaque especial para Controle de Tempo
                  const isControleTempoActive = item.id === 'controle-tempo' && isActive
                  const isSpecialItem = item.special

                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-11 rounded-xl transition-all duration-200 mx-1",
                        isActive 
                          ? isControleTempoActive
                            ? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:from-red-600 hover:to-pink-700"
                            : "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                      onClick={() => handleItemClick(item.id)}
                    >
                      <Icon className={cn(
                        "mr-3 h-4 w-4",
                        isActive ? "text-white" : item.color
                      )} />
                      <span className="font-medium text-sm">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                      )}
                      {/* Badge especial para Controle de Tempo */}
                      {isSpecialItem && !isActive && (
                        <div className="ml-auto">
                          <Zap className="w-3 h-3 text-red-500" />
                        </div>
                      )}
                    </Button>
                  )
                })}
                
                {/* Separador entre categorias */}
                {category !== 'pessoal' && category !== 'configuracao' && (
                  <div className="border-t border-gray-200 my-2 mx-3" />
                )}
              </div>
            ))}
          </nav>

          {/* Footer do Sidebar */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full justify-start h-12 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span className="font-medium">Sair do Sistema</span>
            </Button>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                EBD Digital Pro v2.0
              </p>
              <p className="text-xs text-gray-400">
                © 2024 - Sistema Profissional
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}