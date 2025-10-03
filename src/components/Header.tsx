'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Menu, X, User, LogOut, Crown, Shield, BookOpen, Church } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Igreja } from '@/lib/types'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const [igreja, setIgreja] = useState<Igreja | null>(null)

  useEffect(() => {
    // Carregar dados da igreja do usuário
    if (user?.igreja_id) {
      const igrejasStorage = localStorage.getItem('igrejas')
      if (igrejasStorage) {
        const igrejas = JSON.parse(igrejasStorage)
        const userIgreja = igrejas.find((i: Igreja) => i.id === user.igreja_id)
        setIgreja(userIgreja || null)
      }
    }
  }, [user])

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'admin':
        return {
          label: 'Administrador Principal',
          icon: Crown,
          color: 'text-yellow-600 bg-yellow-100'
        }
      case 'admin_igreja':
        return {
          label: 'Admin da Igreja',
          icon: Shield,
          color: 'text-blue-600 bg-blue-100'
        }
      case 'professor':
        return {
          label: 'Professor da EBD',
          icon: BookOpen,
          color: 'text-green-600 bg-green-100'
        }
      default:
        return {
          label: 'Usuário',
          icon: User,
          color: 'text-gray-600 bg-gray-100'
        }
    }
  }

  const roleInfo = getRoleInfo()
  const RoleIcon = roleInfo.icon

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="md:hidden mr-3 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-4">
            {/* Logo da Igreja */}
            <div className="bg-blue-50 p-2 rounded-full">
              <Church className="h-8 w-8 text-blue-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EBD Digital Pro</h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                Sistema Profissional de Gerenciamento da Escola Bíblica Dominical
              </p>
            </div>

            {/* Logo da Igreja Customizada */}
            {igreja && igreja.logo_url && (
              <div className="flex items-center space-x-2 ml-6 pl-6 border-l border-gray-200">
                <div className="bg-blue-50 p-2 rounded-full">
                  <img 
                    src={igreja.logo_url} 
                    alt={`Logo ${igreja.nome}`}
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'block'
                    }}
                  />
                  <Church className="h-8 w-8 text-blue-600 hidden" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900">{igreja.nome}</p>
                  <p className="text-xs text-gray-600">Igreja Cadastrada</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 hover:bg-gray-50 p-3 rounded-xl">
                <div className={`rounded-full p-2 ${roleInfo.color}`}>
                  <RoleIcon className="h-5 w-5" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.nome}</p>
                  <p className="text-xs text-gray-600">{roleInfo.label}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 shadow-xl">
              <DropdownMenuLabel className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`rounded-full p-2 ${roleInfo.color}`}>
                    <RoleIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user?.nome}</p>
                    <p className="text-xs text-gray-600">{roleInfo.label}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-2">
                <User className="mr-3 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout} 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 py-2"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}