'use client'

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  componente?: 'fisica' | 'matematica'
  className?: string
}

export default function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  size = 'md',
  componente = 'fisica',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  const barColor =
    componente === 'fisica'
      ? 'bg-gradient-to-r from-fisica-400 to-fisica-600'
      : 'bg-gradient-to-r from-matematica-400 to-matematica-600'

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`w-full rounded-full overflow-hidden ${sizeStyles[size]}`}
        style={{ background: 'var(--bg-surface-hover)' }}
      >
        <div
          className={`${sizeStyles[size]} ${barColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
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
