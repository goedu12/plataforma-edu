'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'fisica' | 'matematica' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'primary' | 'lilas'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'fisica',
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
    // Map aliases to their actual variants
    const actualVariant = variant === 'primary' ? 'fisica' : variant === 'lilas' ? 'matematica' : variant

    // Size classes with proper touch targets (48px minimum)
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm rounded-lg min-h-[44px]',
      md: 'px-6 py-3 text-base rounded-xl min-h-[48px]',
      lg: 'px-8 py-4 text-lg rounded-2xl min-h-[56px]',
    }

    // Hover class based on variant
    const hoverClass =
      actualVariant === 'fisica' ? 'hover:brightness-110' :
      actualVariant === 'matematica' ? 'hover:brightness-110' :
      actualVariant === 'secondary' || actualVariant === 'ghost' ? 'hover:bg-[var(--bg-surface-hover)]' :
      actualVariant === 'danger' ? 'hover:brightness-110' :
      actualVariant === 'accent' ? 'hover:brightness-110' : ''

    // Base classes
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-semibold
      transition-all duration-200 ease-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
      ${hoverClass}
    `.trim()

    // Variant styles using CSS variables
    const getVariantStyle = () => {
      switch (actualVariant) {
        case 'fisica':
          return {
            background: 'var(--color-fisica)',
            color: 'var(--text-on-fisica)',
          }
        case 'matematica':
          return {
            background: 'var(--color-matematica)',
            color: 'var(--text-on-matematica)',
          }
        case 'secondary':
          return {
            background: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-hover)',
          }
        case 'ghost':
          return {
            background: 'transparent',
            color: 'var(--text-tertiary)',
          }
        case 'danger':
          return {
            background: 'var(--error)',
            color: 'var(--text-on-error)',
          }
        case 'accent':
          return {
            background: 'var(--color-accent)',
            color: 'var(--text-on-accent)',
          }
        default:
          return {}
      }
    }

    const variantStyle = getVariantStyle()

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses[size]} ${className}`}
        style={variantStyle as React.CSSProperties}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
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
