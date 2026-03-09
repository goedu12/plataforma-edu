interface FonteReferenciaProps {
  fonte: string
  className?: string
}

/**
 * Renderiza fonte/referência bibliográfica
 * Estilo padrão ENEM: texto menor, cor secundária, alinhado à esquerda
 */
export function FonteReferencia({ fonte, className = '' }: FonteReferenciaProps) {
  return (
    <p
      className={`fonte-referencia text-xs leading-relaxed ${className}`}
      style={{ color: 'var(--text-muted)' }}
    >
      {fonte}
    </p>
  )
}
