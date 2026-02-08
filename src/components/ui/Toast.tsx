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

const iconColors: Record<ToastType, string> = {
  success: 'var(--success)',
  error: 'var(--error)',
  warning: 'var(--warning)',
  info: 'var(--info)',
}

const bgStyles: Record<ToastType, React.CSSProperties> = {
  success: { background: 'var(--bg-elevated)', borderColor: 'var(--success)' },
  error: { background: 'var(--bg-elevated)', borderColor: 'var(--error)' },
  warning: { background: 'var(--bg-elevated)', borderColor: 'var(--warning)' },
  info: { background: 'var(--bg-elevated)', borderColor: 'var(--info)' },
}

export default function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" style={{ color: iconColors.success }} />,
    error: <XCircle className="w-5 h-5" style={{ color: iconColors.error }} />,
    warning: <AlertCircle className="w-5 h-5" style={{ color: iconColors.warning }} />,
    info: <Info className="w-5 h-5" style={{ color: iconColors.info }} />,
  }

  return (
    <div
      className={`
        fixed bottom-4 right-4 max-w-sm
        flex items-center gap-3 p-4 rounded-xl border shadow-lg
        transition-all duration-300 backdrop-blur-sm
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
      style={{
        ...bgStyles[type],
        zIndex: 150,
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0))',
      }}
      role="alert"
    >
      {icons[type]}
      <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="p-2 rounded-lg transition-colors flex items-center justify-center"
        style={{ color: 'var(--text-secondary)', minWidth: '36px', minHeight: '36px' }}
        aria-label="Fechar"
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
      <div className="fixed bottom-4 right-4 flex flex-col gap-2" style={{ zIndex: 150 }}>
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
