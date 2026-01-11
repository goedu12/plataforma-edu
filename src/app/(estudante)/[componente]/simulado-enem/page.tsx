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
  ImageOff,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import { processarContexto, processarTexto, isValidImageUrl } from '@/lib/limpezaTexto'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// SIMULADO ENEM - Interface com Filtros por Ano e Área
// Versão 2.0 - Com suporte a imagens embutidas e múltiplos textos
// ═══════════════════════════════════════════════════════════════════════════

interface Questao {
  id: string
  ano: number
  numero: number
  contexto: string
  comando: string | null
  imagens: string[]
  alternativas: Array<{ letra: string; texto: string; imagem?: string | null }>
  area: string
}

interface Estatisticas {
  total_questoes: number
  total_corretas: number
  taxa_acerto: number
}

type Status = 'carregando' | 'ok' | 'sem_questoes' | 'erro' | 'acesso_negado'

// Verifica se o comando deve ser exibido (oculta descrições de imagem)
function deveExibirComando(comando: string | null | undefined): boolean {
  if (!comando) return false
  const textoLimpo = comando.trim().toLowerCase()
  // Oculta se for descrição de imagem
  if (textoLimpo.startsWith('descrição da imagem')) return false
  if (textoLimpo.startsWith('descricao da imagem')) return false
  if (textoLimpo.startsWith('["descrição')) return false
  if (textoLimpo.startsWith("['descrição")) return false
  // Oculta se começar com [" (array JSON de descrição)
  if (/^\[["']/.test(textoLimpo)) return false
  // Oculta se for muito curto (provavelmente lixo)
  if (textoLimpo.length < 5) return false
  return true
}

// Detecta se o texto contém uma tabela markdown
function contemTabela(texto: string): boolean {
  const linhas = texto.split('\n')
  let temPipe = false
  let temSeparador = false
  for (const linha of linhas) {
    if (linha.includes('|')) temPipe = true
    if (/\|[\s-:]+\|/.test(linha) || /^[\s-:]+\|/.test(linha)) temSeparador = true
  }
  return temPipe && temSeparador
}

// Converte tabela markdown para HTML
function formatarTabelaMarkdown(texto: string): string {
  const linhas = texto.split('\n')
  const resultado: string[] = []
  let dentroTabela = false
  let tabelaLinhas: string[] = []

  const processarTabela = (linhasTabela: string[]): string => {
    if (linhasTabela.length < 2) return linhasTabela.join('\n')

    let html = '<table class="tabela-enem">'
    let isHeader = true

    for (let i = 0; i < linhasTabela.length; i++) {
      const linha = linhasTabela[i].trim()
      // Pula linha separadora (---|---|---)
      if (/^[\s|:-]+$/.test(linha.replace(/\|/g, '').replace(/-/g, '').replace(/:/g, ''))) {
        isHeader = false
        continue
      }

      const celulas = linha.split('|').map(c => c.trim()).filter(c => c !== '')
      if (celulas.length === 0) continue

      html += '<tr>'
      const tag = isHeader && i === 0 ? 'th' : 'td'
      for (const celula of celulas) {
        html += `<${tag}>${celula}</${tag}>`
      }
      html += '</tr>'
      if (isHeader && i === 0) isHeader = false
    }

    html += '</table>'
    return html
  }

  for (const linha of linhas) {
    const temPipe = linha.includes('|')

    if (temPipe) {
      if (!dentroTabela) {
        dentroTabela = true
        tabelaLinhas = []
      }
      tabelaLinhas.push(linha)
    } else {
      if (dentroTabela) {
        resultado.push(processarTabela(tabelaLinhas))
        dentroTabela = false
        tabelaLinhas = []
      }
      resultado.push(linha)
    }
  }

  // Processa tabela restante se terminar no final
  if (dentroTabela && tabelaLinhas.length > 0) {
    resultado.push(processarTabela(tabelaLinhas))
  }

  return resultado.join('\n')
}

// Processa texto completo: limpa, formata tabelas e converte imagens
function processarTextoQuestao(texto: string | null | undefined): { __html: string } {
  if (!texto) return { __html: '' }

  // Primeiro processa o contexto (converte imagens, formata seções)
  let processado = processarContexto(texto)

  // Se contém tabela, converte para HTML
  if (contemTabela(texto)) {
    // Precisa processar a tabela antes da conversão de <br>
    const textoOriginal = texto.replace(/\\n/g, '\n')
    const tabelaHtml = formatarTabelaMarkdown(textoOriginal)
    // Re-processar o resultado da tabela
    processado = processarContexto(tabelaHtml)
  }

  return { __html: processado }
}

export default function SimuladoENEMPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Estados
  const [status, setStatus] = useState<Status>('carregando')
  const [questao, setQuestao] = useState<Questao | null>(null)
  const [respostaCorreta, setRespostaCorreta] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])
  const [areasDisponiveis, setAreasDisponiveis] = useState<string[]>([])

  // Filtros
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null)
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null)
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
  const [imagemErro, setImagemErro] = useState<Set<string>>(new Set())

  // Cores
  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Handler para erro de imagem
  const handleImageError = (url: string) => {
    setImagemErro(prev => new Set(prev).add(url))
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
    setImagemErro(new Set())
    pararTimer()

    try {
      const urlParams = new URLSearchParams()
      if (anoSelecionado) urlParams.set('ano', String(anoSelecionado))
      if (areaSelecionada) urlParams.set('area', areaSelecionada)

      const response = await fetch(`/api/enem?${urlParams}`)
      const data = await response.json()

      if (!data.sucesso) {
        setStatus(response.status === 403 ? 'acesso_negado' : 'erro')
        setErro(data.erro)
        return
      }

      if (data.anos_disponiveis) setAnosDisponiveis(data.anos_disponiveis)
      if (data.areas_disponiveis) setAreasDisponiveis(data.areas_disponiveis)
      if (data.total_questoes) setTotalQuestoes(data.total_questoes)
      if (data.disponiveis !== undefined) setDisponiveis(data.disponiveis)

      if (data.status === 'SEM_QUESTOES' || data.status === 'TODAS_RESPONDIDAS') {
        setStatus('sem_questoes')
        return
      }

      // Processar questão da API
      const q = data.questao
      const questaoProcessada: Questao = {
        id: q.id,
        ano: q.ano_prova,
        numero: q.numero_questao,
        contexto: q.contexto,
        comando: q.comando,
        imagens: [q.imagem_principal, ...(q.imagens_extras || [])].filter(isValidImageUrl),
        alternativas: q.alternativas || [
          { letra: 'A', texto: q.alternativa_a, imagem: q.imagem_a },
          { letra: 'B', texto: q.alternativa_b, imagem: q.imagem_b },
          { letra: 'C', texto: q.alternativa_c, imagem: q.imagem_c },
          { letra: 'D', texto: q.alternativa_d, imagem: q.imagem_d },
          { letra: 'E', texto: q.alternativa_e, imagem: q.imagem_e },
        ],
        area: q.area_nome || q.area || '',
      }

      setQuestao(questaoProcessada)
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
  }

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarQuestao()
    return () => pararTimer()
  }, [componente])

  if (status === 'carregando') {
    return <Loading fullScreen componente={componente} text="Carregando questão..." />
  }

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Estilos para questões ENEM */}
      <style jsx global>{`
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
        .texto-questao .tabela-enem tr:last-child td {
          border-bottom: none;
        }

        /* Imagens embutidas no texto */
        .texto-questao .imagem-embutida {
          margin: 16px 0;
          text-align: center;
        }
        .texto-questao .imagem-contexto {
          max-width: 100%;
          max-height: 300px;
          object-fit: contain;
          border-radius: 8px;
          background: var(--bg-elevated);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .texto-questao .imagem-contexto:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        /* Seções de texto (TEXTO I, TEXTO II) */
        .texto-questao .secao-texto-header {
          display: inline-block;
          background: var(--bg-elevated);
          color: var(--text-primary);
          font-weight: 700;
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 6px;
          margin: 16px 0 8px 0;
          border-left: 3px solid ${corPrimaria};
        }

        /* Responsivo */
        @media (max-width: 640px) {
          .texto-questao .tabela-enem {
            font-size: 0.7rem;
          }
          .texto-questao .tabela-enem th,
          .texto-questao .tabela-enem td {
            padding: 6px 8px;
          }
          .texto-questao .imagem-contexto {
            max-height: 200px;
          }
          .texto-questao .secao-texto-header {
            font-size: 0.7rem;
            padding: 3px 10px;
          }
        }
      `}</style>
      <NavigationRail componente={componente} />

      {/* Header */}
      <header className="px-3 py-2 sticky top-0 z-10 flex items-center justify-between gap-2" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/${componente}/menu`)} className="p-1.5 -ml-1 rounded-lg lg:hidden" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Target className="w-4 h-4" style={{ color: corPrimaria }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>ENEM</span>
          {estatisticas && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--success)' }}>
              {estatisticas.taxa_acerto}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {totalQuestoes > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {estatisticas?.total_questoes || 0}/{totalQuestoes}
            </span>
          )}

          <button
            onClick={() => setMostrarFiltro(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{ background: 'var(--bg-elevated)', color: (anoSelecionado || areaSelecionada) ? corPrimaria : 'var(--text-muted)' }}
          >
            <Calendar className="w-3 h-3" />
            <span>{anoSelecionado || 'Filtrar'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {status === 'ok' && !respondida && (
            <div className="flex items-center gap-1 px-2 py-1 rounded font-mono text-xs" style={{ background: 'var(--bg-elevated)', color: corPrimaria }}>
              <Clock className="w-3 h-3" />
              {formatarTempo(tempoDecorrido)}
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">
        {status === 'sem_questoes' && (
          <div className="p-4 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
              <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--success)' }} />
            </div>
            <h2 className="font-semibold mb-1 text-sm" style={{ color: 'var(--text-primary)' }}>Parabéns!</h2>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              {anoSelecionado ? `Todas de ${anoSelecionado} respondidas` : 'Todas as questões respondidas'}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => { limparFiltros(); setMostrarFiltro(true); }} className="px-3 py-1.5 rounded text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                Mudar filtro
              </button>
              <button onClick={() => router.push(`/${componente}/menu`)} className="px-3 py-1.5 rounded text-xs" style={{ background: corPrimaria, color: isFisica ? '#000' : '#fff' }}>
                Menu
              </button>
            </div>
          </div>
        )}

        {(status === 'erro' || status === 'acesso_negado') && (
          <div className="p-4 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <XCircle className="w-6 h-6" style={{ color: 'var(--error)' }} />
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{erro}</p>
            <button onClick={buscarQuestao} className="px-3 py-1.5 rounded text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              <RotateCcw className="w-3 h-3 inline mr-1" />Tentar novamente
            </button>
          </div>
        )}

        {status === 'ok' && questao && (
          <div className="p-3 space-y-3">
            {/* Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: corPrimaria, color: isFisica ? '#000' : '#fff' }}>
                ENEM {questao.ano}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Questão {questao.numero}</span>
              {questao.area && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  <BookOpen className="w-3 h-3 inline mr-1" />{questao.area}
                </span>
              )}
            </div>

            {/* Imagens separadas (não embutidas no texto) */}
            {questao.imagens && questao.imagens.filter(img => isValidImageUrl(img) && !imagemErro.has(img)).length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {questao.imagens.filter(img => isValidImageUrl(img) && !imagemErro.has(img)).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImagemZoom(img)}
                    className="relative flex-shrink-0 rounded-lg overflow-hidden group"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <img
                      src={img}
                      alt={`Figura ${i + 1}`}
                      className="h-24 sm:h-32 lg:h-44 w-auto object-contain max-w-[150px] sm:max-w-[200px] lg:max-w-[300px]"
                      onError={() => handleImageError(img)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Comando - só exibe se não for descrição de imagem */}
            {deveExibirComando(questao.comando) && (
              <div
                className="text-xs leading-relaxed rounded-lg p-3 italic texto-questao"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                dangerouslySetInnerHTML={processarTextoQuestao(questao.comando)}
              />
            )}

            {/* Enunciado - com suporte a imagens embutidas e seções */}
            <div
              className="text-sm leading-relaxed rounded-lg p-3 texto-questao"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', maxHeight: '400px', overflowY: 'auto' }}
              dangerouslySetInnerHTML={processarTextoQuestao(questao.contexto)}
              onClick={(e) => {
                // Captura cliques em imagens para zoom
                const target = e.target as HTMLElement
                if (target.tagName === 'IMG') {
                  const src = (target as HTMLImageElement).src
                  if (isValidImageUrl(src)) {
                    setImagemZoom(src)
                  }
                }
              }}
            />

            {/* Alternativas */}
            <div className="space-y-1.5">
              {questao.alternativas.map((alt) => {
                const isSelected = alternativaSelecionada === alt.letra
                const isCorreta = respondida && respostaCorreta === alt.letra
                const isErrada = respondida && isSelected && !isCorreta
                const textoProcessado = processarTexto(alt.texto)

                let bg = 'var(--bg-surface)'
                let border = 'var(--border-default)'

                if (respondida) {
                  if (isCorreta) { bg = 'rgba(34,197,94,0.1)'; border = 'var(--success)' }
                  else if (isErrada) { bg = 'rgba(239,68,68,0.1)'; border = 'var(--error)' }
                } else if (isSelected) {
                  bg = isFisica ? 'rgba(34,197,94,0.1)' : 'rgba(139,92,246,0.1)'
                  border = corPrimaria
                }

                return (
                  <button
                    key={alt.letra}
                    onClick={() => !respondida && setAlternativaSelecionada(alt.letra)}
                    disabled={respondida || !alt.texto}
                    className="w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-all disabled:opacity-50"
                    style={{ background: bg, border: `1.5px solid ${border}` }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{
                        background: isSelected || isCorreta ? corPrimaria : 'var(--bg-elevated)',
                        color: isSelected || isCorreta ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)'
                      }}
                    >
                      {alt.letra}
                    </span>
                    <div className="flex-1 min-w-0">
                      {/* Imagem da alternativa */}
                      {alt.imagem && isValidImageUrl(alt.imagem) && !imagemErro.has(alt.imagem) && (
                        <img
                          src={alt.imagem}
                          alt={`Alternativa ${alt.letra}`}
                          className="max-h-20 w-auto object-contain rounded mb-1.5"
                          onError={() => handleImageError(alt.imagem!)}
                          onClick={(e) => {
                            e.stopPropagation()
                            setImagemZoom(alt.imagem!)
                          }}
                        />
                      )}
                      {/* Texto da alternativa */}
                      <span
                        className="text-sm leading-relaxed"
                        style={{ color: alt.texto ? 'var(--text-primary)' : 'var(--text-muted)' }}
                      >
                        {textoProcessado || '(alternativa sem texto)'}
                      </span>
                    </div>
                    {isCorreta && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />}
                    {isErrada && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />}
                  </button>
                )
              })}
            </div>

            {/* Feedback */}
            {respondida && (
              <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: acertou ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                <div className="flex items-center gap-2">
                  {acertou ? <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} /> : <XCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />}
                  <span className="text-sm font-medium" style={{ color: acertou ? 'var(--success)' : 'var(--error)' }}>
                    {acertou ? 'Correto!' : `Errado. Resposta: ${respostaCorreta}`}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatarTempo(tempoDecorrido)}</span>
              </div>
            )}

            {/* Estatísticas */}
            {respondida && estatisticas && (
              <div className="flex items-center justify-around py-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div className="text-center">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Respondidas</p>
                  <p className="text-xl font-bold" style={{ color: corPrimaria }}>{estatisticas.total_questoes}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Acertos</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>{estatisticas.total_corretas}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Taxa</p>
                  <p className="text-xl font-bold" style={{ color: estatisticas.taxa_acerto >= 60 ? 'var(--success)' : estatisticas.taxa_acerto >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                    {estatisticas.taxa_acerto}%
                  </p>
                </div>
              </div>
            )}

            {/* Botão */}
            <button
              onClick={respondida ? buscarQuestao : submeterResposta}
              disabled={!respondida && (!alternativaSelecionada || enviando)}
              className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: corPrimaria, color: isFisica ? '#000' : '#fff' }}
            >
              {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : respondida ? <><ChevronRight className="w-4 h-4" /> Próxima Questão</> : 'Confirmar Resposta'}
            </button>
          </div>
        )}
      </main>

      {/* Modal Filtros */}
      {mostrarFiltro && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setMostrarFiltro(false)}>
          <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4" style={{ background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Filtrar Questões</h3>

            <div className="mb-4">
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Ano da Prova</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setAnoSelecionado(null)} className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: !anoSelecionado ? corPrimaria : 'var(--bg-elevated)', color: !anoSelecionado ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)' }}>
                  Todos
                </button>
                {anosDisponiveis.map(ano => (
                  <button key={ano} onClick={() => setAnoSelecionado(ano)} className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: anoSelecionado === ano ? corPrimaria : 'var(--bg-elevated)', color: anoSelecionado === ano ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)' }}>
                    {ano}
                  </button>
                ))}
              </div>
            </div>

            {areasDisponiveis.length > 0 && (
              <div className="mb-4">
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Área do Conhecimento</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setAreaSelecionada(null)} className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: !areaSelecionada ? corPrimaria : 'var(--bg-elevated)', color: !areaSelecionada ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)' }}>
                    Todas
                  </button>
                  {areasDisponiveis.map(area => (
                    <button key={area} onClick={() => setAreaSelecionada(area)} className="px-3 py-1.5 rounded text-xs font-medium truncate max-w-[120px]" style={{ background: areaSelecionada === area ? corPrimaria : 'var(--bg-elevated)', color: areaSelecionada === area ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)' }} title={area}>
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {disponiveis > 0 && <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{disponiveis} questões disponíveis</p>}

            <div className="flex gap-2">
              <button onClick={() => { limparFiltros(); setMostrarFiltro(false); }} className="flex-1 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                Limpar
              </button>
              <button onClick={() => { setMostrarFiltro(false); buscarQuestao() }} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: corPrimaria, color: isFisica ? '#000' : '#fff' }}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom */}
      {imagemZoom && isValidImageUrl(imagemZoom) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={() => setImagemZoom(null)}>
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
