'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'orange' | 'neon-fisica' | 'neon-matematica'
  size?: 'sm' | 'md' | 'lg'
  componente?: 'fisica' | 'matematica'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      componente = 'fisica',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Estilos base - Dark Theme Premium
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 uppercase tracking-wider'

    // Variantes de cor - Dark Theme com Neon Glow
    const variantStyles = {
      primary:
        componente === 'fisica'
          ? 'bg-gradient-to-r from-fisica-400 to-fisica-500 text-dark-bg font-bold shadow-dark hover:shadow-glow-fisica'
          : 'bg-gradient-to-r from-matematica-300 to-matematica-500 text-white font-bold shadow-dark hover:shadow-glow-matematica',
      secondary:
        'bg-transparent text-white border-2 border-white/20 hover:bg-white/10 hover:border-white/40',
      ghost:
        'bg-transparent text-light-secondary hover:bg-dark-elevated hover:text-white',
      danger:
        'bg-gradient-to-r from-error to-red-600 text-white shadow-dark hover:shadow-glow-error',
      orange:
        'bg-gradient-to-r from-accent-orange to-accent-coral text-white shadow-dark hover:shadow-glow-orange',
      'neon-fisica':
        'bg-transparent border-2 border-fisica-400 text-fisica-400 hover:bg-fisica-400/10 hover:shadow-glow-fisica',
      'neon-matematica':
        'bg-transparent border-2 border-matematica-300 text-matematica-300 hover:bg-matematica-300/10 hover:shadow-glow-matematica',
    }

    // Tamanhos
    const sizeStyles = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
