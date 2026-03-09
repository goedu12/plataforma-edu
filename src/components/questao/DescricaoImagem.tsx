interface DescricaoImagemProps {
  descricao: string
  className?: string
}

/**
 * Renderiza descrição de imagem em formato padronizado
 * Usado para descrições alternativas de imagens em questões
 */
export function DescricaoImagem({ descricao, className = '' }: DescricaoImagemProps) {
  return (
    <div
      className={`descricao-imagem p-3 rounded-lg my-2 ${className}`}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)'
      }}
    >
      <p
        className="text-xs sm:text-sm italic leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {descricao}
      </p>
    </div>
  )
}
