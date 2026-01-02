'use client'

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  componente?: 'fisica' | 'matematica'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      componente = 'fisica',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`

    // Koyeb Dark Theme - Focus ring colors
    const ringColor =
      componente === 'fisica'
        ? 'focus:ring-fisica-500/50 focus:border-fisica-500'
        : 'focus:ring-matematica-500/50 focus:border-matematica-500'

    // Koyeb Dark Theme - Base input styles
    const baseInputStyles = `
      w-full px-4 py-3
      bg-dark-surface border border-border rounded-xl
      text-text-primary text-base placeholder:text-text-tertiary
      transition-all duration-200 outline-none
      hover:border-border-hover
      focus:ring-2 focus:bg-dark-elevated
      disabled:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed
    `

    const inputStyles = error
      ? `${baseInputStyles} border-error focus:ring-error/30 focus:border-error`
      : `${baseInputStyles} ${ringColor}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`${inputStyles} ${leftIcon ? 'pl-12' : ''} ${rightIcon ? 'pr-12' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-error mt-2">{error}</p>}
        {helper && !error && <p className="text-xs text-text-tertiary mt-2">{helper}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

// Textarea Component - Koyeb Dark Theme
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
  componente?: 'fisica' | 'matematica'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helper,
      componente = 'fisica',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`

    const ringColor =
      componente === 'fisica'
        ? 'focus:ring-fisica-500/50 focus:border-fisica-500'
        : 'focus:ring-matematica-500/50 focus:border-matematica-500'

    const baseStyles = `
      w-full px-4 py-3
      bg-dark-surface border border-border rounded-xl
      text-text-primary text-base placeholder:text-text-tertiary
      transition-all duration-200 outline-none resize-none
      hover:border-border-hover
      focus:ring-2 focus:bg-dark-elevated
      disabled:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed
    `

    const textareaStyles = error
      ? `${baseStyles} border-error focus:ring-error/30 focus:border-error`
      : `${baseStyles} ${ringColor}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={`${textareaStyles} ${className}`}
          {...props}
        />

        {error && <p className="text-xs text-error mt-2">{error}</p>}
        {helper && !error && <p className="text-xs text-text-tertiary mt-2">{helper}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Select Component - Koyeb Dark Theme
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helper?: string
  componente?: 'fisica' | 'matematica'
  children: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helper,
      componente = 'fisica',
      className = '',
      id,
      children,
      ...props
    },
    ref
  ) => {
    const inputId = id || `select-${Math.random().toString(36).slice(2, 9)}`

    const ringColor =
      componente === 'fisica'
        ? 'focus:ring-fisica-500/50 focus:border-fisica-500'
        : 'focus:ring-matematica-500/50 focus:border-matematica-500'

    const baseStyles = `
      w-full px-4 py-3
      bg-dark-surface border border-border rounded-xl
      text-text-primary text-base
      transition-all duration-200 outline-none appearance-none
      hover:border-border-hover
      focus:ring-2 focus:bg-dark-elevated
      disabled:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed
    `

    const selectStyles = error
      ? `${baseStyles} border-error focus:ring-error/30 focus:border-error`
      : `${baseStyles} ${ringColor}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={`${selectStyles} pr-10 ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error && <p className="text-xs text-error mt-2">{error}</p>}
        {helper && !error && <p className="text-xs text-text-tertiary mt-2">{helper}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
