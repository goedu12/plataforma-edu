'use client'

import { formatarFormula } from '@/lib/formatacao'

interface TextoFormatadoProps {
  children: string
  className?: string
  style?: React.CSSProperties
  as?: 'p' | 'span' | 'div'
}

/**
 * Componente para exibir texto com formatação matemática
 * Converte automaticamente notação científica e expoentes
 *
 * Exemplos de conversão:
 *   5x10^12 → 5×10¹²
 *   10^-7 → 10⁻⁷
 *   m/s^2 → m/s²
 */
export default function TextoFormatado({
  children,
  className = '',
  style,
  as: Component = 'span',
}: TextoFormatadoProps) {
  const textoFormatado = formatarFormula(children || '')

  return (
    <Component className={className} style={style}>
      {textoFormatado}
    </Component>
  )
}
