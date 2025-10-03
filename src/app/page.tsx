'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { LoginForm } from '@/components/LoginForm'
import { Dashboard } from '@/components/Dashboard'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { UserManagement } from '@/components/UserManagement'
import { IgrejaManagement } from '@/components/IgrejaManagement'
import { SalaManagement } from '@/components/SalaManagement'
import { ProfessorManagement } from '@/components/ProfessorManagement'
import { AlunoManagement } from '@/components/AlunoManagement'
import { ChamadaManagement } from '@/components/ChamadaManagement'
import { RelatoriosView } from '@/components/RelatoriosView'
import { AvisosView } from '@/components/AvisosView'
import { PerfilView } from '@/components/PerfilView'
import { ControleTempoAula } from '@/components/ControleTempoAula'
import { ConfiguracoesView } from '@/components/ConfiguracoesView'
import { HistoricoView } from '@/components/HistoricoView'
import { NotificationProvider } from '@/components/ui/notifications'
import { Loader2 } from 'lucide-react'

type ActiveView = 'dashboard' | 'usuarios' | 'igrejas' | 'salas' | 'professores' | 'alunos' | 'chamadas' | 'relatorios' | 'avisos' | 'perfil' | 'controle-tempo' | 'configuracoes' | 'historico'

export default function Home() {
  const { user, loading } = useAuth()
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Garantir que estamos no cliente
    setIsClient(true)
    
    // Inicializar dados padrão se não existirem
    const initializeDefaultData = () => {
      if (typeof window === 'undefined') return
      
      try {
        // Verificar se já existem dados
        const existingUsers = localStorage.getItem('users')
        if (!existingUsers) {
          // Dados padrão apenas do admin principal
          const defaultUsers = [
            {
              id: 'filemom-admin',
              nome: 'Filemom Figueiredo',
              email: 'filemom@ebd.com',
              senha: '123456',
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
          localStorage.setItem('users', JSON.stringify(defaultUsers))
        }

        // Limpar outros dados para começar do zero
        const dataKeys = ['igrejas', 'salas', 'professores', 'alunos', 'chamadas', 'presencas', 'avisos']
        dataKeys.forEach(key => {
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify([]))
          }
        })
      } catch (error) {
        console.warn('Erro ao inicializar dados:', error)
      }
    }

    initializeDefaultData()
  }, [])

  // Mostrar loading enquanto não estiver no cliente
  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white/70 text-sm">Carregando EBD Digital Pro...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />
      case 'usuarios':
        return <UserManagement />
      case 'igrejas':
        return <IgrejaManagement />
      case 'salas':
        return <SalaManagement />
      case 'professores':
        return <ProfessorManagement />
      case 'alunos':
        return <AlunoManagement />
      case 'chamadas':
        return <ChamadaManagement />
      case 'relatorios':
        return <RelatoriosView />
      case 'avisos':
        return <AvisosView />
      case 'perfil':
        return <PerfilView />
      case 'controle-tempo':
        return <ControleTempoAula />
      case 'configuracoes':
        return <ConfiguracoesView />
      case 'historico':
        return <HistoricoView />
      default:
        return <Dashboard />
    }
  }

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
            <div className="relative">
              {/* Padrão de textura sutil */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>
              
              <div className="relative z-10">
                {renderContent()}
              </div>
            </div>
          </main>
          
          {/* Nome do criador no rodapé */}
          <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 px-4 py-2">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Desenvolvido por Filemom Figueiredo • EBD Digital Pro v1.0
              </p>
            </div>
          </footer>
        </div>
      </div>
    </NotificationProvider>
  )
}