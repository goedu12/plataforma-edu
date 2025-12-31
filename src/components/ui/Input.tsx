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

    const ringColor =
      componente === 'fisica' ? 'focus:ring-fisica-500' : 'focus:ring-matematica-500'

    const baseInputStyles = `
      w-full px-4 py-3 border rounded-xl text-base
      transition-all duration-200 outline-none
      disabled:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
    `

    const inputStyles = error
      ? `${baseInputStyles} border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent`
      : `${baseInputStyles} border-gray-300 focus:ring-2 ${ringColor} focus:border-transparent`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`${inputStyles} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {helper && !error && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
