'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'fisica' | 'matematica' | 'lilas' | 'orange'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
  glow?: boolean
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
      glow = true,
      className = '',
      ...props
    },
    ref
  ) => {
    // ═══════════════════════════════════════════════════════════
    // ESTILOS BASE - Premium 2026
    // ═══════════════════════════════════════════════════════════
    const baseStyles = `
      inline-flex items-center justify-center gap-2.5
      font-semibold rounded-2xl
      transition-all duration-300 ease-out
      transform hover:scale-[1.02] active:scale-[0.98]
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      backdrop-blur-sm
    `

    // ═══════════════════════════════════════════════════════════
    // VARIANTES - Gradientes + Glow Effects 2026
    // ═══════════════════════════════════════════════════════════
    const variantStyles = {
      // Verde Principal - CTAs
      primary: `
        bg-gradient-to-r from-primary-500 to-primary-600
        text-white font-semibold
        border border-primary-400/20
        shadow-soft-sm
        hover:from-primary-400 hover:to-primary-500
        hover:shadow-glow-green
        active:from-primary-600 active:to-primary-700
      `,

      // Secundário - Ghost com borda
      secondary: `
        bg-dark-surface/80 backdrop-blur-md
        text-text-primary
        border border-border
        shadow-soft-xs
        hover:bg-dark-elevated/90
        hover:border-border-hover
        hover:shadow-soft-sm
      `,

      // Ghost - Transparente
      ghost: `
        bg-transparent
        text-text-secondary
        hover:bg-dark-elevated/50
        hover:text-text-primary
      `,

      // Danger - Vermelho
      danger: `
        bg-gradient-to-r from-error to-red-600
        text-white font-semibold
        border border-red-400/20
        shadow-soft-sm
        hover:from-red-500 hover:to-red-600
        hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]
      `,

      // Física - Verde
      fisica: `
        bg-gradient-to-r from-fisica-500 to-fisica-600
        text-white font-semibold
        border border-fisica-400/20
        shadow-soft-sm
        hover:from-fisica-400 hover:to-fisica-500
        hover:shadow-glow-green
        active:from-fisica-600 active:to-fisica-700
      `,

      // Matemática - Lilás/Roxo
      matematica: `
        bg-gradient-to-r from-matematica-500 to-matematica-600
        text-white font-semibold
        border border-matematica-400/20
        shadow-soft-sm
        hover:from-matematica-400 hover:to-matematica-500
        hover:shadow-glow-lilas
        active:from-matematica-600 active:to-matematica-700
      `,

      // Lilás - Roxo (alias)
      lilas: `
        bg-gradient-to-r from-lilas-500 to-lilas-600
        text-white font-semibold
        border border-lilas-400/20
        shadow-soft-sm
        hover:from-lilas-400 hover:to-lilas-500
        hover:shadow-glow-lilas
        active:from-lilas-600 active:to-lilas-700
      `,

      // Laranja - Secundário vibrante
      orange: `
        bg-gradient-to-r from-secondary-500 to-secondary-600
        text-white font-semibold
        border border-secondary-400/20
        shadow-soft-sm
        hover:from-secondary-400 hover:to-secondary-500
        hover:shadow-glow-orange
        active:from-secondary-600 active:to-secondary-700
      `,
    }

    // ═══════════════════════════════════════════════════════════
    // TAMANHOS - Proporções modernas
    // ═══════════════════════════════════════════════════════════
    const sizeStyles = {
      sm: 'px-4 py-2 text-sm rounded-xl',
      md: 'px-5 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-2xl',
      xl: 'px-8 py-4 text-lg rounded-2xl',
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
