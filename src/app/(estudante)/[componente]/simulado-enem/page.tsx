'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  Calendar,
  ChevronDown,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  ZoomIn,
  X,
  RotateCcw,
  Target,
  BookOpen,
  Filter,
  Beaker,
  Calculator,
  Languages,
  Globe,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import { processarContexto, processarTexto, isValidImageUrl } from '@/lib/limpezaTexto'
import { ENEM_CONFIG } from '@/types'
import type { Componente, AreaENEM, SubareaENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// SIMULADO ENEM - Interface com Filtros Avançados
// Versão 3.0 - Com filtro de qualidade e melhor apresentação
// ═══════════════════════════════════════════════════════════════════════════

interface Questao {
  id: string
  ano_prova: number
  numero_questao: number
  area: AreaENEM
  area_nome: string
  subarea: SubareaENEM
  subarea_nome: string
  contexto: string
  comando: string | null
  todas_imagens: string[]
  alternativas: Array<{
    letra: string
    texto: string
    imagem: string | null
  }>
}

interface Estatisticas {
  total_questoes: number
  total_corretas: number
  taxa_acerto: number
}

type Status = 'carregando' | 'ok' | 'sem_questoes' | 'erro' | 'acesso_negado'

// Ícones para áreas
const AREA_ICONS: Record<AreaENEM, typeof Beaker> = {
  'ciencias-natureza': Beaker,
  'matematica': Calculator,
  'linguagens': Languages,
  'ciencias-humanas': Globe,
}

// Verifica se o comando deve ser exibido
function deveExibirComando(comando: string | null | undefined): boolean {
  if (!comando) return false
  const textoLimpo = comando.trim().toLowerCase()
  if (textoLimpo.startsWith('descrição da imagem')) return false
  if (textoLimpo.startsWith('descricao da imagem')) return false
  if (textoLimpo.startsWith('["descrição')) return false
  if (/^\[["']/.test(textoLimpo)) return false
  if (textoLimpo.length < 10) return false
  return true
}

// Processa texto para HTML
function processarTextoQuestao(texto: string | null | undefined, removerImagens = false): { __html: string } {
  if (!texto) return { __html: '' }
  const processado = processarContexto(texto, { removerImagens })
  return { __html: processado }
}

export default function SimuladoENEMPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Estados principais
  const [status, setStatus] = useState<Status>('carregando')
  const [questao, setQuestao] = useState<Questao | null>(null)
  const [respostaCorreta, setRespostaCorreta] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Filtros disponíveis
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])
  const [areasDisponiveis, setAreasDisponiveis] = useState<AreaENEM[]>([])
  const [subareasDisponiveis, setSubareasDisponiveis] = useState<SubareaENEM[]>([])

  // Filtros selecionados
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null)
  const [areaSelecionada, setAreaSelecionada] = useState<AreaENEM | null>(null)
  const [subareaSelecionada, setSubareaSelecionada] = useState<SubareaENEM | null>(null)
  const [mostrarFiltro, setMostrarFiltro] = useState(false)

  // Resposta
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<string | null>(null)
  const [respondida, setRespondida] = useState(false)
  const [acertou, setAcertou] = useState<boolean | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Timer
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [totalQuestoes, setTotalQuestoes] = useState(0)
  const [disponiveis, setDisponiveis] = useState(0)

  // Zoom de imagem
  const [imagemZoom, setImagemZoom] = useState<string | null>(null)
  const [imagensComErro, setImagensComErro] = useState<Set<string>>(new Set())

  // Cores
  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Handler para erro de imagem
  const handleImageError = (url: string) => {
    setImagensComErro(prev => new Set(prev).add(url))
  }

  // Buscar questão
  const buscarQuestao = async () => {
    setStatus('carregando')
    setQuestao(null)
    setRespostaCorreta(null)
    setAlternativaSelecionada(null)
    setRespondida(false)
    setAcertou(null)
    setTempoDecorrido(0)
    setImagensComErro(new Set())
    pararTimer()

    try {
      const urlParams = new URLSearchParams()
      if (anoSelecionado) urlParams.set('ano', String(anoSelecionado))
      if (areaSelecionada) urlParams.set('area', areaSelecionada)
      if (subareaSelecionada) urlParams.set('subarea', subareaSelecionada)

      const response = await fetch(`/api/enem?${urlParams}`)
      const data = await response.json()

      if (!data.sucesso) {
        setStatus(response.status === 403 ? 'acesso_negado' : 'erro')
        setErro(data.erro)
        return
      }

      // Atualizar filtros disponíveis
      if (data.anos_disponiveis) setAnosDisponiveis(data.anos_disponiveis)
      if (data.areas_disponiveis) setAreasDisponiveis(data.areas_disponiveis)
      if (data.subareas_disponiveis) setSubareasDisponiveis(data.subareas_disponiveis)
      if (data.total_questoes) setTotalQuestoes(data.total_questoes)
      if (data.disponiveis !== undefined) setDisponiveis(data.disponiveis)

      if (data.status === 'SEM_QUESTOES' || data.status === 'TODAS_RESPONDIDAS') {
        setStatus('sem_questoes')
        return
      }

      setQuestao(data.questao)
      if (data._rc) {
        try {
          setRespostaCorreta(atob(data._rc))
        } catch {
          setRespostaCorreta(data._rc)
        }
      }
      setStatus('ok')
      iniciarTimer()
    } catch {
      setStatus('erro')
      setErro('Erro de conexão')
    }
  }

  // Timer
  const iniciarTimer = () => {
    pararTimer()
    timerRef.current = setInterval(() => setTempoDecorrido(p => p + 1), 1000)
  }
  const pararTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // Submeter resposta
  const submeterResposta = async () => {
    if (!questao || !alternativaSelecionada || !respostaCorreta || enviando) return
    setEnviando(true)
    pararTimer()

    try {
      const response = await fetch('/api/enem/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questao_id: questao.id,
          resposta: alternativaSelecionada,
          resposta_correta: btoa(respostaCorreta),
          tempo_segundos: tempoDecorrido,
        }),
      })
      const data = await response.json()

      if (data.sucesso) {
        setAcertou(data.correta)
        setRespondida(true)
        setEstatisticas(data.estatisticas)
        setRespostaCorreta(data.resposta_correta)
      } else {
        setErro(data.erro)
      }
    } catch {
      setErro('Erro ao enviar')
    } finally {
      setEnviando(false)
    }
  }

  const formatarTempo = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const limparFiltros = () => {
    setAnoSelecionado(null)
    setAreaSelecionada(null)
    setSubareaSelecionada(null)
  }

  const temFiltrosAtivos = anoSelecionado || areaSelecionada || subareaSelecionada

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarQuestao()
    return () => pararTimer()
  }, [componente])

  // Quando muda a área, limpa a subárea
  useEffect(() => {
    if (areaSelecionada) {
      setSubareaSelecionada(null)
    }
  }, [areaSelecionada])

  if (status === 'carregando') {
    return <Loading fullScreen componente={componente} text="Carregando questão..." />
  }

  // Imagens válidas da questão
  const imagensValidas = questao?.todas_imagens?.filter(img =>
    isValidImageUrl(img) && !imagensComErro.has(img)
  ) || []

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Estilos CSS */}
      <style jsx global>{`
        /* Texto base com espaçamento otimizado */
        .texto-questao {
          font-size: 0.9375rem;
          line-height: 1.5;
          letter-spacing: 0.01em;
        }
        .texto-questao p {
          margin: 0 0 0.75em 0;
        }
        .texto-questao p:last-child {
          margin-bottom: 0;
        }
        .texto-questao br {
          display: block;
          content: "";
          margin-top: 0.25em;
        }

        /* Tabelas */
        .texto-questao .tabela-enem {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 0.8rem;
          background: var(--bg-elevated);
          border-radius: 8px;
          overflow: hidden;
        }
        .texto-questao .tabela-enem th,
        .texto-questao .tabela-enem td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--border-default);
        }
        .texto-questao .tabela-enem th {
          background: var(--bg-surface);
          font-weight: 600;
          color: var(--text-primary);
        }
        .texto-questao .tabela-enem td {
          color: var(--text-secondary);
        }

        /* Imagens embutidas (quando não há galeria separada) */
        .texto-questao .imagem-embutida {
          margin: 12px 0;
          text-align: center;
        }
        .texto-questao .imagem-contexto {
          max-width: 100%;
          max-height: 280px;
          object-fit: contain;
          border-radius: 8px;
          background: var(--bg-elevated);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .texto-questao .imagem-contexto:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        /* Seções TEXTO I, TEXTO II */
        .texto-questao .secao-texto-header {
          display: inline-block;
          background: ${corPrimaria};
          color: ${isFisica ? '#000' : '#fff'};
          font-weight: 700;
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 6px;
          margin: 12px 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Negrito e itálico */
        .texto-questao strong {
          font-weight: 600;
          color: var(--text-primary);
        }
        .texto-questao em {
          font-style: italic;
        }

        /* Citações e fontes */
        .texto-questao small {
          font-size: 0.8rem;
          color: var(--text-muted);
          display: block;
          margin-top: 8px;
        }

        /* Responsivo - Mobile */
        @media (max-width: 640px) {
          .texto-questao {
            font-size: 0.875rem;
            line-height: 1.45;
          }
          .texto-questao p {
            margin: 0 0 0.6em 0;
          }
          .texto-questao .tabela-enem {
            font-size: 0.7rem;
          }
          .texto-questao .imagem-contexto {
            max-height: 200px;
          }
          .texto-questao .secao-texto-header {
            font-size: 0.7rem;
            padding: 3px 10px;
            margin: 10px 0 6px 0;
          }
        }
      `}</style>

      <NavigationRail componente={componente} />

      {/* Header */}
      <header className="px-3 py-2.5 sticky top-0 z-10 flex items-center justify-between gap-2" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/${componente}/menu`)} className="p-1.5 -ml-1 rounded-lg lg:hidden" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Target className="w-5 h-5" style={{ color: corPrimaria }} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Simulado ENEM</span>
          {estatisticas && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>
              {estatisticas.taxa_acerto}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {totalQuestoes > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {estatisticas?.total_questoes || 0}/{totalQuestoes}
            </span>
          )}

          <button
            onClick={() => setMostrarFiltro(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: temFiltrosAtivos ? corPrimaria : 'var(--bg-elevated)',
              color: temFiltrosAtivos ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)'
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {temFiltrosAtivos && <span className="w-1.5 h-1.5 rounded-full bg-white/80" />}
          </button>

          {status === 'ok' && !respondida && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-mono text-xs" style={{ background: 'var(--bg-elevated)', color: corPrimaria }}>
              <Clock className="w-3.5 h-3.5" />
              {formatarTempo(tempoDecorrido)}
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">
        {status === 'sem_questoes' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--success)' }} />
            </div>
            <h2 className="font-semibold mb-2 text-lg" style={{ color: 'var(--text-primary)' }}>Parabéns!</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {temFiltrosAtivos
                ? 'Você respondeu todas as questões com os filtros selecionados.'
                : 'Você respondeu todas as questões disponíveis!'}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { limparFiltros(); setMostrarFiltro(true); }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                Mudar Filtros
              </button>
              <button onClick={() => router.push(`/${componente}/menu`)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: corPrimaria, color: isFisica ? '#000' : '#fff' }}>
                Voltar ao Menu
              </button>
            </div>
          </div>
        )}

        {(status === 'erro' || status === 'acesso_negado') && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <XCircle className="w-8 h-8" style={{ color: 'var(--error)' }} />
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{erro}</p>
            <button onClick={buscarQuestao} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              <RotateCcw className="w-4 h-4 inline mr-2" />Tentar novamente
            </button>
          </div>
        )}

        {status === 'ok' && questao && (
          <div className="p-4 space-y-4">
            {/* Badges de informação */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: corPrimaria, color: isFisica ? '#000' : '#fff' }}>
                ENEM {questao.ano_prova}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                Questão {questao.numero_questao}
              </span>
              {questao.area_nome && (
                <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  <BookOpen className="w-3 h-3" />
                  {questao.area_nome}
                </span>
              )}
              {questao.subarea_nome && questao.subarea_nome !== questao.area_nome && (
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  {questao.subarea_nome}
                </span>
              )}
            </div>

            {/* 1. Contexto/Enunciado */}
            <div
              className="text-base rounded-xl p-4 texto-questao"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-default)' }}
              dangerouslySetInnerHTML={processarTextoQuestao(questao.contexto, imagensValidas.length > 0)}
              onClick={(e) => {
                const target = e.target as HTMLElement
                if (target.tagName === 'IMG') {
                  const src = (target as HTMLImageElement).src
                  if (isValidImageUrl(src)) setImagemZoom(src)
                }
              }}
            />

            {/* 2. Imagens (se houver) */}
            {imagensValidas.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                {imagensValidas.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImagemZoom(img)}
                    className="relative flex-shrink-0 rounded-xl overflow-hidden group"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <img
                      src={img}
                      alt={`Figura ${i + 1}`}
                      className="h-32 sm:h-40 w-auto object-contain max-w-[200px] sm:max-w-[280px]"
                      onError={() => handleImageError(img)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 3. Comando */}
            {deveExibirComando(questao.comando) && (
              <div
                className="text-sm leading-relaxed rounded-xl p-4 italic texto-questao"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                dangerouslySetInnerHTML={processarTextoQuestao(questao.comando)}
              />
            )}

            {/* 4. Alternativas */}
            <div className="space-y-2">
              {questao.alternativas.map((alt) => {
                const isSelected = alternativaSelecionada === alt.letra
                const isCorreta = respondida && respostaCorreta === alt.letra
                const isErrada = respondida && isSelected && !isCorreta
                const textoProcessado = processarTexto(alt.texto)

                let bg = 'var(--bg-surface)'
                let border = 'var(--border-default)'

                if (respondida) {
                  if (isCorreta) { bg = 'rgba(34,197,94,0.12)'; border = 'var(--success)' }
                  else if (isErrada) { bg = 'rgba(239,68,68,0.12)'; border = 'var(--error)' }
                } else if (isSelected) {
                  bg = isFisica ? 'rgba(34,197,94,0.12)' : 'rgba(139,92,246,0.12)'
                  border = corPrimaria
                }

                return (
                  <button
                    key={alt.letra}
                    onClick={() => !respondida && setAlternativaSelecionada(alt.letra)}
                    disabled={respondida || !alt.texto}
                    className="w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all disabled:opacity-50"
                    style={{ background: bg, border: `2px solid ${border}` }}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{
                        background: isSelected || isCorreta ? corPrimaria : 'var(--bg-elevated)',
                        color: isSelected || isCorreta ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)'
                      }}
                    >
                      {alt.letra}
                    </span>
                    <div className="flex-1 min-w-0 pt-0.5">
                      {alt.imagem && isValidImageUrl(alt.imagem) && !imagensComErro.has(alt.imagem) && (
                        <img
                          src={alt.imagem}
                          alt={`Alternativa ${alt.letra}`}
                          className="max-h-24 w-auto object-contain rounded-lg mb-2 cursor-pointer"
                          onError={() => handleImageError(alt.imagem!)}
                          onClick={(e) => {
                            e.stopPropagation()
                            setImagemZoom(alt.imagem!)
                          }}
                        />
                      )}
                      <span
                        className="text-sm leading-relaxed block"
                        style={{ color: alt.texto ? 'var(--text-primary)' : 'var(--text-muted)' }}
                      >
                        {textoProcessado || '(alternativa sem texto)'}
                      </span>
                    </div>
                    {isCorreta && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: 'var(--success)' }} />}
                    {isErrada && <XCircle className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: 'var(--error)' }} />}
                  </button>
                )
              })}
            </div>

            {/* Feedback */}
            {respondida && (
              <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: acertou ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}>
                <div className="flex items-center gap-3">
                  {acertou ? <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--success)' }} /> : <XCircle className="w-6 h-6" style={{ color: 'var(--error)' }} />}
                  <span className="font-semibold" style={{ color: acertou ? 'var(--success)' : 'var(--error)' }}>
                    {acertou ? 'Resposta Correta!' : `Incorreta. Resposta: ${respostaCorreta}`}
                  </span>
                </div>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatarTempo(tempoDecorrido)}</span>
              </div>
            )}

            {/* Estatísticas */}
            {respondida && estatisticas && (
              <div className="flex items-center justify-around py-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                <div className="text-center">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Respondidas</p>
                  <p className="text-2xl font-bold" style={{ color: corPrimaria }}>{estatisticas.total_questoes}</p>
                </div>
                <div className="w-px h-10" style={{ background: 'var(--border-default)' }} />
                <div className="text-center">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Acertos</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>{estatisticas.total_corretas}</p>
                </div>
                <div className="w-px h-10" style={{ background: 'var(--border-default)' }} />
                <div className="text-center">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Taxa</p>
                  <p className="text-2xl font-bold" style={{ color: estatisticas.taxa_acerto >= 60 ? 'var(--success)' : estatisticas.taxa_acerto >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                    {estatisticas.taxa_acerto}%
                  </p>
                </div>
              </div>
            )}

            {/* Botão de ação */}
            <button
              onClick={respondida ? buscarQuestao : submeterResposta}
              disabled={!respondida && (!alternativaSelecionada || enviando)}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: corPrimaria, color: isFisica ? '#000' : '#fff' }}
            >
              {enviando ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
              ) : respondida ? (
                <><ChevronRight className="w-5 h-5" /> Próxima Questão</>
              ) : (
                'Confirmar Resposta'
              )}
            </button>
          </div>
        )}
      </main>

      {/* Modal de Filtros */}
      {mostrarFiltro && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setMostrarFiltro(false)}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Filtrar Questões</h3>
              {temFiltrosAtivos && (
                <button onClick={limparFiltros} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  Limpar tudo
                </button>
              )}
            </div>

            {/* Filtro por Ano */}
            <div className="mb-5">
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-4 h-4 inline mr-2" />
                Ano da Prova
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAnoSelecionado(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: !anoSelecionado ? corPrimaria : 'var(--bg-elevated)',
                    color: !anoSelecionado ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)'
                  }}
                >
                  Todos
                </button>
                {anosDisponiveis.map(ano => (
                  <button
                    key={ano}
                    onClick={() => setAnoSelecionado(ano)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: anoSelecionado === ano ? corPrimaria : 'var(--bg-elevated)',
                      color: anoSelecionado === ano ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)'
                    }}
                  >
                    {ano}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por Área */}
            {areasDisponiveis.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Área do Conhecimento
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAreaSelecionada(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: !areaSelecionada ? corPrimaria : 'var(--bg-elevated)',
                      color: !areaSelecionada ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)'
                    }}
                  >
                    Todas
                  </button>
                  {areasDisponiveis.map(area => {
                    const config = ENEM_CONFIG.AREAS[area]
                    const Icon = AREA_ICONS[area] || BookOpen
                    return (
                      <button
                        key={area}
                        onClick={() => setAreaSelecionada(area)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        style={{
                          background: areaSelecionada === area ? corPrimaria : 'var(--bg-elevated)',
                          color: areaSelecionada === area ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)'
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        {config?.nome || area}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Filtro por Subárea */}
            {subareasDisponiveis.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Disciplina
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSubareaSelecionada(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: !subareaSelecionada ? corPrimaria : 'var(--bg-elevated)',
                      color: !subareaSelecionada ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)'
                    }}
                  >
                    Todas
                  </button>
                  {subareasDisponiveis.map(subarea => (
                    <button
                      key={subarea}
                      onClick={() => setSubareaSelecionada(subarea)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: subareaSelecionada === subarea ? corPrimaria : 'var(--bg-elevated)',
                        color: subareaSelecionada === subarea ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)'
                      }}
                    >
                      {ENEM_CONFIG.SUBAREAS_LABELS[subarea] || subarea}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info de questões disponíveis */}
            {disponiveis > 0 && (
              <p className="text-sm mb-5 text-center" style={{ color: 'var(--text-muted)' }}>
                {disponiveis} questões disponíveis
              </p>
            )}

            {/* Botão aplicar */}
            <button
              onClick={() => { setMostrarFiltro(false); buscarQuestao() }}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{ background: corPrimaria, color: isFisica ? '#000' : '#fff' }}
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Modal de Zoom */}
      {imagemZoom && isValidImageUrl(imagemZoom) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.95)' }} onClick={() => setImagemZoom(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={imagemZoom}
            alt="Imagem ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
            onError={() => {
              handleImageError(imagemZoom)
              setImagemZoom(null)
            }}
          />
        </div>
      )}

      <BottomNav componente={componente} />
    </div>
  )
}
