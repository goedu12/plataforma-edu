'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Calculator,
  AlertCircle,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'
import { getTopico, getConteudoTeoria, type Topico } from '@/lib/teoria'

export default function TopicoTeoriaPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente
  const topicoId = params.topicoId as string

  const [topico, setTopico] = useState<Topico | null>(null)
  const [topicos, setTopicos] = useState<Topico[]>([])
  const [loading, setLoading] = useState(true)
  const [serie, setSerie] = useState<number>(1)
  const [bimestre] = useState<number>(1)

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

        const anoUsuario = userData.usuario.ano || 1
        setSerie(anoUsuario)

        // Carregar tópico específico
        const topicoEncontrado = getTopico(componente, anoUsuario, topicoId, bimestre)
        setTopico(topicoEncontrado)

        // Carregar lista de tópicos para navegação
        const todosTopicos = getConteudoTeoria(componente, anoUsuario, bimestre)
        setTopicos(todosTopicos)
      } catch (error) {
        console.error('Erro ao carregar tópico:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [router, componente, topicoId, bimestre])

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Navegação entre tópicos
  const currentIndex = topicos.findIndex(t => t.id === topicoId)
  const prevTopico = currentIndex > 0 ? topicos[currentIndex - 1] : null
  const nextTopico = currentIndex < topicos.length - 1 ? topicos[currentIndex + 1] : null

  if (!topico) {
    return (
      <div
        className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]"
        style={{ background: 'var(--bg-base)' }}
      >
        <NavigationRail componente={componente} />
        <header className="header-chromebook lg:py-2">
          <div className="max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <BackButton href={`/${componente}/teoria`} compactOnDesktop />
              <h1 className="text-lg lg:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Tópico não encontrado
              </h1>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-3 lg:px-4 py-4">
          <div
            className="p-6 rounded-lg text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--error)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Este tópico não foi encontrado
            </p>
            <button
              onClick={() => router.push(`/${componente}/teoria`)}
              className="mt-4 px-4 py-2 rounded-lg font-medium"
              style={{ background: accentColor, color: isFisica ? '#000' : '#fff' }}
            >
              Voltar para Teoria
            </button>
          </div>
        </main>
        <BottomNav componente={componente} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]"
      style={{ background: 'var(--bg-base)' }}
    >
      <NavigationRail componente={componente} />

      {/* Header */}
      <header className="header-chromebook lg:py-2">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <BackButton href={`/${componente}/teoria`} compactOnDesktop />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg lg:text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {topico.titulo}
              </h1>
              <p className="text-xs lg:text-2xs" style={{ color: 'var(--text-muted)' }}>
                {isFisica ? 'Física' : 'Matemática'} - {serie}ª Série • {bimestre}º Bimestre
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-3 lg:px-4 py-2 lg:py-3 space-y-4 lg:space-y-3">
        {/* Introdução */}
        <section
          className="p-4 lg:p-3 rounded-lg"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 lg:w-4 lg:h-4" style={{ color: accentColor }} />
            <h2 className="text-sm lg:text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              Introdução
            </h2>
          </div>
          <div className="space-y-2">
            {topico.conteudo.map((paragrafo, index) => (
              <p key={index} className="text-sm lg:text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {paragrafo}
              </p>
            ))}
          </div>
        </section>

        {/* Fórmulas */}
        {topico.formulas && topico.formulas.length > 0 && (
          <section
            className="p-4 lg:p-3 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${accentColor}10, ${accentColor}05)`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 lg:w-4 lg:h-4" style={{ color: accentColor }} />
              <h2 className="text-sm lg:text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Fórmulas
              </h2>
            </div>
            <div className="space-y-3 lg:space-y-2">
              {topico.formulas.map((formula, index) => (
                <div
                  key={index}
                  className="p-3 lg:p-2 rounded-md"
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <code
                    className="block text-base lg:text-sm font-mono p-2 rounded text-center mb-2"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: accentColor,
                    }}
                  >
                    {formula.expressao}
                  </code>
                  <p className="text-xs lg:text-2xs" style={{ color: 'var(--text-muted)' }}>
                    {formula.descricao}
                  </p>
                  {formula.variaveis && formula.variaveis.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formula.variaveis.map((v, vi) => (
                        <p key={vi} className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                          <span style={{ color: accentColor }}>{v.simbolo}</span> = {v.significado}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Exemplos */}
        {topico.exemplos && topico.exemplos.length > 0 && (
          <section
            className="p-4 lg:p-3 rounded-lg"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 lg:w-4 lg:h-4" style={{ color: 'var(--warning)' }} />
              <h2 className="text-sm lg:text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Exemplos Resolvidos
              </h2>
            </div>
            <div className="space-y-3 lg:space-y-2">
              {topico.exemplos.map((exemplo, index) => (
                <div
                  key={index}
                  className="p-3 lg:p-2 rounded-md"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <p className="text-sm lg:text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    {index + 1}. {exemplo.enunciado}
                  </p>
                  <div
                    className="p-2 rounded border-l-2"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--success)',
                    }}
                  >
                    <p className="text-xs lg:text-2xs font-medium mb-1" style={{ color: 'var(--success)' }}>
                      Resolução:
                    </p>
                    <div className="space-y-1">
                      {exemplo.resolucao.map((passo, pi) => (
                        <p key={pi} className="text-xs lg:text-2xs" style={{ color: 'var(--text-secondary)' }}>
                          {passo}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs lg:text-2xs font-semibold mt-2" style={{ color: accentColor }}>
                      Resposta: {exemplo.resposta}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dica Importante */}
        {topico.dicaImportante && (
          <section
            className="p-4 lg:p-3 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">💡</span>
              <h2 className="text-sm lg:text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Dica Importante
              </h2>
            </div>
            <p className="text-xs lg:text-2xs" style={{ color: 'var(--text-secondary)' }}>
              {topico.dicaImportante}
            </p>
          </section>
        )}

        {/* Conexão com o Cotidiano */}
        {topico.conexaoCotidiano && (
          <section
            className="p-4 lg:p-3 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}03)`,
              border: `1px solid ${accentColor}20`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🌍</span>
              <h2 className="text-sm lg:text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                No seu dia a dia
              </h2>
            </div>
            <p className="text-xs lg:text-2xs" style={{ color: 'var(--text-secondary)' }}>
              {topico.conexaoCotidiano}
            </p>
          </section>
        )}

        {/* Navegação entre tópicos */}
        <div className="flex gap-2 pt-2">
          {prevTopico ? (
            <button
              onClick={() => router.push(`/${componente}/teoria/${prevTopico.id}`)}
              className="flex-1 py-2 lg:py-1.5 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              <ChevronLeft className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
              <span className="text-xs lg:text-2xs truncate">Anterior</span>
            </button>
          ) : (
            <div className="flex-1" />
          )}
          {nextTopico ? (
            <button
              onClick={() => router.push(`/${componente}/teoria/${nextTopico.id}`)}
              className="flex-1 py-2 lg:py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: accentColor,
                color: isFisica ? '#000' : '#fff',
              }}
            >
              <span className="text-xs lg:text-2xs truncate">Próximo</span>
              <ChevronRight className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => router.push(`/${componente}/teoria`)}
              className="flex-1 py-2 lg:py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: accentColor,
                color: isFisica ? '#000' : '#fff',
              }}
            >
              <span className="text-xs lg:text-2xs">Ver todos os tópicos</span>
            </button>
          )}
        </div>
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
