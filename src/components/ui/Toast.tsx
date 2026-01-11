'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Aguarda animação de saída
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  // Usar variáveis CSS do design system
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          iconColor: 'var(--success)',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.4)',
        }
      case 'error':
        return {
          iconColor: 'var(--error)',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.4)',
        }
      case 'warning':
        return {
          iconColor: 'var(--warning)',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
        }
      case 'info':
      default:
        return {
          iconColor: 'var(--info)',
          bg: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.4)',
        }
    }
  }

  const styles = getTypeStyles()

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" style={{ color: styles.iconColor }} />,
    error: <XCircle className="w-5 h-5" style={{ color: styles.iconColor }} />,
    warning: <AlertCircle className="w-5 h-5" style={{ color: styles.iconColor }} />,
    info: <Info className="w-5 h-5" style={{ color: styles.iconColor }} />,
  }

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50 max-w-sm
        flex items-center gap-3 p-4 rounded-xl border shadow-lg
        backdrop-blur-md transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
      style={{
        background: styles.bg,
        borderColor: styles.border,
      }}
      role="alert"
      aria-live="polite"
    >
      {icons[type]}
      <p
        className="flex-1 text-sm font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {message}
      </p>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="p-1 rounded-full transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Hook para gerenciar toasts
import { createContext, useContext, useCallback, ReactNode } from 'react'

interface ToastData {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toasts: ToastData[]
  showToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
