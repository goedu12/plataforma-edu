'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronRight,
  Play,
  Check,
  Star,
  Sparkles,
  Lightbulb,
  Trophy
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'

interface TemaCuriosidade {
  id: string
  nome: string
  icone: string
  descricao: string
  conteudos_fisica: string[]
  total_questoes: number
  ordem: number
  questoes_respondidas?: number
  questoes_corretas?: number
  concluido?: boolean
}

export default function TrilhaCuriosidadePage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [temas, setTemas] = useState<TemaCuriosidade[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionando, setSelecionando] = useState<string | null>(null)
  const [estatisticas, setEstatisticas] = useState({
    totalTemas: 0,
    temasIniciados: 0,
    temasConcluidos: 0,
  })
  const [serie, setSerie] = useState<string>('1EM')

  const isFisica = componente === 'fisica'
  const corPrimaria = '#00BCD4' // Cor da trilha curiosidade
  const corAccent = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    carregarTemas()
  }, [router, componente])

  const carregarTemas = async () => {
    try {
      // Buscar série do usuário
      const userRes = await fetch('/api/usuario')
      const userData = await userRes.json()
      if (userData.sucesso) {
        const anoUsuario = userData.usuario.ano
        const nivelUsuario = userData.usuario.nivel || (anoUsuario >= 6 && anoUsuario <= 9 ? 'EF' : 'EM')
        const userSerie = nivelUsuario === 'EF' ? `${anoUsuario}EF` : `${anoUsuario}EM`
        setSerie(userSerie)
      }

      // Buscar temas
      const res = await fetch('/api/trilhas/curiosidade')
      const data = await res.json()

      if (data.sucesso) {
        setTemas(data.temas || [])
        setEstatisticas(data.estatisticas || {
          totalTemas: 0,
          temasIniciados: 0,
          temasConcluidos: 0,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar temas:', error)
    } finally {
      setLoading(false)
    }
  }

  const selecionarTema = async (tema: TemaCuriosidade) => {
    setSelecionando(tema.id)
    try {
      const res = await fetch('/api/trilhas/curiosidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temaId: tema.id,
          serie,
        }),
      })

      const data = await res.json()

      if (data.sucesso) {
        router.push(`/${componente}/trilhas/curiosidade/${tema.id}`)
      } else {
        alert(data.erro || 'Erro ao selecionar tema')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao selecionar tema')
    } finally {
      setSelecionando(null)
    }
  }

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  return (
    <div
      className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]"
      style={{ background: 'var(--bg-base)' }}
    >
      <NavigationRail componente={componente} />

      {/* Header */}
      <header className="header-chromebook lg:py-2">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <BackButton href={`/${componente}/trilhas`} compactOnDesktop />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔬</span>
                <h1 className="text-lg lg:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Trilha Curiosidade
                </h1>
              </div>
              <p className="text-xs lg:text-sm" style={{ color: 'var(--text-muted)' }}>
                Descubra a fisica do dia-a-dia
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-3 lg:px-4 py-2 lg:py-3">
        {/* Estatísticas */}
        <div
          className="p-4 lg:p-3 rounded-xl mb-4 lg:mb-3"
          style={{
            background: `linear-gradient(135deg, ${corPrimaria}20, ${corPrimaria}10)`,
            border: `1px solid ${corPrimaria}40`,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${corPrimaria}30` }}
            >
              <Sparkles className="w-5 h-5" style={{ color: corPrimaria }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Explore o Mundo da Fisica
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Sem pressao, pura curiosidade!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
              <p className="text-lg font-bold" style={{ color: corPrimaria }}>
                {estatisticas.totalTemas}
              </p>
              <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>Temas</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--warning)' }}>
                {estatisticas.temasIniciados}
              </p>
              <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>Iniciados</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>
                {estatisticas.temasConcluidos}
              </p>
              <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>Concluidos</p>
            </div>
          </div>
        </div>

        {/* Lista de Temas */}
        <h2 className="text-xs lg:text-sm font-semibold mb-2 lg:mb-2" style={{ color: 'var(--text-secondary)' }}>
          Escolha um Tema
        </h2>

        <div className="space-y-2 lg:space-y-2.5">
          {temas.map((tema) => {
            const progresso = tema.total_questoes > 0
              ? ((tema.questoes_respondidas || 0) / tema.total_questoes) * 100
              : 0
            const iniciado = (tema.questoes_respondidas || 0) > 0
            const selecionandoEste = selecionando === tema.id

            return (
              <button
                key={tema.id}
                onClick={() => selecionarTema(tema)}
                disabled={selecionandoEste}
                className="w-full p-3 lg:p-4 rounded-lg text-left transition-all hover:scale-[1.005] disabled:opacity-70"
                style={{
                  background: tema.concluido
                    ? `linear-gradient(135deg, var(--success)10, var(--success)05)`
                    : 'var(--bg-surface)',
                  border: tema.concluido
                    ? '1px solid var(--success)'
                    : iniciado
                    ? `1px solid ${corPrimaria}50`
                    : '1px solid var(--border-default)',
                }}
              >
                <div className="flex items-center gap-3 lg:gap-2">
                  <div
                    className="w-12 h-12 lg:w-14 lg:h-14 rounded-lg flex items-center justify-center text-2xl lg:text-3xl"
                    style={{
                      background: tema.concluido
                        ? 'var(--success)20'
                        : `${corPrimaria}20`,
                    }}
                  >
                    {tema.concluido ? <Trophy className="w-6 h-6 text-green-500" /> : tema.icone}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm lg:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                        {tema.nome}
                      </h3>
                      {tema.concluido && (
                        <span
                          className="badge-chromebook flex-shrink-0"
                          style={{ background: 'var(--success)20', color: 'var(--success)' }}
                        >
                          <Check className="w-2.5 h-2.5" />
                          Completo
                        </span>
                      )}
                      {iniciado && !tema.concluido && (
                        <span
                          className="badge-chromebook flex-shrink-0"
                          style={{ background: `${corPrimaria}20`, color: corPrimaria }}
                        >
                          {tema.questoes_respondidas}/{tema.total_questoes}
                        </span>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm truncate mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      {tema.descricao}
                    </p>

                    {/* Barra de progresso */}
                    {iniciado && (
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-1.5 lg:h-1 rounded-full overflow-hidden"
                          style={{ background: 'var(--bg-elevated)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progresso}%`,
                              background: tema.concluido ? 'var(--success)' : corPrimaria,
                            }}
                          />
                        </div>
                        <span className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                          {Math.round(progresso)}%
                        </span>
                      </div>
                    )}

                    {!iniciado && (
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                          {tema.total_questoes} questoes curiosas
                        </span>
                      </div>
                    )}
                  </div>

                  {selecionandoEste ? (
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: corPrimaria }} />
                  ) : tema.concluido ? (
                    <Star className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warning)', fill: 'var(--warning)' }} />
                  ) : iniciado ? (
                    <Play className="w-5 h-5 flex-shrink-0" style={{ color: corPrimaria }} />
                  ) : (
                    <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: corAccent }} />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Dica */}
        <div
          className="mt-4 p-3 rounded-lg flex items-start gap-3"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              Dica: Sem pressa!
            </p>
            <p className="text-2xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Nesta trilha nao tem tempo limite. Explore cada tema no seu ritmo e descubra como a fisica esta em tudo ao seu redor.
            </p>
          </div>
        </div>
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
