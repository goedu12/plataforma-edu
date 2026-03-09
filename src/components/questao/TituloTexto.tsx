interface TituloTextoProps {
  titulo: string
  subtitulo?: string
  className?: string
}

/**
 * Renderiza título de texto/obra em destaque
 * Usado para títulos de textos de apoio em questões ENEM
 */
export function TituloTexto({ titulo, subtitulo, className = '' }: TituloTextoProps) {
  return (
    <div className={`titulo-texto mb-2 ${className}`}>
      <h3
        className="font-semibold text-sm sm:text-base"
        style={{ color: 'var(--text-primary)' }}
      >
        {titulo}
      </h3>
      {subtitulo && (
        <p
          className="text-xs italic mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {subtitulo}
        </p>
      )}
    </div>
  )
}
