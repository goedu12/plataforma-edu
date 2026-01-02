'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'fisica' | 'matematica'
  size?: 'sm' | 'md' | 'lg'
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
    // Estilos base - Koyeb Dark Theme
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'

    // Variantes - Koyeb Dark Theme
    const variantStyles = {
      primary: 'bg-accent-green text-white hover:bg-accent-green-light hover:shadow-glow-green',
      secondary: 'bg-transparent text-text-primary border border-border hover:bg-dark-elevated hover:border-border-hover',
      ghost: 'bg-transparent text-text-secondary hover:bg-dark-elevated hover:text-text-primary',
      danger: 'bg-error text-white hover:bg-red-600',
      fisica: 'bg-fisica-500 text-white hover:bg-fisica-400 hover:shadow-glow-cyan',
      matematica: 'bg-matematica-500 text-white hover:bg-matematica-400 hover:shadow-glow-purple',
    }

    // Tamanhos
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
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
