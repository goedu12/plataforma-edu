'use client'
// Teoria - Matriz de Habilidades Essenciais 2026

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronRight,
  BookOpen,
  GraduationCap,
  Atom,
  Calculator,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'
import { getConteudoTeoria, type Topico } from '@/lib/teoria'

export default function TeoriaPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [topicos, setTopicos] = useState<Topico[]>([])
  const [loading, setLoading] = useState(true)
  const [serie, setSerie] = useState<number>(1)
  const [bimestre, setBimestre] = useState<number>(1)

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

        // Determinar série (1, 2 ou 3 para Ensino Médio)
        const anoUsuario = userData.usuario.ano || 1
        setSerie(anoUsuario)

        // Carregar tópicos de teoria
        const topicosTeoria = getConteudoTeoria(componente, anoUsuario, bimestre)
        setTopicos(topicosTeoria)
      } catch (error) {
        console.error('Erro ao carregar teoria:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [router, componente, bimestre])

  // Recarregar quando mudar bimestre
  useEffect(() => {
    if (serie > 0) {
      const topicosTeoria = getConteudoTeoria(componente, serie, bimestre)
      setTopicos(topicosTeoria)
    }
  }, [componente, serie, bimestre])

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const ComponenteIcon = isFisica ? Atom : Calculator

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
            <div className="flex-1">
              <h1 className="text-lg lg:text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <BookOpen className="w-5 h-5 lg:w-4 lg:h-4" style={{ color: accentColor }} />
                Teoria
              </h1>
              <p className="text-xs lg:text-2xs" style={{ color: 'var(--text-muted)' }}>
                {isFisica ? 'Física' : 'Matemática'} - {serie}ª Série EM
              </p>
            </div>
            {/* Badge da série */}
            <div
              className="p-2.5 rounded-xl flex items-center gap-1.5"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
              }}
            >
              <GraduationCap className="w-4 h-4 lg:w-3.5 lg:h-3.5" style={{ color: accentColor }} />
              <span className="text-xs lg:text-2xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {serie}ª Série
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Compacto */}
      <main className="max-w-2xl mx-auto px-3 lg:px-4 py-2 lg:py-3">
        {/* Seletor de Bimestre */}
        <div className="mb-4 lg:mb-3">
          <h2 className="text-xs lg:text-2xs font-semibold mb-2 lg:mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Bimestre
          </h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((b) => (
              <button
                key={b}
                onClick={() => setBimestre(b)}
                className={`flex-1 py-2 lg:py-1.5 rounded-lg font-medium transition-all ${
                  bimestre === b ? 'scale-[1.02]' : ''
                }`}
                style={{
                  background: bimestre === b ? accentColor : 'var(--bg-surface)',
                  color: bimestre === b
                    ? (isFisica ? '#000' : '#fff')
                    : 'var(--text-secondary)',
                  border: bimestre === b
                    ? `1.5px solid ${accentColor}`
                    : '1px solid var(--border-default)',
                }}
              >
                <span className="text-sm lg:text-xs">{b}º</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info do Bimestre */}
        <div
          className="mb-4 lg:mb-3 p-3 lg:p-2.5 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <ComponenteIcon className="w-5 h-5 lg:w-4 lg:h-4" style={{ color: accentColor }} />
            <div>
              <p className="text-sm lg:text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {bimestre}º Bimestre - {serie}ª Série
              </p>
              <p className="text-xs lg:text-2xs" style={{ color: 'var(--text-muted)' }}>
                {topicos.length} tópico{topicos.length !== 1 ? 's' : ''} disponíve{topicos.length !== 1 ? 'is' : 'l'}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Tópicos */}
        <h2 className="text-xs lg:text-2xs font-semibold mb-2 lg:mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Conteúdos
        </h2>

        {topicos.length === 0 ? (
          <div
            className="p-6 rounded-lg text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Conteúdo em breve
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Os tópicos do {bimestre}º bimestre ainda não foram adicionados.
            </p>
          </div>
        ) : (
          <div className="space-y-2 lg:space-y-1.5">
            {topicos.map((topico, index) => (
              <button
                key={topico.id}
                onClick={() => router.push(`/${componente}/teoria/${topico.id}`)}
                className="w-full p-3 lg:p-2.5 rounded-lg text-left transition-all hover:scale-[1.005]"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div className="flex items-center gap-3 lg:gap-2">
                  <div
                    className="w-10 h-10 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center text-lg lg:text-base font-bold"
                    style={{
                      background: `${accentColor}20`,
                      color: accentColor,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm lg:text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                      {topico.titulo}
                    </h3>
                    <p className="text-xs lg:text-2xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {topico.resumo}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {topico.formulas && topico.formulas.length > 0 && (
                        <span className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                          📐 {topico.formulas.length} fórmula{topico.formulas.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {topico.exemplos && topico.exemplos.length > 0 && (
                        <span className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                          💡 {topico.exemplos.length} exemplo{topico.exemplos.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 lg:w-3.5 lg:h-3.5 flex-shrink-0" style={{ color: accentColor }} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Dica */}
        {topicos.length > 0 && (
          <p className="text-center text-2xs mt-3 lg:mt-2 p-2 rounded-md" style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)'
          }}>
            Toque em um tópico para ver a teoria completa
          </p>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
