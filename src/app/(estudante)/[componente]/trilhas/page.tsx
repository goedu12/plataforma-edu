'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  GraduationCap,
  Trophy,
  Wrench,
  Rocket,
  Microscope,
  Zap,
  ChevronRight,
  Lock,
  Play,
  CheckCircle,
  Clock,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'

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
  progresso?: number
}

const iconMap: Record<string, typeof GraduationCap> = {
  'passar_ano': GraduationCap,
  'enem': Trophy,
  'recuperacao': Wrench,
  'desafio': Rocket,
  'curiosidade': Microscope,
  'pressa': Zap,
}

const emojiToIcon: Record<string, string> = {
  '🎓': 'passar_ano',
  '🏆': 'enem',
  '🔧': 'recuperacao',
  '🚀': 'desafio',
  '🔬': 'curiosidade',
  '⚡': 'pressa',
}

export default function TrilhasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [trilhas, setTrilhas] = useState<Trilha[]>([])
  const [trilhaAtiva, setTrilhaAtiva] = useState<Trilha | null>(null)
  const [loading, setLoading] = useState(true)
  const [iniciando, setIniciando] = useState(false)
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
          setTrilhas(trilhasData.trilhas)

          // Verificar se tem trilha ativa
          const ativa = trilhasData.trilhas.find((t: Trilha) => t.ativa)
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
        setTrilhaAtiva({ ...trilha, ativa: true, semana_atual: 1 })
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

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const getIconComponent = (trilha: Trilha) => {
    const iconKey = emojiToIcon[trilha.icone] || trilha.id
    return iconMap[iconKey] || GraduationCap
  }

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
            <button
              onClick={() => router.push(`/${componente}/trilhas/estudar`)}
              className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
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
                    <Play className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                </div>
              </div>
            </button>
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
              const IconComponent = getIconComponent(trilha)
              const isLocked = !!(trilhaAtiva && trilhaAtiva.id !== trilha.id)

              return (
                <button
                  key={trilha.id}
                  onClick={() => !isLocked && setModalTrilha(trilha)}
                  disabled={isLocked}
                  className="w-full p-4 rounded-xl text-left transition-all"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    opacity: isLocked ? 0.6 : 1,
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
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {trilha.nome}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {trilha.descricao_curta}
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
                    {isLocked ? (
                      <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    ) : (
                      <ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
                    )}
                  </div>
                </button>
              )
            })}
        </div>

        {/* Aviso se tiver trilha ativa */}
        {trilhaAtiva && (
          <p className="text-center text-sm mt-4 p-3 rounded-lg" style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)'
          }}>
            Você já tem uma trilha ativa. Pause ela primeiro para iniciar outra.
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
              {modalTrilha.descricao_completa}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-lg font-bold" style={{ color: modalTrilha.cor_primaria }}>
                  {modalTrilha.total_semanas}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>semanas</p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-lg font-bold" style={{ color: modalTrilha.cor_primaria }}>
                  {modalTrilha.questoes_por_semana}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>questões/semana</p>
              </div>
            </div>

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
                  'Iniciando...'
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Iniciar
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
