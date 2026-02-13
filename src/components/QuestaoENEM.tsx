'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ZoomIn,
  X,
  Calendar,
  BookOpen,
  ImageOff,
  FileText,
} from 'lucide-react'
import Button from './ui/Button'
import Badge from './ui/Badge'
import SafeImage, { isValidImageUrl } from './ui/SafeImage'
import ImagemModal, { ImagemQuestao } from './ui/ImagemModal'
import ConteudoQuestao from './enem/ConteudoQuestao'
import { processarTexto, processarContexto, isTextoValido, extrairFontesDoContexto, extrairTituloDoTexto, separarMultiplosTextos, extrairImagensInline } from '@/lib/limpezaTexto'
import type { QuestaoENEM, AlternativaENEM, AreaENEM, Componente } from '@/types'
import { ENEM_CONFIG } from '@/types'
import 'katex/dist/katex.min.css'

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: QuestaoENEM
// Renderiza questões do ENEM com 5 alternativas e suporte a imagens
// Sem sistema de pontos/conquistas - apenas feedback de acerto/erro
// ═══════════════════════════════════════════════════════════════════════════

interface QuestaoENEMProps {
  questao: Omit<QuestaoENEM, 'resposta_correta'>
  componente?: Componente  // Para herdar cores do Studão
  tempoDecorrido: number
  onResponder: (resposta: AlternativaENEM) => void
  onProxima: () => void
  onVoltar: () => void
  estatisticas?: {
    total_questoes: number
    total_corretas: number
    taxa_acerto: number
  }
  // Dados extras para questões da API externa
  questaoExtra?: {
    resposta_correta?: string
    fonte?: string
  }
}

interface FeedbackData {
  correta: boolean
  respostaCorreta: AlternativaENEM
}

export default function QuestaoENEM({
  questao,
  componente = 'fisica',
  tempoDecorrido,
  onResponder,
  onProxima,
  onVoltar,
  estatisticas,
  questaoExtra,
}: QuestaoENEMProps) {
  const [selecionada, setSelecionada] = useState<AlternativaENEM | null>(null)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [imagemExpandida, setImagemExpandida] = useState<string | null>(null)

  // Determinar cores com base no componente ou área
  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Alternativas do ENEM (5) - com limpeza de texto
  const alternativas: { letra: AlternativaENEM; texto: string; imagem?: string }[] = [
    { letra: 'A', texto: processarTexto(questao.alternativa_a), imagem: questao.imagem_a },
    { letra: 'B', texto: processarTexto(questao.alternativa_b), imagem: questao.imagem_b },
    { letra: 'C', texto: processarTexto(questao.alternativa_c), imagem: questao.imagem_c },
    { letra: 'D', texto: processarTexto(questao.alternativa_d), imagem: questao.imagem_d },
    { letra: 'E', texto: processarTexto(questao.alternativa_e), imagem: questao.imagem_e },
  ]

  // Obter nome da área
  const areaNome = questao.area
    ? ENEM_CONFIG.AREAS[questao.area as AreaENEM]?.nome || questao.area
    : 'ENEM'

  // Obter nome da subárea
  const subareaNome = questao.subarea
    ? ENEM_CONFIG.SUBAREAS_LABELS[questao.subarea as keyof typeof ENEM_CONFIG.SUBAREAS_LABELS] || questao.subarea
    : null

  const handleConfirmar = async () => {
    if (!selecionada) return

    setLoading(true)
    setErro(null)

    // Verificar se é questão da API externa
    const isQuestaoExterna = questaoExtra?.fonte === 'ENEM-API'

    try {
      // Montar payload - incluir dados extras se for questão externa
      const payload: Record<string, any> = {
        questao_id: questao.id,
        resposta: selecionada,
        tempo_segundos: tempoDecorrido,
      }

      // Para questões externas, enviar dados necessários para validação
      if (isQuestaoExterna && questaoExtra?.resposta_correta) {
        payload.resposta_correta = questaoExtra.resposta_correta
        payload.ano_prova = questao.ano_prova
        payload.area = questao.area
        payload.subarea = questao.subarea
        payload.id_api = questao.id_api
      }

      const response = await fetch('/api/enem/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.sucesso) {
        setFeedback({
          correta: data.correta,
          respostaCorreta: data.resposta_correta,
        })
        onResponder(selecionada)
      } else {
        setErro(data.erro || 'Não foi possível registrar sua resposta.')
      }
    } catch (error) {
      console.error('Erro ao responder ENEM:', error)
      setErro('Erro de conexão. Verifique sua internet.')
    } finally {
      setLoading(false)
    }
  }

  const getAlternativaStyle = (letra: AlternativaENEM) => {
    if (feedback) {
      if (letra === feedback.respostaCorreta) {
        return {
          background: 'var(--success-bg-15)',
          border: '2px solid var(--success)',
          color: 'var(--success)',
        }
      }
      if (letra === selecionada && !feedback.correta) {
        return {
          background: 'var(--error-bg-15)',
          border: '2px solid var(--error)',
          color: 'var(--error)',
        }
      }
      return {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        opacity: 0.5,
      }
    }

    if (selecionada === letra) {
      return {
        background: isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)',
        border: `2px solid ${corPrimaria}`,
      }
    }

    return {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER - Informações da questão
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Ano da prova */}
          <Badge variant="info">
            <Calendar className="w-3 h-3 mr-1" />
            ENEM {questao.ano_prova}
          </Badge>

          {/* Subárea (se disponível) */}
          {subareaNome && (
            <Badge variant={componente}>
              <BookOpen className="w-3 h-3 mr-1" />
              {subareaNome}
            </Badge>
          )}

          {/* Conteúdo principal (se disponível) */}
          {questao.conteudo_principal && (
            <Badge variant="secondary">
              {questao.conteudo_principal}
            </Badge>
          )}
        </div>

        {/* Cronômetro */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span
            className="text-xs font-mono tabular-nums"
            style={{ color: 'var(--text-secondary)' }}
          >
            {Math.floor(tempoDecorrido / 60)}:{String(tempoDecorrido % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ENUNCIADO (CONTEXTO)
          Ordem: Texto → Imagem → Fonte (como na prova ENEM original)
          Suporte a LaTeX/KaTeX para fórmulas matemáticas
          ═══════════════════════════════════════════════════════════════ */}
      {(() => {
        // Processa o contexto e extrai as fontes separadamente
        const contextoProcessado = processarContexto(questao.contexto)
        const { textoSemSmall, fontes } = extrairFontesDoContexto(contextoProcessado)

        // Separa em múltiplos textos (TEXTO I, TEXTO II, etc.)
        const blocos = separarMultiplosTextos(textoSemSmall)
        const temMultiplosTextos = blocos.length > 1

        // Extrai título do texto-base (se for bloco único)
        const { titulo: tituloDetectado, corpo: textoCorpo } = !temMultiplosTextos
          ? extrairTituloDoTexto(textoSemSmall)
          : { titulo: null, corpo: textoSemSmall }

        // Detecta se há fórmulas LaTeX no contexto
        const temLatex = /\$[^$]+\$|\\\(|\\\[|\\frac|\\sqrt|\\sum|\\int|\\times|\\div|\\vec/.test(questao.contexto || '')

        // Também usar o título da questão (campo titulo) se existir
        const tituloExibir = questao.titulo || tituloDetectado

        // Extrair imagens inline do contexto
        const { imagens: imagensInline } = extrairImagensInline(questao.contexto || '')

        return (
          <div
            className="flex-shrink-0 p-4 rounded-xl mb-3 max-h-[40vh] overflow-y-auto questao-contexto"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            {/* 1. Título em negrito (se houver e bloco único) */}
            {tituloExibir && !temMultiplosTextos && (
              <h3
                className="font-bold text-sm sm:text-base mb-3 pb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {tituloExibir}
              </h3>
            )}

            {/* 2. Renderizar blocos de texto */}
            {temMultiplosTextos ? (
              // Múltiplos textos (TEXTO I, TEXTO II, etc.)
              <div className="space-y-4">
                {blocos.map((bloco, idx) => {
                  const { titulo: blocoTitulo, corpo: blocoCorpo } = bloco.titulo
                    ? { titulo: null, corpo: bloco.conteudo }
                    : extrairTituloDoTexto(bloco.conteudo)

                  return (
                    <div key={idx}>
                      {/* Cabeçalho do bloco (TEXTO I, TEXTO II...) */}
                      {bloco.titulo && (
                        <h4
                          className="font-bold text-xs sm:text-sm mb-2 uppercase tracking-wide"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {bloco.titulo}
                        </h4>
                      )}
                      {/* Título interno do bloco */}
                      {blocoTitulo && (
                        <h3
                          className="font-bold text-sm sm:text-base mb-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {blocoTitulo}
                        </h3>
                      )}
                      {/* Conteúdo do bloco */}
                      {temLatex ? (
                        <ConteudoQuestao
                          conteudo={blocoTitulo ? blocoCorpo : bloco.conteudo}
                          tipo="contexto"
                        />
                      ) : (
                        <div
                          className="text-sm sm:text-base leading-relaxed questao-texto"
                          style={{ color: 'var(--text-primary)' }}
                          dangerouslySetInnerHTML={{ __html: blocoTitulo ? blocoCorpo : bloco.conteudo }}
                        />
                      )}
                      {/* Separador entre blocos */}
                      {idx < blocos.length - 1 && (
                        <div className="mt-3 pt-1" style={{ borderBottom: '1px dashed var(--border-default)' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              // Bloco único
              (tituloDetectado ? textoCorpo : textoSemSmall) && (
                temLatex ? (
                  <ConteudoQuestao
                    conteudo={tituloDetectado ? textoCorpo : textoSemSmall}
                    tipo="contexto"
                  />
                ) : (
                  <div
                    className="text-sm sm:text-base leading-relaxed questao-texto"
                    style={{ color: 'var(--text-primary)' }}
                    dangerouslySetInnerHTML={{ __html: tituloDetectado ? textoCorpo : textoSemSmall }}
                  />
                )
              )
            )}

            {/* 3. Imagem principal do contexto - RESPONSIVA E AMPLIÁVEL */}
            {isValidImageUrl(questao.imagem_principal) && (
              <div className="my-4">
                <ImagemQuestao
                  src={questao.imagem_principal}
                  alt="Imagem da questão"
                  tipo="principal"
                  onExpandir={setImagemExpandida}
                />
              </div>
            )}

            {/* 3b. Imagens extras (se houver) - GRID RESPONSIVO */}
            {questao.imagens_extras && questao.imagens_extras.length > 0 && (
              <div className={`
                grid gap-3 my-4
                ${questao.imagens_extras.filter(isValidImageUrl).length === 1
                  ? 'grid-cols-1 max-w-lg mx-auto'
                  : 'grid-cols-1 sm:grid-cols-2'}
              `}>
                {questao.imagens_extras.filter(isValidImageUrl).map((img, idx) => (
                  <ImagemQuestao
                    key={idx}
                    src={img}
                    alt={`Imagem ${idx + 2} da questão`}
                    tipo="extra"
                    onExpandir={setImagemExpandida}
                  />
                ))}
              </div>
            )}

            {/* 3c. Imagens inline extraídas do texto */}
            {imagensInline.length > 0 && !isValidImageUrl(questao.imagem_principal) && (
              <div className={`
                grid gap-3 my-4
                ${imagensInline.length === 1
                  ? 'grid-cols-1 max-w-lg mx-auto'
                  : 'grid-cols-1 sm:grid-cols-2'}
              `}>
                {imagensInline.map((img, idx) => (
                  <ImagemQuestao
                    key={`inline-${idx}`}
                    src={img}
                    alt={`Imagem ${idx + 1} do contexto`}
                    tipo={imagensInline.length === 1 ? 'principal' : 'extra'}
                    onExpandir={setImagemExpandida}
                  />
                ))}
              </div>
            )}

            {/* 4. Fontes/Referências - Separadas por linha em branco, alinhadas à direita */}
            {fontes.length > 0 && (
              <div
                className="mt-6 pt-3"
                style={{ borderTop: '1px solid var(--border-default)' }}
              >
                {fontes.map((fonte, index) => (
                  <p
                    key={index}
                    className="text-xs sm:text-sm leading-relaxed italic text-right mt-1"
                    style={{ color: 'var(--text-muted)' }}
                    dangerouslySetInnerHTML={{ __html: fonte }}
                  />
                ))}
              </div>
            )}

            {/* 5. Comando (texto antes das alternativas) */}
            {questao.comando && (
              <div className="mt-4 pt-3 border-t border-[var(--border-default)]">
                {temLatex || /\$[^$]+\$/.test(questao.comando) ? (
                  <ConteudoQuestao
                    conteudo={questao.comando}
                    tipo="comando"
                  />
                ) : (
                  <p
                    className="text-sm sm:text-base font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {questao.comando}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          ALTERNATIVAS (5)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-2 sm:space-y-3 flex-shrink-0">
        {alternativas.map(({ letra, texto, imagem }) => {
          const style = getAlternativaStyle(letra)
          return (
            <button
              key={letra}
              onClick={() => !feedback && !loading && setSelecionada(letra)}
              disabled={!!feedback || loading}
              className="w-full min-h-[52px] sm:min-h-[56px] px-3 sm:px-4 py-3 rounded-xl flex items-start gap-3 transition-all active:scale-[0.98] text-left"
              style={style}
            >
              {/* Letra da alternativa */}
              <span
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0 text-sm sm:text-base"
                style={{
                  background:
                    feedback && letra === feedback.respostaCorreta
                      ? 'var(--success)'
                      : feedback && letra === selecionada && !feedback.correta
                        ? 'var(--error)'
                        : selecionada === letra
                          ? corPrimaria
                          : 'var(--bg-elevated)',
                  color:
                    (feedback && (letra === feedback.respostaCorreta || (letra === selecionada && !feedback.correta))) ||
                    selecionada === letra
                      ? isFisica
                        ? 'var(--text-on-fisica)'
                        : 'var(--text-on-matematica)'
                      : 'var(--text-muted)',
                }}
              >
                {feedback && letra === feedback.respostaCorreta ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : feedback && letra === selecionada && !feedback.correta ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  letra
                )}
              </span>

              {/* Conteúdo da alternativa */}
              <div className="flex-1 min-w-0">
                {/* Imagem da alternativa (se houver e for válida) - AMPLIÁVEL */}
                {isValidImageUrl(imagem) && (
                  <div className="mb-2">
                    <ImagemQuestao
                      src={imagem}
                      alt={`Alternativa ${letra}`}
                      tipo="alternativa"
                      onExpandir={setImagemExpandida}
                    />
                  </div>
                )}
                {/* Texto da alternativa (com suporte a LaTeX) */}
                {texto ? (
                  /\$[^$]+\$|\\frac|\\sqrt|\\times/.test(texto) ? (
                    <ConteudoQuestao
                      conteudo={texto}
                      tipo="alternativa"
                      className="flex-1"
                    />
                  ) : (
                    <span
                      className="text-sm sm:text-base leading-snug"
                      style={{ color: 'var(--text-primary)' }}
                      dangerouslySetInnerHTML={{ __html: texto }}
                    />
                  )
                ) : (
                  <span
                    className="text-sm italic"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    (alternativa sem texto)
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ERRO
          ═══════════════════════════════════════════════════════════════ */}
      {erro && (
        <div
          className="rounded-xl p-3 mt-3"
          style={{
            background: 'var(--error-bg-15)',
            border: '1px solid var(--error-bg-30)',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--error)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {erro}
              </p>
              <button
                onClick={handleConfirmar}
                className="text-xs underline mt-1"
                style={{ color: 'var(--error)' }}
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          FEEDBACK - Sem explicação detalhada (ENEM não fornece)
          ═══════════════════════════════════════════════════════════════ */}
      {feedback && (
        <div
          className="rounded-xl p-4 mt-3 animate-fade-in"
          style={{
            background: feedback.correta
              ? 'var(--success-bg-15)'
              : 'var(--error-bg-15)',
            border: `1px solid ${feedback.correta ? 'var(--color-fisica-bg-40)' : 'var(--error-bg-40)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: feedback.correta
                  ? 'var(--color-fisica-bg-20)'
                  : 'var(--error-bg-20)',
              }}
            >
              {feedback.correta ? (
                <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--success)' }} />
              ) : (
                <XCircle className="w-6 h-6" style={{ color: 'var(--error)' }} />
              )}
            </div>
            <div className="flex-1">
              <span
                className="font-semibold text-base"
                style={{ color: feedback.correta ? 'var(--success)' : 'var(--error)' }}
              >
                {feedback.correta ? 'Resposta Correta!' : 'Resposta Incorreta'}
              </span>
              {!feedback.correta && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  A alternativa correta era:{' '}
                  <strong style={{ color: 'var(--success)' }}>{feedback.respostaCorreta}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Estatísticas atualizadas */}
          {estatisticas && (
            <div
              className="flex items-center justify-around mt-4 pt-3"
              style={{ borderTop: '1px solid var(--border-default)' }}
            >
              <div className="text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Respondidas
                </p>
                <p className="text-lg font-bold" style={{ color: corPrimaria }}>
                  {estatisticas.total_questoes}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Acertos
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>
                  {estatisticas.total_corretas}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Taxa
                </p>
                <p
                  className="text-lg font-bold"
                  style={{
                    color:
                      estatisticas.taxa_acerto >= 60
                        ? 'var(--success)'
                        : estatisticas.taxa_acerto >= 40
                          ? 'var(--warning)'
                          : 'var(--error)',
                  }}
                >
                  {estatisticas.taxa_acerto}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BOTÕES DE AÇÃO
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex gap-2 mt-4 pt-2">
        {feedback ? (
          <>
            <Button variant="secondary" onClick={onVoltar} className="flex-1 min-h-[48px]">
              Menu
            </Button>
            <Button
              variant={isFisica ? 'fisica' : 'matematica'}
              onClick={onProxima}
              className="flex-1 min-h-[48px]"
            >
              Próxima
            </Button>
          </>
        ) : (
          <Button
            variant={isFisica ? 'fisica' : 'matematica'}
            onClick={handleConfirmar}
            disabled={!selecionada || loading}
            loading={loading}
            className="w-full min-h-[52px] text-base"
          >
            {selecionada ? 'Confirmar Resposta' : 'Selecione uma alternativa'}
          </Button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL DE IMAGEM EXPANDIDA
          Com zoom, pan e suporte a gestos touch
          ═══════════════════════════════════════════════════════════════ */}
      {imagemExpandida && (
        <ImagemModal
          src={imagemExpandida}
          alt="Imagem da questão ampliada"
          onClose={() => setImagemExpandida(null)}
        />
      )}
    </div>
  )
}
