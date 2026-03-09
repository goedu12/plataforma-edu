'use client'

import React, { useMemo } from 'react'
import ConteudoQuestao from './ConteudoQuestao'
import SafeImage, { isValidImageUrl } from './ui/SafeImage'
import { extrairTituloDoTexto, extrairFontesDoContexto, extrairImagensInline } from '@/lib/limpezaTexto'

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: EnunciadoUnificado
// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline ÚNICO de renderização para todas as telas do estudante:
// - estudar
// - revisao
// - desafio
// - simulado-enem
// - trilhas
//
// Garante experiência visual consistente e coesa em toda a plataforma.
// ═══════════════════════════════════════════════════════════════════════════════

export type ModoRenderizacao = 'padrao' | 'compacto' | 'prova'

export interface EnunciadoUnificadoProps {
  /** Texto do enunciado (pode conter HTML, markdown, LaTeX) */
  enunciado: string
  /** URL da imagem principal (se existir) */
  imagem?: string | null
  /** Legenda da imagem */
  legendaImagem?: string | null
  /** Descrição da imagem para acessibilidade */
  descricaoImagem?: string | null
  /** Fonte/referência bibliográfica */
  fonte?: string | null
  /** Título do texto (se existir) */
  titulo?: string | null
  /** Modo de renderização */
  modo?: ModoRenderizacao
  /** Callback ao clicar na imagem para expandir */
  onImagemClick?: (url: string) => void
  /** Classes CSS adicionais */
  className?: string
  /** Se deve extrair título automaticamente do texto */
  extrairTitulo?: boolean
  /** Se deve extrair fonte automaticamente do texto */
  extrairFonte?: boolean
  /** Se deve extrair imagens inline do texto */
  extrairImagens?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function EnunciadoUnificado({
  enunciado,
  imagem,
  legendaImagem,
  descricaoImagem,
  fonte,
  titulo,
  modo = 'padrao',
  onImagemClick,
  className = '',
  extrairTitulo = true,
  extrairFonte = true,
  extrairImagens = true,
}: EnunciadoUnificadoProps) {
  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSAMENTO DO CONTEÚDO
  // ═══════════════════════════════════════════════════════════════════════════

  const conteudoProcessado = useMemo(() => {
    let textoCorpo = enunciado
    let tituloFinal = titulo
    let fonteFinal = fonte
    let imagensInline: { url: string; descricao?: string }[] = []

    // 1. Extrair título automaticamente (se não fornecido)
    if (extrairTitulo && !tituloFinal) {
      const { titulo: tituloExtraido, corpo } = extrairTituloDoTexto(textoCorpo)
      if (tituloExtraido) {
        tituloFinal = tituloExtraido
        textoCorpo = corpo
      }
    }

    // 2. Extrair fonte automaticamente (se não fornecida)
    if (extrairFonte && !fonteFinal) {
      const { fontes, textoSemSmall } = extrairFontesDoContexto(textoCorpo)
      if (fontes.length > 0) {
        fonteFinal = fontes.join(' ')
        textoCorpo = textoSemSmall
      }
    }

    // 3. Extrair imagens inline do texto
    if (extrairImagens) {
      const { imagens, textoLimpo } = extrairImagensInline(textoCorpo)
      imagensInline = imagens
      textoCorpo = textoLimpo
    }

    return {
      titulo: tituloFinal,
      corpo: textoCorpo.trim(),
      fonte: fonteFinal,
      imagensInline,
    }
  }, [enunciado, titulo, fonte, extrairTitulo, extrairFonte, extrairImagens])

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTILOS POR MODO
  // ═══════════════════════════════════════════════════════════════════════════

  const estilosPorModo = {
    padrao: {
      container: 'space-y-3',
      titulo: 'font-bold text-sm sm:text-base mb-2 text-center',
      corpo: 'text-sm sm:text-base leading-relaxed',
      fonte: 'text-xs italic mt-2 text-left',
      imagem: 'my-3',
      legenda: 'text-xs italic mt-1 text-center',
    },
    compacto: {
      container: 'space-y-2',
      titulo: 'font-semibold text-xs sm:text-sm mb-1',
      corpo: 'text-xs sm:text-sm leading-snug',
      fonte: 'text-[10px] italic mt-1 text-left',
      imagem: 'my-2',
      legenda: 'text-[10px] italic mt-0.5 text-center',
    },
    prova: {
      container: 'space-y-3',
      titulo: 'font-bold text-sm sm:text-base mb-2 text-center',
      corpo: 'text-sm sm:text-base leading-relaxed questao-texto',
      fonte: 'text-xs italic mt-2 text-left',
      imagem: 'my-3',
      legenda: 'text-xs italic mt-1 text-center',
    },
  }

  const estilos = estilosPorModo[modo]

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPONENTES INTERNOS
  // ═══════════════════════════════════════════════════════════════════════════

  // Renderizar título
  const TituloComponent = conteudoProcessado.titulo ? (
    <h3
      className={estilos.titulo}
      style={{ color: 'var(--text-primary)' }}
    >
      {conteudoProcessado.titulo}
    </h3>
  ) : null

  // Renderizar imagem principal
  const ImagemPrincipal = imagem && isValidImageUrl(imagem) ? (
    <div className={`${estilos.imagem} flex flex-col items-center`}>
      {onImagemClick ? (
        <button
          onClick={() => onImagemClick(imagem)}
          className="cursor-zoom-in"
          aria-label="Expandir imagem"
        >
          <SafeImage
            src={imagem}
            alt={descricaoImagem || legendaImagem || 'Imagem da questão'}
            width={modo === 'compacto' ? 300 : 500}
            height={modo === 'compacto' ? 180 : 300}
            className="rounded-lg max-w-full h-auto"
            style={{
              maxHeight: modo === 'compacto' ? '180px' : '300px',
              objectFit: 'contain',
            }}
          />
        </button>
      ) : (
        <SafeImage
          src={imagem}
          alt={descricaoImagem || legendaImagem || 'Imagem da questão'}
          width={modo === 'compacto' ? 300 : 500}
          height={modo === 'compacto' ? 180 : 300}
          className="rounded-lg max-w-full h-auto"
          style={{
            maxHeight: modo === 'compacto' ? '180px' : '300px',
            objectFit: 'contain',
          }}
        />
      )}
      {legendaImagem && (
        <p className={estilos.legenda} style={{ color: 'var(--text-muted)' }}>
          {legendaImagem}
        </p>
      )}
    </div>
  ) : null

  // Renderizar imagens inline extraídas
  const ImagensInline = conteudoProcessado.imagensInline.length > 0 ? (
    <div className="space-y-2">
      {conteudoProcessado.imagensInline.map((img, idx) => (
        isValidImageUrl(img.url) ? (
          <div key={idx} className={`${estilos.imagem} flex flex-col items-center`}>
            {onImagemClick ? (
              <button
                onClick={() => onImagemClick(img.url)}
                className="cursor-zoom-in"
                aria-label="Expandir imagem"
              >
                <SafeImage
                  src={img.url}
                  alt={img.descricao || `Imagem ${idx + 1}`}
                  width={modo === 'compacto' ? 250 : 400}
                  height={modo === 'compacto' ? 150 : 250}
                  className="rounded-lg max-w-full h-auto"
                  style={{
                    maxHeight: modo === 'compacto' ? '150px' : '250px',
                    objectFit: 'contain',
                  }}
                />
              </button>
            ) : (
              <SafeImage
                src={img.url}
                alt={img.descricao || `Imagem ${idx + 1}`}
                width={modo === 'compacto' ? 250 : 400}
                height={modo === 'compacto' ? 150 : 250}
                className="rounded-lg max-w-full h-auto"
                style={{
                  maxHeight: modo === 'compacto' ? '150px' : '250px',
                  objectFit: 'contain',
                }}
              />
            )}
            {img.descricao && (
              <p className={estilos.legenda} style={{ color: 'var(--text-muted)' }}>
                {img.descricao}
              </p>
            )}
          </div>
        ) : null
      ))}
    </div>
  ) : null

  // Renderizar fonte/referência
  const FonteComponent = conteudoProcessado.fonte ? (
    <p className={estilos.fonte} style={{ color: 'var(--text-muted)' }}>
      {conteudoProcessado.fonte}
    </p>
  ) : null

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className={`enunciado-unificado ${estilos.container} ${className}`}>
      {/* 1. Título (se existir) */}
      {TituloComponent}

      {/* 2. Imagem principal (antes do texto) */}
      {ImagemPrincipal}

      {/* 3. Corpo do texto - usa ConteudoQuestao para renderização rica */}
      {conteudoProcessado.corpo && (
        <div className={modo === 'prova' ? 'card-chromebook' : ''}>
          <ConteudoQuestao
            conteudo={conteudoProcessado.corpo}
            tipo="contexto"
            className={estilos.corpo}
            separarFonte={false} // Já extraímos a fonte acima
          />
        </div>
      )}

      {/* 4. Imagens inline (extraídas do texto) */}
      {ImagensInline}

      {/* 5. Fonte/referência (sempre por último, alinhada à esquerda) */}
      {FonteComponent}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE AUXILIAR: EnunciadoAlternativa
// Para renderizar texto das alternativas com consistência
// ═══════════════════════════════════════════════════════════════════════════════

interface EnunciadoAlternativaProps {
  texto: string
  modo?: ModoRenderizacao
  className?: string
}

export function EnunciadoAlternativa({
  texto,
  modo = 'padrao',
  className = '',
}: EnunciadoAlternativaProps) {
  const tamanhoTexto = modo === 'compacto' ? 'text-xs' : 'text-sm'

  return (
    <ConteudoQuestao
      conteudo={texto}
      tipo="alternativa"
      className={`${tamanhoTexto} ${className}`}
      separarFonte={false}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE AUXILIAR: FeedbackExplicacao
// Para exibir explicação após resposta (PRIORIDADE PEDAGÓGICA)
// ═══════════════════════════════════════════════════════════════════════════════

interface FeedbackExplicacaoProps {
  explicacao?: string | null
  correta: boolean
  gabarito?: string | null
  tema?: string
  linkTeoria?: string
  className?: string
}

export function FeedbackExplicacao({
  explicacao,
  correta,
  gabarito,
  tema,
  linkTeoria,
  className = '',
}: FeedbackExplicacaoProps) {
  if (!explicacao && !gabarito) return null

  const corFundo = correta
    ? 'var(--success-bg, rgba(34, 197, 94, 0.1))'
    : 'var(--error-bg, rgba(239, 68, 68, 0.1))'

  const corBorda = correta
    ? 'var(--success, #22c55e)'
    : 'var(--error, #ef4444)'

  return (
    <div
      className={`rounded-lg p-3 mt-3 ${className}`}
      style={{
        background: corFundo,
        border: `1px solid ${corBorda}`,
      }}
    >
      {/* Cabeçalho do feedback */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-sm font-semibold"
          style={{ color: corBorda }}
        >
          {correta ? 'Correto!' : 'Incorreto'}
        </span>
        {!correta && gabarito && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Resposta correta: {gabarito}
          </span>
        )}
      </div>

      {/* Explicação pedagógica */}
      {explicacao && (
        <div className="mb-2">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Explicação:
          </p>
          <ConteudoQuestao
            conteudo={explicacao}
            tipo="contexto"
            className="text-xs leading-relaxed"
            separarFonte={false}
          />
        </div>
      )}

      {/* Link para teoria relacionada (se não acertou) */}
      {!correta && linkTeoria && tema && (
        <a
          href={linkTeoria}
          className="inline-flex items-center gap-1 text-xs font-medium mt-2 hover:underline"
          style={{ color: 'var(--color-accent)' }}
        >
          Estudar: {tema}
          <span aria-hidden="true">→</span>
        </a>
      )}
    </div>
  )
}
