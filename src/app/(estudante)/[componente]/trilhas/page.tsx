'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Clock,
  RefreshCw,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'

interface TrilhaAPI {
  trilha_id: string
  nome: string
  icone: string
  descricao_curta: string
  descricao: string
  cor: string
  config: {
    questoes_por_semana?: number
    total_semanas?: number
  }
  ordem: number
  usuario_ativa?: boolean
  usuario_semana?: number
  usuario_pontos?: number
}

interface Trilha {
  id: string
  nome: string
  icone: string
  descricao_curta: string
  descricao_completa: string
  cor_primaria: string
  questoes_por_semana: number
  total_semanas: number
  ordem: number
  ativa?: boolean
  semana_atual?: number
  pontos?: number
  iniciada?: boolean // true se já iniciou antes (mesmo pausada)
}

// Transforma dados da API para o formato do frontend
function transformarTrilha(t: TrilhaAPI): Trilha {
  return {
    id: t.trilha_id,
    nome: t.nome,
    icone: t.icone,
    descricao_curta: t.descricao_curta || '',
    descricao_completa: t.descricao || t.descricao_curta || '',
    cor_primaria: t.cor || '#22c55e',
    questoes_por_semana: t.config?.questoes_por_semana || 10,
    total_semanas: t.config?.total_semanas || 40,
    ordem: t.ordem,
    ativa: t.usuario_ativa || false,
    semana_atual: t.usuario_semana || 1,
    pontos: t.usuario_pontos || 0,
    iniciada: t.usuario_semana !== null && t.usuario_semana !== undefined,
  }
}

export default function TrilhasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [trilhas, setTrilhas] = useState<Trilha[]>([])
  const [trilhaAtiva, setTrilhaAtiva] = useState<Trilha | null>(null)
  const [loading, setLoading] = useState(true)
  const [iniciando, setIniciando] = useState(false)
  const [pausando, setPausando] = useState(false)
  const [serie, setSerie] = useState<string>('')
  const [nivelEnsino, setNivelEnsino] = useState<'EF' | 'EM'>('EM')
  const [modalTrilha, setModalTrilha] = useState<Trilha | null>(null)

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    const carregarDados = async () => {
      try {
        // Buscar usuário para pegar a série
        const userRes = await fetch('/api/usuario')
        const userData = await userRes.json()

        if (!userData.sucesso) {
          router.push('/login')
          return
        }

        // Determinar série baseado no nível de ensino (EF ou EM)
        // Fallback: se nivel não existir, detectar pelo ano da turma
        const anoUsuario = userData.usuario.ano
        let nivelUsuario = userData.usuario.nivel

        // Fallback para detectar nível pelo ano
        if (!nivelUsuario) {
          // Anos 6-9 = EF (Ensino Fundamental), Anos 1-3 = EM (Ensino Médio)
          nivelUsuario = anoUsuario >= 6 && anoUsuario <= 9 ? 'EF' : 'EM'
        }

        const userSerie = nivelUsuario === 'EF' ? `${anoUsuario}EF` : `${anoUsuario}EM`
        setSerie(userSerie)
        setNivelEnsino(nivelUsuario as 'EF' | 'EM')

        // Buscar trilhas disponíveis
        const trilhasRes = await fetch(`/api/trilhas?serie=${userSerie}`)
        const trilhasData = await trilhasRes.json()

        if (trilhasData.trilhas) {
          // Transformar dados da API para o formato do frontend
          let trilhasTransformadas = trilhasData.trilhas.map((t: TrilhaAPI) => transformarTrilha(t))

          // Filtrar trilhas: ENEM/Vestibular não aparece para Ensino Fundamental
          if (nivelUsuario === 'EF') {
            trilhasTransformadas = trilhasTransformadas.filter((t: Trilha) =>
              t.id !== 'enem' && !t.nome.toLowerCase().includes('enem') && !t.nome.toLowerCase().includes('vestibular')
            )
          }

          setTrilhas(trilhasTransformadas)

          // Verificar se tem trilha ativa
          const ativa = trilhasTransformadas.find((t: Trilha) => t.ativa)
          if (ativa) {
            setTrilhaAtiva(ativa)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar trilhas:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [router, componente])

  const iniciarTrilha = async (trilha: Trilha) => {
    // Trilha Curiosidade tem fluxo especial - vai para seleção de temas
    if (trilha.id === 'curiosidade') {
      setModalTrilha(null)
      router.push(`/${componente}/trilhas/curiosidade`)
      return
    }

    setIniciando(true)
    try {
      const res = await fetch('/api/trilhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trilha_id: trilha.id,
          serie: serie,
        }),
      })

      const data = await res.json()

      if (data.sucesso) {
        // Atualizar trilha anterior como inativa
        if (trilhaAtiva) {
          setTrilhas(prev => prev.map(t =>
            t.id === trilhaAtiva.id ? { ...t, ativa: false } : t
          ))
        }
        // Nova trilha ativa (mantém semana_atual se já tinha progresso)
        setTrilhaAtiva({
          ...trilha,
          ativa: true,
          semana_atual: trilha.iniciada ? trilha.semana_atual : 1,
          iniciada: true
        })
        setModalTrilha(null)
        // Ir para a página de questões da trilha
        router.push(`/${componente}/trilhas/estudar`)
      } else {
        alert(data.erro || 'Erro ao iniciar trilha')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao iniciar trilha')
    } finally {
      setIniciando(false)
    }
  }

  const pausarTrilha = async () => {
    if (!trilhaAtiva) return
    setPausando(true)
    try {
      const res = await fetch('/api/trilhas/pausar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trilha_id: trilhaAtiva.id,
          serie: serie,
        }),
      })

      const data = await res.json()

      if (data.sucesso) {
        // Atualizar estado local
        setTrilhas(prev => prev.map(t =>
          t.id === trilhaAtiva.id ? { ...t, ativa: false, iniciada: true } : t
        ))
        setTrilhaAtiva(null)
      } else {
        alert(data.erro || 'Erro ao pausar trilha')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao pausar trilha')
    } finally {
      setPausando(false)
    }
  }

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  return (
    <div
      className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]"
      style={{ background: 'var(--bg-base)' }}
    >
      <NavigationRail componente={componente} />

      {/* Header - Compacto para Chromebook */}
      <header className="header-chromebook lg:py-2">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <BackButton href={`/${componente}/menu`} compactOnDesktop />
            <div>
              <h1 className="text-lg lg:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Trilhas de Aprendizado
              </h1>
              <p className="text-xs lg:text-2xs" style={{ color: 'var(--text-muted)' }}>
                Escolha sua jornada de estudos
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Compacto */}
      <main className="max-w-2xl mx-auto px-3 lg:px-4 py-2 lg:py-3">
        {/* Trilha Ativa */}
        {trilhaAtiva && (
          <div className="mb-4 lg:mb-3">
            <h2 className="text-xs lg:text-2xs font-semibold mb-2 lg:mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Sua Trilha Atual
            </h2>
            <div
              className="w-full p-3 lg:p-2.5 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${trilhaAtiva.cor_primaria}20, ${trilhaAtiva.cor_primaria}10)`,
                border: `1.5px solid ${trilhaAtiva.cor_primaria}`,
              }}
            >
              <div className="flex items-center gap-3 lg:gap-2">
                <div
                  className="w-11 h-11 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-xl lg:text-lg"
                  style={{ background: `${trilhaAtiva.cor_primaria}30` }}
                >
                  {trilhaAtiva.icone}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-bold text-sm lg:text-xs" style={{ color: 'var(--text-primary)' }}>
                      {trilhaAtiva.nome}
                    </h3>
                    <span
                      className="badge-chromebook"
                      style={{ background: accentColor, color: isFisica ? '#000' : '#fff' }}
                    >
                      Ativa
                    </span>
                  </div>
                  <p className="text-xs lg:text-2xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Semana {trilhaAtiva.semana_atual || 1}/{trilhaAtiva.total_semanas}
                    {trilhaAtiva.pontos ? ` • ${trilhaAtiva.pontos}pts` : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-1.5 lg:h-1 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${((trilhaAtiva.semana_atual || 1) / trilhaAtiva.total_semanas) * 100}%`,
                          background: trilhaAtiva.cor_primaria,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Botões de ação - Compactos */}
              <div className="flex gap-2 mt-3 lg:mt-2">
                <button
                  onClick={() => router.push(`/${componente}/trilhas/estudar`)}
                  className="flex-1 py-2 lg:py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 btn-chromebook transition-all active:scale-[0.98]"
                  style={{ background: trilhaAtiva.cor_primaria, color: isFisica ? '#000' : '#fff' }}
                >
                  <Play className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                  <span className="text-sm lg:text-xs">Continuar</span>
                </button>
                <button
                  onClick={pausarTrilha}
                  disabled={pausando}
                  className="px-4 lg:px-3 py-2 lg:py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 btn-chromebook transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                  aria-label="Pausar trilha"
                >
                  {pausando ? (
                    <RefreshCw className="w-4 h-4 lg:w-3.5 lg:h-3.5 animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                  )}
                  <span className="text-sm lg:text-xs">Pausar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Trilhas - Compacta */}
        <h2 className="text-xs lg:text-2xs font-semibold mb-2 lg:mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {trilhaAtiva ? 'Outras Trilhas' : 'Escolha uma Trilha'}
        </h2>

        <div className="space-y-2 lg:space-y-1.5">
          {trilhas
            .filter(t => !trilhaAtiva || t.id !== trilhaAtiva.id)
            .sort((a, b) => a.ordem - b.ordem)
            .map((trilha) => {
              const hasPreviousProgress = trilha.iniciada && !trilha.ativa

              return (
                <button
                  key={trilha.id}
                  onClick={() => setModalTrilha(trilha)}
                  className="w-full p-3 lg:p-2.5 rounded-lg text-left transition-all hover:scale-[1.005]"
                  style={{
                    background: 'var(--bg-surface)',
                    border: hasPreviousProgress
                      ? `1px solid ${trilha.cor_primaria}50`
                      : '1px solid var(--border-default)',
                  }}
                >
                  <div className="flex items-center gap-3 lg:gap-2">
                    <div
                      className="w-10 h-10 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center text-lg lg:text-base"
                      style={{ background: `${trilha.cor_primaria}20` }}
                    >
                      {trilha.icone}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm lg:text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                          {trilha.nome}
                        </h3>
                        {hasPreviousProgress && (
                          <span
                            className="badge-chromebook flex-shrink-0"
                            style={{ background: `${trilha.cor_primaria}20`, color: trilha.cor_primaria }}
                          >
                            Pausada
                          </span>
                        )}
                      </div>
                      <p className="text-xs lg:text-2xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {hasPreviousProgress
                          ? `Semana ${trilha.semana_atual} • ${trilha.pontos || 0}pts`
                          : trilha.descricao_curta
                        }
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-2xs flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                          <Clock className="w-2.5 h-2.5" />
                          {trilha.total_semanas}sem
                        </span>
                        <span className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                          {trilha.questoes_por_semana}q/sem
                        </span>
                      </div>
                    </div>
                    {hasPreviousProgress ? (
                      <RotateCcw className="w-4 h-4 lg:w-3.5 lg:h-3.5 flex-shrink-0" style={{ color: trilha.cor_primaria }} />
                    ) : (
                      <ChevronRight className="w-4 h-4 lg:w-3.5 lg:h-3.5 flex-shrink-0" style={{ color: accentColor }} />
                    )}
                  </div>
                </button>
              )
            })}
        </div>

        {/* Dica de uso - Compacta */}
        {trilhaAtiva && (
          <p className="text-center text-2xs mt-3 lg:mt-2 p-2 rounded-md" style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)'
          }}>
            Troque de trilha a qualquer momento. Progresso salvo.
          </p>
        )}
      </main>

      {/* Modal de Confirmação - Compacto */}
      {modalTrilha && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3"
          style={{ background: 'var(--overlay-modal)' }}
          onClick={() => setModalTrilha(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="w-full max-w-xs rounded-xl p-4"
            style={{ background: 'var(--bg-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-12 h-12 lg:w-10 lg:h-10 rounded-lg mx-auto mb-3 flex items-center justify-center text-2xl lg:text-xl"
              style={{ background: `${modalTrilha.cor_primaria}20` }}
            >
              {modalTrilha.icone}
            </div>

            <h3 id="modal-title" className="text-lg lg:text-base font-bold text-center mb-1.5" style={{ color: 'var(--text-primary)' }}>
              {modalTrilha.nome}
            </h3>

            <p className="text-xs lg:text-2xs text-center mb-3" style={{ color: 'var(--text-secondary)' }}>
              {modalTrilha.iniciada
                ? `Retomar semana ${modalTrilha.semana_atual} • ${modalTrilha.pontos || 0}pts`
                : modalTrilha.descricao_completa
              }
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 rounded-md text-center" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-base lg:text-sm font-bold" style={{ color: modalTrilha.cor_primaria }}>
                  {modalTrilha.iniciada ? modalTrilha.semana_atual : modalTrilha.total_semanas}
                </p>
                <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                  {modalTrilha.iniciada ? 'semana' : 'semanas'}
                </p>
              </div>
              <div className="p-2 rounded-md text-center" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-base lg:text-sm font-bold" style={{ color: modalTrilha.cor_primaria }}>
                  {modalTrilha.iniciada ? (modalTrilha.pontos || 0) : modalTrilha.questoes_por_semana}
                </p>
                <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                  {modalTrilha.iniciada ? 'pontos' : 'q/semana'}
                </p>
              </div>
            </div>

            {/* Aviso de troca */}
            {trilhaAtiva && (
              <p className="text-2xs text-center mb-3 p-1.5 rounded-md" style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)'
              }}>
                Progresso em &ldquo;{trilhaAtiva.nome}&rdquo; será salvo.
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setModalTrilha(null)}
                className="flex-1 py-2 lg:py-1.5 rounded-lg font-medium btn-chromebook transition-all active:scale-[0.98]"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                <span className="text-sm lg:text-xs">Cancelar</span>
              </button>
              <button
                onClick={() => iniciarTrilha(modalTrilha)}
                disabled={iniciando}
                className="flex-1 py-2 lg:py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 btn-chromebook transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: modalTrilha.cor_primaria, color: isFisica ? '#000' : '#fff' }}
              >
                {iniciando ? (
                  <RefreshCw className="w-4 h-4 lg:w-3.5 lg:h-3.5 animate-spin" />
                ) : modalTrilha.iniciada ? (
                  <>
                    <RotateCcw className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                    <span className="text-sm lg:text-xs">Retomar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                    <span className="text-sm lg:text-xs">{trilhaAtiva ? 'Trocar' : 'Iniciar'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav componente={componente} />
    </div>
  )
}
