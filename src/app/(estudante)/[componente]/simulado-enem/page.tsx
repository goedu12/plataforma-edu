'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Clock,
  Calendar,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BookOpen,
  Loader2,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// PÁGINA: Simulado ENEM v2 - Abordagem simplificada
// ═══════════════════════════════════════════════════════════════════════════

const ANOS_DISPONIVEIS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]

interface Questao {
  id: string
  ano: number
  numero: number
  disciplina: string
  titulo: string | null
  contexto: string
  comando: string | null
  imagens: string[]
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

type Status = 'carregando' | 'ok' | 'sem_questoes' | 'erro' | 'acesso_negado' | 'respondida'

export default function SimuladoENEMPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Estados principais
  const [status, setStatus] = useState<Status>('carregando')
  const [questao, setQuestao] = useState<Questao | null>(null)
  const [respostaCorreta, setRespostaCorreta] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Estados de filtro
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null)
  const [mostrarFiltro, setMostrarFiltro] = useState(false)

  // Estados de resposta
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<string | null>(null)
  const [respondida, setRespondida] = useState(false)
  const [acertou, setAcertou] = useState<boolean | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Timer
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [respondidas, setRespondidas] = useState(0)

  // Estilos baseados no componente
  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Buscar questão
  const buscarQuestao = async () => {
    setStatus('carregando')
    setQuestao(null)
    setRespostaCorreta(null)
    setAlternativaSelecionada(null)
    setRespondida(false)
    setAcertou(null)
    setTempoDecorrido(0)
    pararTimer()

    try {
      const params = new URLSearchParams()
      if (anoSelecionado) params.set('ano', String(anoSelecionado))

      const response = await fetch(`/api/enem?${params}`)
      const data = await response.json()

      if (!data.sucesso) {
        if (response.status === 403) {
          setStatus('acesso_negado')
          setErro(data.erro)
        } else {
          setStatus('erro')
          setErro(data.erro || 'Erro desconhecido')
        }
        return
      }

      if (data.status === 'SEM_QUESTOES') {
        setStatus('sem_questoes')
        setRespondidas(data.respondidas || 0)
        return
      }

      setQuestao(data.questao)
      setRespostaCorreta(data._rc) // base64 encoded
      setRespondidas(data.respondidas || 0)
      setStatus('ok')
      iniciarTimer()
    } catch (error) {
      console.error('Erro ao buscar questão:', error)
      setStatus('erro')
      setErro('Não foi possível conectar ao servidor.')
    }
  }

  // Timer
  const iniciarTimer = () => {
    pararTimer()
    timerRef.current = setInterval(() => {
      setTempoDecorrido(prev => prev + 1)
    }, 1000)
  }

  const pararTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
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
          resposta_correta: respostaCorreta,
          tempo_segundos: tempoDecorrido,
          ano_prova: questao.ano,
          disciplina: questao.disciplina,
        }),
      })

      const data = await response.json()

      if (data.sucesso) {
        setAcertou(data.correta)
        setRespondida(true)
        setEstatisticas(data.estatisticas)
        // Decodificar resposta correta para mostrar
        setRespostaCorreta(data.resposta_correta)
      } else {
        setErro(data.erro)
      }
    } catch (error) {
      console.error('Erro ao submeter resposta:', error)
      setErro('Erro ao enviar resposta.')
    } finally {
      setEnviando(false)
    }
  }

  // Formatador de tempo
  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg.toString().padStart(2, '0')}`
  }

  // Efeitos
  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarQuestao()
    return () => pararTimer()
  }, [componente])

  // Handlers
  const handleVoltar = () => router.push(`/${componente}/menu`)
  const handleProxima = () => buscarQuestao()
  const handleAplicarFiltro = () => {
    setMostrarFiltro(false)
    buscarQuestao()
  }

  // Loading
  if (status === 'carregando') {
    return <Loading fullScreen componente={componente} text="Carregando questão ENEM..." />
  }

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* Header */}
      <header
        className="px-4 py-3 sticky top-0 z-10"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <button onClick={handleVoltar} className="p-2 -ml-2 rounded-lg lg:hidden" style={{ color: 'var(--text-muted)' }}>
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: corPrimaria }} />
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Simulado ENEM</span>
              <Badge variant="info" className="text-xs">v2</Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtro de ano */}
              <button
                onClick={() => setMostrarFiltro(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
                style={{ background: 'var(--bg-elevated)', color: anoSelecionado ? corPrimaria : 'var(--text-muted)' }}
              >
                <Calendar className="w-4 h-4" />
                <span>{anoSelecionado || 'Ano'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Timer */}
              {status === 'ok' && questao && !respondida && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm" style={{ background: 'var(--bg-elevated)', color: corPrimaria }}>
                  <Clock className="w-4 h-4" />
                  <span>{formatarTempo(tempoDecorrido)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          {(estatisticas || respondidas > 0) && (
            <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span><strong style={{ color: 'var(--text-primary)' }}>{estatisticas?.total_questoes || respondidas}</strong> respondidas</span>
              {estatisticas && <span><strong style={{ color: 'var(--success)' }}>{estatisticas.taxa_acerto}%</strong> acerto</span>}
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-4 w-full">
        {/* Estados de erro/sem questões */}
        {(status === 'erro' || status === 'acesso_negado' || status === 'sem_questoes') && (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: status === 'sem_questoes' ? 'var(--bg-elevated)' : 'rgba(239, 68, 68, 0.15)' }}>
              {status === 'sem_questoes' ? <BookOpen className="w-7 h-7" style={{ color: 'var(--text-muted)' }} /> : <AlertTriangle className="w-7 h-7" style={{ color: 'var(--error)' }} />}
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {status === 'sem_questoes' ? 'Sem Questões' : status === 'acesso_negado' ? 'Acesso Restrito' : 'Erro'}
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {status === 'sem_questoes' ? (anoSelecionado ? `Você já respondeu todas as questões de ${anoSelecionado}.` : 'Você já respondeu todas as questões disponíveis.') : erro}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {status === 'sem_questoes' && (
                <Button variant="secondary" onClick={() => setMostrarFiltro(true)} className="min-h-[48px]">
                  Escolher outro ano
                </Button>
              )}
              {status === 'erro' && (
                <Button variant="secondary" onClick={buscarQuestao} leftIcon={<RefreshCw className="w-4 h-4" />} className="min-h-[48px]">
                  Tentar Novamente
                </Button>
              )}
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={handleVoltar} className="min-h-[48px]">
                Voltar ao Menu
              </Button>
            </div>
          </div>
        )}

        {/* Questão */}
        {status === 'ok' && questao && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Info da questão */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="text-xs">ENEM {questao.ano}</Badge>
                <Badge variant="info" className="text-xs">Q{questao.numero}</Badge>
              </div>
              <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {questao.disciplina}
              </span>
            </div>

            {/* Conteúdo da questão */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              {/* Título */}
              {questao.titulo && (
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{questao.titulo}</h3>
              )}

              {/* Imagens */}
              {questao.imagens.length > 0 && (
                <div className="mb-4 space-y-2">
                  {questao.imagens.map((img, idx) => (
                    <img key={idx} src={img} alt={`Imagem ${idx + 1}`} className="max-w-full rounded-lg mx-auto" style={{ maxHeight: '300px' }} />
                  ))}
                </div>
              )}

              {/* Contexto */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap mb-4" style={{ color: 'var(--text-primary)' }}>
                {questao.contexto}
              </div>

              {/* Comando */}
              {questao.comando && (
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                  {questao.comando}
                </p>
              )}

              {/* Alternativas */}
              <div className="space-y-2">
                {questao.alternativas.map((alt) => {
                  const isSelected = alternativaSelecionada === alt.letra
                  const isCorreta = respondida && respostaCorreta === alt.letra
                  const isErrada = respondida && isSelected && !isCorreta

                  let bgColor = 'var(--bg-elevated)'
                  let borderColor = 'transparent'

                  if (respondida) {
                    if (isCorreta) {
                      bgColor = 'rgba(34, 197, 94, 0.15)'
                      borderColor = 'var(--success)'
                    } else if (isErrada) {
                      bgColor = 'rgba(239, 68, 68, 0.15)'
                      borderColor = 'var(--error)'
                    }
                  } else if (isSelected) {
                    bgColor = isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)'
                    borderColor = corPrimaria
                  }

                  return (
                    <button
                      key={alt.letra}
                      onClick={() => !respondida && setAlternativaSelecionada(alt.letra)}
                      disabled={respondida}
                      className="w-full text-left p-3 rounded-xl transition-all flex items-start gap-3"
                      style={{ background: bgColor, border: `2px solid ${borderColor}` }}
                    >
                      <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: isSelected || isCorreta ? corPrimaria : 'var(--bg-surface)', color: isSelected || isCorreta ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)' }}>
                        {alt.letra}
                      </span>
                      <div className="flex-1 min-w-0">
                        {alt.imagem && (
                          <img src={alt.imagem} alt={`Alternativa ${alt.letra}`} className="max-w-full rounded-lg mb-2" style={{ maxHeight: '150px' }} />
                        )}
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{alt.texto}</span>
                      </div>
                      {respondida && isCorreta && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--success)' }} />}
                      {respondida && isErrada && <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--error)' }} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Feedback após responder */}
            {respondida && (
              <div className="rounded-2xl p-4" style={{ background: acertou ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${acertou ? 'var(--success)' : 'var(--error)'}` }}>
                <div className="flex items-center gap-2 mb-2">
                  {acertou ? <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} /> : <XCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />}
                  <span className="font-semibold" style={{ color: acertou ? 'var(--success)' : 'var(--error)' }}>
                    {acertou ? 'Resposta Correta!' : 'Resposta Incorreta'}
                  </span>
                </div>
                {!acertou && (
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    A resposta correta era: <strong style={{ color: 'var(--success)' }}>{respostaCorreta}</strong>
                  </p>
                )}
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Tempo: {formatarTempo(tempoDecorrido)}
                </p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2">
              {!respondida ? (
                <Button
                  variant={isFisica ? 'fisica' : 'matematica'}
                  onClick={submeterResposta}
                  disabled={!alternativaSelecionada || enviando}
                  className="flex-1 min-h-[48px]"
                  leftIcon={enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {enviando ? 'Enviando...' : 'Confirmar Resposta'}
                </Button>
              ) : (
                <Button
                  variant={isFisica ? 'fisica' : 'matematica'}
                  onClick={handleProxima}
                  className="flex-1 min-h-[48px]"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Próxima Questão
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal de filtro de ano */}
      {mostrarFiltro && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.6)' }} onClick={() => setMostrarFiltro(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden animate-fade-in-up" style={{ background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Escolher Ano da Prova</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAnoSelecionado(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: !anoSelecionado ? corPrimaria : 'var(--bg-elevated)', color: !anoSelecionado ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)' }}
                >
                  Todos
                </button>
                {ANOS_DISPONIVEIS.map(ano => (
                  <button
                    key={ano}
                    onClick={() => setAnoSelecionado(ano)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: anoSelecionado === ano ? corPrimaria : 'var(--bg-elevated)', color: anoSelecionado === ano ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)' }}
                  >
                    {ano}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--border-default)' }}>
              <Button variant="secondary" onClick={() => setMostrarFiltro(false)} className="flex-1">Cancelar</Button>
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={handleAplicarFiltro} className="flex-1">Aplicar</Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav componente={componente} />
    </div>
  )
}
