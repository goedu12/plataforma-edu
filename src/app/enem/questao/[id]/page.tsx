'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  X,
  AlertTriangle,
  BookOpen,
  RotateCcw,
  Shuffle,
  ZoomIn,
} from 'lucide-react'
import ImagemModal from '@/components/ui/ImagemModal'
import { processarContexto, isValidImageUrl } from '@/lib/limpezaTexto'

// ═══════════════════════════════════════════════════════════════════════════
// PÁGINA DE QUESTÃO ENEM — /enem/questao/[id]
//
// Modos:
// - /enem/questao/{uuid}         → questão específica por ID
// - /enem/questao/aleatorio      → questão aleatória com filtros
// - ?modo=simulado               → navegação sequencial prev/next
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_BASE_URL = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/enem-imagens/'

interface Alternativa {
  letra: string
  texto: string
  imagem: string | null
  tipo: 'texto' | 'imagem'
}

interface QuestaoData {
  id: string
  id_api: string
  ano_prova: number
  dia?: number
  numero_questao: number
  caderno?: string
  area: string
  area_nome: string
  componente?: string
  lingua_estrangeira?: string | null
  titulo?: string | null
  contexto: string
  comando?: string | null
  enunciado_html?: string | null
  imagem_principal?: string | null
  imagens_extras?: string[]
  todas_imagens?: string[]
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  imagem_a?: string | null
  imagem_b?: string | null
  imagem_c?: string | null
  imagem_d?: string | null
  imagem_e?: string | null
  alt_a_tipo?: 'texto' | 'imagem'
  alt_b_tipo?: 'texto' | 'imagem'
  alt_c_tipo?: 'texto' | 'imagem'
  alt_d_tipo?: 'texto' | 'imagem'
  alt_e_tipo?: 'texto' | 'imagem'
  fonte?: string | null
  anulada?: boolean
  tem_imagem?: boolean
  tem_formula?: boolean
  alternativas?: Alternativa[]
  textos_motivadores_json?: any[]
  imagens_json?: any[]
}

type EstadoQuestao = 'carregando' | 'exibindo' | 'respondida' | 'erro'

// Garantir que URLs de imagem são absolutas
function ensureAbsoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  return `${STORAGE_BASE_URL}${url}`
}

// Processar HTML: converter img src relativos para absolutos (safety net)
function fixHtmlImageUrls(html: string): string {
  return html.replace(
    /(<img\s[^>]*?src\s*=\s*["'])(?!https?:\/\/|data:)([^"']+)(["'])/gi,
    (_, pre, path, suf) => `${pre}${STORAGE_BASE_URL}${path}${suf}`
  )
}

// Verificar se o comando deve ser exibido
function comandoValido(cmd: string | null | undefined): boolean {
  if (!cmd) return false
  const t = cmd.trim().toLowerCase()
  if (t.length < 10) return false
  if (t.startsWith('descrição da imagem') || t.startsWith('descricao da imagem')) return false
  if (/^\[["']/.test(t)) return false
  return true
}

export default function QuestaoENEMPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string

  // Estado
  const [questao, setQuestao] = useState<QuestaoData | null>(null)
  const [estado, setEstado] = useState<EstadoQuestao>('carregando')
  const [erro, setErro] = useState<string | null>(null)

  // Resposta
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [confirmada, setConfirmada] = useState(false)
  const [respostaCorreta, setRespostaCorreta] = useState<string | null>(null)
  const [acertou, setAcertou] = useState<boolean | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState<{
    total_questoes: number
    total_corretas: number
    taxa_acerto: number
  } | null>(null)

  // Timer
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Imagem expandida
  const [imagemExpandida, setImagemExpandida] = useState<string | null>(null)
  const [imagensComErro, setImagensComErro] = useState<Set<string>>(new Set())

  const handleImageError = (url: string) => {
    setImagensComErro(prev => new Set(prev).add(url))
  }

  // Navegação simulado
  const [listaIds, setListaIds] = useState<string[]>([])
  const modoSimulado = searchParams.get('modo') === 'simulado'

  const iniciarTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setTempoDecorrido(p => p + 1), 1000)
  }, [])

  const pararTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Buscar questão
  const carregarQuestao = useCallback(async () => {
    setEstado('carregando')
    setQuestao(null)
    setSelecionada(null)
    setConfirmada(false)
    setRespostaCorreta(null)
    setAcertou(null)
    setTempoDecorrido(0)
    setImagensComErro(new Set())
    pararTimer()

    try {
      let url: string

      if (id === 'aleatorio') {
        // Modo aleatório — usar a API existente de questão aleatória
        const p = new URLSearchParams()
        const ano = searchParams.get('ano')
        const dia = searchParams.get('dia')
        const area = searchParams.get('area')
        const lingua = searchParams.get('lingua')
        if (ano) p.set('ano', ano)
        if (dia) p.set('dia', dia)
        if (area) p.set('area', area)
        if (lingua) p.set('lingua', lingua)
        url = `/api/enem?${p}`
      } else {
        // Questão específica por UUID — buscar direto pela tabela
        // A API suporta busca por id_api; tentamos isso primeiro
        url = `/api/enem?id_api=${encodeURIComponent(id)}`
      }

      const res = await fetch(url)
      const data = await res.json()

      if (!data.sucesso) {
        if (data.status === 'SEM_QUESTOES' || data.status === 'TODAS_RESPONDIDAS') {
          setErro(data.mensagem || 'Nenhuma questão disponível.')
        } else {
          setErro(data.erro || 'Erro ao carregar questão')
        }
        setEstado('erro')
        return
      }

      if (data.questao) {
        setQuestao(data.questao)
        setEstado('exibindo')
        iniciarTimer()
      } else {
        setErro('Questão não encontrada.')
        setEstado('erro')
      }
    } catch {
      setErro('Erro de conexão. Verifique sua internet.')
      setEstado('erro')
    }
  }, [id, searchParams, iniciarTimer, pararTimer])

  useEffect(() => {
    carregarQuestao()
    return () => pararTimer()
  }, [carregarQuestao, pararTimer])

  // Carregar lista de IDs para navegação de simulado
  useEffect(() => {
    if (!modoSimulado) return
    const carregarLista = async () => {
      const p = new URLSearchParams({ modo: 'listar', limit: '100' })
      const ano = searchParams.get('ano')
      const dia = searchParams.get('dia')
      const area = searchParams.get('area')
      const lingua = searchParams.get('lingua')
      if (ano) p.set('ano', ano)
      if (dia) p.set('dia', dia)
      if (area) p.set('area', area)
      if (lingua) p.set('lingua', lingua)
      try {
        const res = await fetch(`/api/enem?${p}`)
        const data = await res.json()
        if (data.sucesso && data.questoes) {
          setListaIds(data.questoes.map((q: any) => q.id))
        }
      } catch { /* ignore */ }
    }
    carregarLista()
  }, [modoSimulado, searchParams])

  // Submeter resposta
  const submeterResposta = async () => {
    if (!questao || !selecionada || enviando) return
    setEnviando(true)
    pararTimer()

    try {
      const res = await fetch('/api/enem/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questao_id: questao.id,
          resposta: selecionada,
          tempo_segundos: tempoDecorrido,
        }),
      })
      const data = await res.json()

      if (data.sucesso) {
        setRespostaCorreta(data.resposta_correta)
        setAcertou(data.correta)
        setConfirmada(true)
        setEstado('respondida')
        if (data.estatisticas) setEstatisticas(data.estatisticas)
      } else {
        setErro(data.erro || 'Erro ao enviar resposta')
      }
    } catch {
      setErro('Erro de conexão ao enviar resposta')
    } finally {
      setEnviando(false)
    }
  }

  // Navegação prev/next no simulado
  const currentIndex = questao ? listaIds.indexOf(questao.id) : -1
  const hasPrev = modoSimulado && currentIndex > 0
  const hasNext = modoSimulado && currentIndex < listaIds.length - 1

  const navigateTo = (newId: string) => {
    const p = new URLSearchParams(searchParams.toString())
    router.push(`/enem/questao/${newId}?${p}`)
  }

  const formatarTempo = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // Helper para estilo das alternativas
  const getAlternativaStyle = (letra: string) => {
    if (confirmada) {
      if (letra === respostaCorreta) {
        return { bg: 'var(--success-bg-12)', border: 'var(--success)' }
      }
      if (letra === selecionada && !acertou) {
        return { bg: 'var(--error-bg-12)', border: 'var(--error)' }
      }
      return { bg: 'var(--bg-surface)', border: 'var(--border-default)' }
    }
    if (selecionada === letra) {
      return { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6' }
    }
    return { bg: 'var(--bg-surface)', border: 'var(--border-default)' }
  }

  // Handler para clique em imagens dentro do enunciado HTML
  const handleEnunciadoClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      const src = (target as HTMLImageElement).src
      if (src) setImagemExpandida(src)
    }
  }

  // ═══ RENDER — CARREGANDO ═══
  if (estado === 'carregando') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#3b82f6' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando questão...</p>
        </div>
      </div>
    )
  }

  // ═══ RENDER — ERRO ═══
  if (estado === 'erro' || !questao) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center max-w-sm mx-auto px-4">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--error)' }} />
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {erro || 'Questão não encontrada.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/enem')}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
            </button>
            <button
              onClick={carregarQuestao}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#3b82f6', color: '#fff' }}
            >
              <RotateCcw className="w-4 h-4 inline mr-1" /> Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══ MONTAR ALTERNATIVAS ═══
  const alternativas: Alternativa[] = (questao.alternativas && questao.alternativas.length > 0)
    ? questao.alternativas
    : [
        { letra: 'A', texto: questao.alternativa_a, imagem: ensureAbsoluteUrl(questao.imagem_a), tipo: questao.alt_a_tipo || 'texto' },
        { letra: 'B', texto: questao.alternativa_b, imagem: ensureAbsoluteUrl(questao.imagem_b), tipo: questao.alt_b_tipo || 'texto' },
        { letra: 'C', texto: questao.alternativa_c, imagem: ensureAbsoluteUrl(questao.imagem_c), tipo: questao.alt_c_tipo || 'texto' },
        { letra: 'D', texto: questao.alternativa_d, imagem: ensureAbsoluteUrl(questao.imagem_d), tipo: questao.alt_d_tipo || 'texto' },
        { letra: 'E', texto: questao.alternativa_e, imagem: ensureAbsoluteUrl(questao.imagem_e), tipo: questao.alt_e_tipo || 'texto' },
      ]

  // ═══ RENDER — QUESTÃO ═══
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* ─── HEADER ─── */}
      <header
        className="sticky top-0 z-10 px-3 py-2.5 flex items-center justify-between"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/enem')} className="p-1">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: '#3b82f6', color: '#fff' }}
            >
              ENEM {questao.ano_prova}
            </span>
            {questao.dia && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                Dia {questao.dia}
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              Q{questao.numero_questao}
            </span>
            {questao.anulada && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--warning-bg-15)', color: 'var(--warning)' }}
              >
                Anulada
              </span>
            )}
          </div>
        </div>

        {/* Timer */}
        {!confirmada && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs"
            style={{ background: 'var(--bg-elevated)', color: '#3b82f6' }}
          >
            <Clock className="w-3.5 h-3.5" />
            {formatarTempo(tempoDecorrido)}
          </div>
        )}
      </header>

      {/* ─── CONTEÚDO ─── */}
      <main className="flex-1 overflow-auto max-w-3xl mx-auto w-full p-4 space-y-4">
        {/* Área / Componente / Idioma */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            <BookOpen className="w-3 h-3" />
            {questao.area_nome || questao.area}
          </span>
          {questao.lingua_estrangeira && (
            <span
              className="text-xs px-2.5 py-1 rounded-full capitalize"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            >
              {questao.lingua_estrangeira}
            </span>
          )}
          {questao.titulo && (
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            >
              {questao.titulo}
            </span>
          )}
        </div>

        {/* ─── ENUNCIADO ─── */}
        {(() => {
          // Preparar dados
          const temHtml = !!(questao.enunciado_html && questao.enunciado_html.trim().length > 20)
          const htmlProcessado = temHtml ? fixHtmlImageUrls(questao.enunciado_html!) : null
          const contextoHtml = !temHtml && questao.contexto
            ? processarContexto(questao.contexto, { removerImagens: false })
            : null
          // Imagens separadas (da API ou consolidadas)
          const todasImagens = (questao.todas_imagens || [
            questao.imagem_principal,
            ...(questao.imagens_extras || []),
          ]).filter((img): img is string => !!img && isValidImageUrl(img) && !imagensComErro.has(img))

          return (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div className="p-4 sm:p-5">
                {/* MODO 1: enunciado_html (questões com HTML completo, ex: ENEM 2024/2025) */}
                {htmlProcessado ? (
                  <div
                    className="enem-enunciado-html"
                    dangerouslySetInnerHTML={{ __html: htmlProcessado }}
                    onClick={handleEnunciadoClick}
                  />
                ) : (
                  /* MODO 2: contexto + imagens separadas + comando (questões antigas) */
                  <>
                    {/* Título */}
                    {questao.titulo && (
                      <h3 className="font-bold text-base sm:text-lg mb-3" style={{ color: 'var(--text-primary)' }}>
                        {questao.titulo}
                      </h3>
                    )}

                    {/* Contexto processado (markdown → HTML com imagens inline) */}
                    {contextoHtml && (
                      <div
                        className="enem-enunciado-html texto-questao"
                        dangerouslySetInnerHTML={{ __html: contextoHtml }}
                        onClick={handleEnunciadoClick}
                      />
                    )}

                    {/* Galeria de imagens separadas */}
                    {todasImagens.length > 0 && (
                      <div className="my-4 flex flex-col items-center gap-3">
                        {todasImagens.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setImagemExpandida(img)}
                            className="relative rounded-lg overflow-hidden group inline-block"
                            style={{ background: 'var(--bg-elevated)' }}
                          >
                            <img
                              src={img}
                              alt={`Figura ${idx + 1}`}
                              className="max-w-full max-h-[350px] sm:max-h-[450px] h-auto object-contain"
                              onError={() => handleImageError(img)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all drop-shadow-md" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Comando (pergunta) */}
                    {comandoValido(questao.comando) && (
                      <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                        <p className="text-sm sm:text-base leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>
                          {questao.comando}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })()}

        {/* ─── ALTERNATIVAS (A-E) ─── */}
        <div className="space-y-2">
          {alternativas.map((alt) => {
            const style = getAlternativaStyle(alt.letra)
            const isImagemAlternativa = alt.tipo === 'imagem' || alt.texto === '[Imagem]'
            const imgUrl = alt.imagem ? ensureAbsoluteUrl(alt.imagem) : null
            const temImagem = imgUrl && imgUrl !== 'null' && isValidImageUrl(imgUrl) && !imagensComErro.has(imgUrl)
            const dimmed = confirmada && alt.letra !== respostaCorreta && alt.letra !== selecionada

            return (
              <button
                key={alt.letra}
                onClick={() => !confirmada && !enviando && setSelecionada(alt.letra)}
                disabled={confirmada || enviando}
                className="w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all disabled:cursor-default"
                style={{
                  background: style.bg,
                  border: `2px solid ${style.border}`,
                  opacity: dimmed ? 0.5 : 1,
                }}
              >
                {/* Letra da alternativa */}
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: selecionada === alt.letra || (confirmada && alt.letra === respostaCorreta)
                      ? style.border
                      : 'var(--bg-elevated)',
                    color: selecionada === alt.letra || (confirmada && alt.letra === respostaCorreta)
                      ? '#fff'
                      : 'var(--text-muted)',
                  }}
                >
                  {confirmada && alt.letra === respostaCorreta ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : confirmada && alt.letra === selecionada && !acertou ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    alt.letra
                  )}
                </span>

                {/* Conteúdo da alternativa */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {/* Caso 1: alternativa é imagem (alt_X_tipo === "imagem") */}
                  {isImagemAlternativa && temImagem ? (
                    <div>
                      <img
                        src={imgUrl!}
                        alt={`Alternativa ${alt.letra}`}
                        className="max-h-32 sm:max-h-40 w-auto object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImagemExpandida(imgUrl!)
                        }}
                        onError={() => handleImageError(imgUrl!)}
                      />
                    </div>
                  ) : temImagem ? (
                    /* Caso 2: alternativa tem texto E imagem */
                    <>
                      <img
                        src={imgUrl!}
                        alt={`Alternativa ${alt.letra}`}
                        className="max-h-24 w-auto object-contain rounded-lg mb-2 cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImagemExpandida(imgUrl!)
                        }}
                        onError={() => handleImageError(imgUrl!)}
                      />
                      {alt.texto && alt.texto !== '[Imagem]' && (
                        <span className="text-sm leading-relaxed block" style={{ color: 'var(--text-primary)' }}>
                          {alt.texto}
                        </span>
                      )}
                    </>
                  ) : (
                    /* Caso 3: alternativa só texto */
                    <span
                      className="text-sm leading-relaxed block"
                      style={{ color: (alt.texto && alt.texto !== '[Imagem]') ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    >
                      {alt.texto && alt.texto !== '[Imagem]' ? alt.texto : '(sem texto)'}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* ─── FEEDBACK ─── */}
        {confirmada && (
          <div
            className="rounded-xl p-4"
            style={{ background: acertou ? 'var(--success-bg-12)' : 'var(--error-bg-12)' }}
          >
            <div className="flex items-center gap-3">
              {acertou ? (
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--success)' }} />
              ) : (
                <XCircle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--error)' }} />
              )}
              <div className="flex-1">
                <span
                  className="font-semibold text-base"
                  style={{ color: acertou ? 'var(--success)' : 'var(--error)' }}
                >
                  {acertou ? 'Resposta Correta!' : 'Resposta Incorreta'}
                </span>
                {!acertou && respostaCorreta && (
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    A alternativa correta era:{' '}
                    <strong style={{ color: 'var(--success)' }}>{respostaCorreta}</strong>
                  </p>
                )}
              </div>
              <span className="text-sm font-mono flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {formatarTempo(tempoDecorrido)}
              </span>
            </div>

            {/* Estatísticas atualizadas */}
            {estatisticas && (
              <div
                className="flex items-center justify-around mt-4 pt-3"
                style={{ borderTop: '1px solid var(--border-default)' }}
              >
                <div className="text-center">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Respondidas</p>
                  <p className="text-xl font-bold" style={{ color: '#3b82f6' }}>{estatisticas.total_questoes}</p>
                </div>
                <div className="w-px h-8" style={{ background: 'var(--border-default)' }} />
                <div className="text-center">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Acertos</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>{estatisticas.total_corretas}</p>
                </div>
                <div className="w-px h-8" style={{ background: 'var(--border-default)' }} />
                <div className="text-center">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Taxa</p>
                  <p
                    className="text-xl font-bold"
                    style={{
                      color: estatisticas.taxa_acerto >= 60 ? 'var(--success)'
                        : estatisticas.taxa_acerto >= 40 ? 'var(--warning)'
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

        {/* ─── BOTÕES DE AÇÃO ─── */}
        <div className="flex gap-2 pb-6">
          {confirmada ? (
            <>
              {/* Prev (simulado) */}
              {hasPrev && (
                <button
                  onClick={() => navigateTo(listaIds[currentIndex - 1])}
                  className="p-3 rounded-xl"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => router.push('/enem')}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                Voltar ao Menu
              </button>

              {/* Next (simulado) ou Questão Aleatória */}
              {hasNext ? (
                <button
                  onClick={() => navigateTo(listaIds[currentIndex + 1])}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                  style={{ background: '#3b82f6', color: '#fff' }}
                >
                  Próxima <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    const p = new URLSearchParams()
                    const ano = searchParams.get('ano')
                    const dia = searchParams.get('dia')
                    const area = searchParams.get('area')
                    const lingua = searchParams.get('lingua')
                    if (ano) p.set('ano', ano)
                    if (dia) p.set('dia', dia)
                    if (area) p.set('area', area)
                    if (lingua) p.set('lingua', lingua)
                    router.push(`/enem/questao/aleatorio?${p}`)
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                  style={{ background: '#3b82f6', color: '#fff' }}
                >
                  <Shuffle className="w-4 h-4" /> Próxima
                </button>
              )}
            </>
          ) : (
            <button
              onClick={submeterResposta}
              disabled={!selecionada || enviando}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: '#3b82f6', color: '#fff' }}
            >
              {enviando ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
              ) : selecionada ? (
                'Confirmar Resposta'
              ) : (
                'Selecione uma alternativa'
              )}
            </button>
          )}
        </div>
      </main>

      {/* ─── MODAL DE IMAGEM EXPANDIDA ─── */}
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
