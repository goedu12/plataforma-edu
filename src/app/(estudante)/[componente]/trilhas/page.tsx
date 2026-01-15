'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Clock,
  RefreshCw,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
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

        const userSerie = `${userData.usuario.ano}EM`
        setSerie(userSerie)

        // Buscar trilhas disponíveis
        const trilhasRes = await fetch(`/api/trilhas?serie=${userSerie}`)
        const trilhasData = await trilhasRes.json()

        if (trilhasData.trilhas) {
          // Transformar dados da API para o formato do frontend
          const trilhasTransformadas = trilhasData.trilhas.map((t: TrilhaAPI) => transformarTrilha(t))
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

      {/* Header */}
      <header className="page-header">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ border: '1px solid var(--border-default)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Trilhas de Aprendizado
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Escolha sua jornada de estudos
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Trilha Ativa */}
        {trilhaAtiva && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Sua Trilha Atual
            </h2>
            <div
              className="w-full p-4 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${trilhaAtiva.cor_primaria}20, ${trilhaAtiva.cor_primaria}10)`,
                border: `2px solid ${trilhaAtiva.cor_primaria}`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `${trilhaAtiva.cor_primaria}30` }}
                >
                  {trilhaAtiva.icone}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {trilhaAtiva.nome}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: accentColor, color: isFisica ? '#000' : '#fff' }}
                    >
                      Ativa
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                    Semana {trilhaAtiva.semana_atual || 1} de {trilhaAtiva.total_semanas}
                    {trilhaAtiva.pontos ? ` • ${trilhaAtiva.pontos} pts` : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
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
              {/* Botões de ação */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => router.push(`/${componente}/trilhas/estudar`)}
                  className="flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
                  style={{ background: trilhaAtiva.cor_primaria, color: '#fff' }}
                >
                  <Play className="w-4 h-4" />
                  Continuar
                </button>
                <button
                  onClick={pausarTrilha}
                  disabled={pausando}
                  className="px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                >
                  {pausando ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                  Pausar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Trilhas */}
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          {trilhaAtiva ? 'Outras Trilhas' : 'Escolha uma Trilha'}
        </h2>

        <div className="space-y-3">
          {trilhas
            .filter(t => !trilhaAtiva || t.id !== trilhaAtiva.id)
            .sort((a, b) => a.ordem - b.ordem)
            .map((trilha) => {
              const hasPreviousProgress = trilha.iniciada && !trilha.ativa

              return (
                <button
                  key={trilha.id}
                  onClick={() => setModalTrilha(trilha)}
                  className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: 'var(--bg-surface)',
                    border: hasPreviousProgress
                      ? `1px solid ${trilha.cor_primaria}50`
                      : '1px solid var(--border-default)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${trilha.cor_primaria}20` }}
                    >
                      {trilha.icone}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {trilha.nome}
                        </h3>
                        {hasPreviousProgress && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: `${trilha.cor_primaria}20`, color: trilha.cor_primaria }}
                          >
                            Pausada
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {hasPreviousProgress
                          ? `Semana ${trilha.semana_atual} • ${trilha.pontos || 0} pts`
                          : trilha.descricao_curta
                        }
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Clock className="w-3 h-3" />
                          {trilha.total_semanas} semanas
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {trilha.questoes_por_semana} questões/semana
                        </span>
                      </div>
                    </div>
                    {hasPreviousProgress ? (
                      <RotateCcw className="w-5 h-5" style={{ color: trilha.cor_primaria }} />
                    ) : (
                      <ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
                    )}
                  </div>
                </button>
              )
            })}
        </div>

        {/* Dica de uso */}
        {trilhaAtiva && (
          <p className="text-center text-sm mt-4 p-3 rounded-lg" style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)'
          }}>
            Você pode trocar de trilha a qualquer momento. Seu progresso será salvo.
          </p>
        )}
      </main>

      {/* Modal de Confirmação */}
      {modalTrilha && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setModalTrilha(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--bg-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ background: `${modalTrilha.cor_primaria}20` }}
            >
              {modalTrilha.icone}
            </div>

            <h3 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
              {modalTrilha.nome}
            </h3>

            <p className="text-sm text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
              {modalTrilha.iniciada
                ? `Retomar da semana ${modalTrilha.semana_atual} com ${modalTrilha.pontos || 0} pontos acumulados.`
                : modalTrilha.descricao_completa
              }
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-lg font-bold" style={{ color: modalTrilha.cor_primaria }}>
                  {modalTrilha.iniciada ? modalTrilha.semana_atual : modalTrilha.total_semanas}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {modalTrilha.iniciada ? 'semana atual' : 'semanas'}
                </p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-lg font-bold" style={{ color: modalTrilha.cor_primaria }}>
                  {modalTrilha.iniciada ? (modalTrilha.pontos || 0) : modalTrilha.questoes_por_semana}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {modalTrilha.iniciada ? 'pontos' : 'questões/semana'}
                </p>
              </div>
            </div>

            {/* Aviso de troca */}
            {trilhaAtiva && (
              <p className="text-xs text-center mb-4 p-2 rounded-lg" style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)'
              }}>
                Seu progresso em &ldquo;{trilhaAtiva.nome}&rdquo; será salvo e você poderá voltar depois.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModalTrilha(null)}
                className="flex-1 py-3 rounded-lg font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => iniciarTrilha(modalTrilha)}
                disabled={iniciando}
                className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                style={{ background: modalTrilha.cor_primaria, color: '#fff' }}
              >
                {iniciando ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : modalTrilha.iniciada ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Retomar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    {trilhaAtiva ? 'Trocar' : 'Iniciar'}
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
