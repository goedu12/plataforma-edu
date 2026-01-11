'use client'

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  componente?: 'fisica' | 'matematica'
  className?: string
  /** Texto adicional para acessibilidade */
  ariaLabel?: string
}

export default function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  size = 'md',
  componente = 'fisica',
  className = '',
  ariaLabel,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  // Usar variáveis CSS do design system
  const barStyle = {
    width: `${percentage}%`,
    background: componente === 'fisica'
      ? 'linear-gradient(to right, var(--color-fisica-light), var(--color-fisica-dark))'
      : 'linear-gradient(to right, var(--color-matematica-light), var(--color-matematica-dark))',
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`w-full rounded-full overflow-hidden ${sizeStyles[size]}`}
        style={{ background: 'var(--bg-overlay)' }}
      >
        <div
          className={`${sizeStyles[size]} rounded-full transition-all duration-500 ease-out`}
          style={barStyle}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={ariaLabel || `Progresso: ${Math.round(percentage)}%`}
        />
      </div>
      {showLabel && (
        <div
          className="flex justify-between text-xs mt-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span>
            {value}/{max}
          </span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  )
}
