'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'orange'
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
    // Estilos base - Koyeb Style
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 uppercase tracking-wide'

    // Variantes de cor - Koyeb Style
    const variantStyles = {
      primary:
        componente === 'fisica'
          ? 'bg-fisica-500 text-white hover:bg-fisica-600 shadow-koyeb hover:shadow-koyeb-lg'
          : 'bg-matematica-500 text-white hover:bg-matematica-600 shadow-koyeb hover:shadow-koyeb-lg',
      secondary:
        'bg-white text-koyeb-dark border-2 border-koyeb-dark hover:bg-koyeb-dark hover:text-white',
      ghost:
        'bg-transparent text-gray-600 hover:bg-gray-100',
      danger:
        'bg-red-500 text-white hover:bg-red-600 shadow-koyeb hover:shadow-koyeb-lg',
      orange:
        'bg-koyeb-orange text-white hover:bg-koyeb-coral shadow-koyeb hover:shadow-koyeb-lg',
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
