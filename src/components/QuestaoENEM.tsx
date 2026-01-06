'use client'

import { useState } from 'react'
import Image from 'next/image'
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
} from 'lucide-react'
import Button from './ui/Button'
import Badge from './ui/Badge'
import SafeImage, { isValidImageUrl } from './ui/SafeImage'
import type { QuestaoENEM, AlternativaENEM, AreaENEM, Componente } from '@/types'
import { ENEM_CONFIG } from '@/types'

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

  // Alternativas do ENEM (5)
  const alternativas: { letra: AlternativaENEM; texto: string; imagem?: string }[] = [
    { letra: 'A', texto: questao.alternativa_a, imagem: questao.imagem_a },
    { letra: 'B', texto: questao.alternativa_b, imagem: questao.imagem_b },
    { letra: 'C', texto: questao.alternativa_c, imagem: questao.imagem_c },
    { letra: 'D', texto: questao.alternativa_d, imagem: questao.imagem_d },
    { letra: 'E', texto: questao.alternativa_e, imagem: questao.imagem_e },
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
          background: 'rgba(34, 197, 94, 0.15)',
          border: '2px solid var(--success)',
          color: 'var(--success)',
        }
      }
      if (letra === selecionada && !feedback.correta) {
        return {
          background: 'rgba(239, 68, 68, 0.15)',
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
        background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
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
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 p-4 rounded-xl mb-3 max-h-[40vh] overflow-y-auto"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        {/* Imagem principal do contexto */}
        {isValidImageUrl(questao.imagem_principal) && (
          <div className="mb-4 relative">
            <div className="relative w-full max-w-md mx-auto">
              <SafeImage
                src={questao.imagem_principal}
                alt="Imagem da questão"
                width={600}
                height={400}
                className="rounded-lg object-contain w-full h-auto max-h-[250px] cursor-pointer"
                onClick={() => setImagemExpandida(questao.imagem_principal || null)}
                showPlaceholder
                fallback={
                  <div className="flex items-center justify-center bg-[var(--bg-elevated)] rounded-lg p-4 min-h-[100px]">
                    <div className="text-center">
                      <ImageOff className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]" />
                      <span className="text-xs text-[var(--text-muted)]">Imagem indisponível</span>
                    </div>
                  </div>
                }
              />
              <button
                onClick={() => setImagemExpandida(questao.imagem_principal || null)}
                className="absolute top-2 right-2 p-1.5 rounded-lg transition-all"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <ZoomIn className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>
        )}

        {/* Texto do contexto/enunciado */}
        <div
          className="text-sm sm:text-base leading-relaxed prose prose-sm max-w-none"
          style={{ color: 'var(--text-primary)' }}
          dangerouslySetInnerHTML={{ __html: questao.contexto }}
        />

        {/* Comando (texto antes das alternativas) */}
        {questao.comando && (
          <p
            className="text-sm sm:text-base font-medium mt-4"
            style={{ color: 'var(--text-primary)' }}
          >
            {questao.comando}
          </p>
        )}
      </div>

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
                        ? '#000'
                        : '#fff'
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
                {/* Imagem da alternativa (se houver e for válida) */}
                {isValidImageUrl(imagem) && (
                  <div className="mb-2">
                    <SafeImage
                      src={imagem}
                      alt={`Alternativa ${letra}`}
                      width={200}
                      height={150}
                      className="rounded object-contain max-h-[100px] w-auto"
                      showPlaceholder={false}
                    />
                  </div>
                )}
                {/* Texto da alternativa */}
                <span
                  className="text-sm sm:text-base"
                  style={{ color: 'var(--text-primary)' }}
                  dangerouslySetInnerHTML={{ __html: texto }}
                />
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
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
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
              ? 'rgba(34, 197, 94, 0.15)'
              : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.correta ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: feedback.correta
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)',
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
          ═══════════════════════════════════════════════════════════════ */}
      {imagemExpandida && isValidImageUrl(imagemExpandida) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setImagemExpandida(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ background: 'var(--bg-surface)' }}
            onClick={() => setImagemExpandida(null)}
          >
            <X className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </button>
          <SafeImage
            src={imagemExpandida}
            alt="Imagem expandida"
            width={1200}
            height={800}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            showPlaceholder
            fallback={
              <div className="flex items-center justify-center bg-[var(--bg-surface)] rounded-lg p-8">
                <div className="text-center">
                  <ImageOff className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-muted)]">Imagem não disponível</span>
                </div>
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}
