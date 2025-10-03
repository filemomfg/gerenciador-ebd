'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertCircle, Info, X, Bell } from 'lucide-react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

// Context para gerenciar notificações globalmente
import { createContext, useContext } from 'react'

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove após duração especificada (padrão 5 segundos)
    const duration = notification.duration || 5000
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

// Container das notificações
function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// Item individual de notificação
function NotificationItem({ 
  notification, 
  onClose 
}: { 
  notification: Notification
  onClose: () => void 
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(onClose, 300) // Aguarda animação de saída
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div
      className={cn(
        "transform transition-all duration-300 ease-in-out",
        isVisible && !isLeaving 
          ? "translate-x-0 opacity-100 scale-100" 
          : "translate-x-full opacity-0 scale-95",
        "border rounded-lg shadow-lg p-4 backdrop-blur-sm",
        getStyles()
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-sm mt-1 opacity-90">{notification.message}</p>
          
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Hook para facilitar o uso
export function useToast() {
  const { addNotification } = useNotifications()

  return {
    success: (title: string, message: string, options?: Partial<Notification>) => {
      addNotification({ type: 'success', title, message, ...options })
    },
    error: (title: string, message: string, options?: Partial<Notification>) => {
      addNotification({ type: 'error', title, message, ...options })
    },
    warning: (title: string, message: string, options?: Partial<Notification>) => {
      addNotification({ type: 'warning', title, message, ...options })
    },
    info: (title: string, message: string, options?: Partial<Notification>) => {
      addNotification({ type: 'info', title, message, ...options })
    }
  }
}