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

    const focusColor = componente === 'fisica'
      ? 'var(--color-fisica)'
      : 'var(--color-matematica)'

    const focusGlow = componente === 'fisica'
      ? 'var(--color-fisica-glow)'
      : 'var(--color-matematica-glow)'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="input-label"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`input ${leftIcon ? 'pl-12' : ''} ${rightIcon ? 'pr-12' : ''} ${error ? 'input-error' : ''} ${className}`}
            style={{
              ['--focus-color' as string]: focusColor,
              ['--focus-glow' as string]: focusGlow,
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = focusColor
                e.currentTarget.style.boxShadow = `0 0 0 3px ${focusGlow}`
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--border-default)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            {...props}
          />

          {rightIcon && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs mt-2" style={{ color: 'var(--error)' }}>
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

// Textarea Component
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

    const focusColor = componente === 'fisica'
      ? 'var(--color-fisica)'
      : 'var(--color-matematica)'

    const focusGlow = componente === 'fisica'
      ? 'var(--color-fisica-glow)'
      : 'var(--color-matematica-glow)'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="input-label"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`input resize-none ${error ? 'input-error' : ''} ${className}`}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = focusColor
              e.currentTarget.style.boxShadow = `0 0 0 3px ${focusGlow}`
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--border-default)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          {...props}
        />

        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs mt-2" style={{ color: 'var(--error)' }}>
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Select Component
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

    const focusColor = componente === 'fisica'
      ? 'var(--color-fisica)'
      : 'var(--color-matematica)'

    const focusGlow = componente === 'fisica'
      ? 'var(--color-fisica-glow)'
      : 'var(--color-matematica-glow)'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="input-label"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`select ${error ? 'input-error' : ''} ${className}`}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = focusColor
                e.currentTarget.style.boxShadow = `0 0 0 3px ${focusGlow}`
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--border-default)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            {...props}
          >
            {children}
          </select>
        </div>

        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs mt-2" style={{ color: 'var(--error)' }}>
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
