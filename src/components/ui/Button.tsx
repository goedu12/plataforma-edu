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
      sm: 'px-4 py-2 text-sm rounded-lg min-h-[40px]',
      md: 'px-6 py-3 text-base rounded-xl min-h-[48px]',
      lg: 'px-8 py-4 text-lg rounded-2xl min-h-[56px]',
    }

    // Base classes
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-semibold
      transition-all duration-200 ease-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `.trim()

    // Variant styles using CSS variables
    const getVariantStyle = () => {
      switch (actualVariant) {
        case 'fisica':
          return {
            background: 'var(--color-fisica)',
            color: '#000',
          }
        case 'matematica':
          return {
            background: 'var(--color-matematica)',
            color: '#fff',
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
            color: '#fff',
          }
        case 'accent':
          return {
            background: 'var(--color-accent)',
            color: '#fff',
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
        onMouseEnter={(e) => {
          if (actualVariant === 'fisica') {
            e.currentTarget.style.background = 'var(--color-fisica-light)'
          } else if (actualVariant === 'matematica') {
            e.currentTarget.style.background = 'var(--color-matematica-light)'
          } else if (actualVariant === 'secondary' || actualVariant === 'ghost') {
            e.currentTarget.style.background = 'var(--bg-surface-hover)'
          }
        }}
        onMouseLeave={(e) => {
          if (actualVariant === 'fisica') {
            e.currentTarget.style.background = 'var(--color-fisica)'
          } else if (actualVariant === 'matematica') {
            e.currentTarget.style.background = 'var(--color-matematica)'
          } else if (actualVariant === 'secondary' || actualVariant === 'ghost') {
            e.currentTarget.style.background = 'transparent'
          }
        }}
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
