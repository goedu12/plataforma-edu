'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calculator,
  Lightbulb,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import { FormulaCard, ExemploResolvido, DicaCard, ConteudoCard } from '@/components/teoria'
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
        const userRes = await fetch('/api/usuario')
        const userData = await userRes.json()

        if (!userData.sucesso) {
          router.push('/login')
          return
        }

        const anoUsuario = userData.usuario.ano || 1
        setSerie(anoUsuario)

        const topicoEncontrado = getTopico(componente, anoUsuario, topicoId, bimestre)
        setTopico(topicoEncontrado)

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
              <div className="flex items-center gap-2">
                <span className="text-xl">{topico.icone}</span>
                <h1 className="text-lg lg:text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {topico.titulo}
                </h1>
              </div>
              <p className="text-xs lg:text-2xs" style={{ color: 'var(--text-muted)' }}>
                {isFisica ? 'Física' : 'Matemática'} • {serie}ª Série • {bimestre}º Bimestre
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-3 lg:px-4 py-3 space-y-4">
        {/* Resumo */}
        <div
          className="p-3 rounded-xl text-center"
          style={{
            background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}05)`,
            border: `1px solid ${accentColor}25`,
          }}
        >
          <p className="text-sm lg:text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {topico.resumo}
          </p>
        </div>

        {/* Conteúdo Principal */}
        <ConteudoCard
          paragrafos={topico.conteudo}
          titulo="O que você precisa saber"
          accentColor={accentColor}
        />

        {/* Fórmulas */}
        {topico.formulas && topico.formulas.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 lg:w-4 lg:h-4" style={{ color: accentColor }} />
              <h2 className="text-sm lg:text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Fórmulas Importantes
              </h2>
            </div>
            <div className="space-y-3">
              {topico.formulas.map((formula, index) => (
                <FormulaCard
                  key={index}
                  expressao={formula.expressao}
                  descricao={formula.descricao}
                  variaveis={formula.variaveis}
                  accentColor={accentColor}
                  isFisica={isFisica}
                />
              ))}
            </div>
          </section>
        )}

        {/* Dica Importante */}
        {topico.dicaImportante && (
          <DicaCard
            tipo="macete"
            conteudo={topico.dicaImportante}
          />
        )}

        {/* Exemplos Resolvidos */}
        {topico.exemplos && topico.exemplos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 lg:w-4 lg:h-4" style={{ color: 'var(--warning)' }} />
              <h2 className="text-sm lg:text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Exemplos Resolvidos
              </h2>
              <span
                className="text-2xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                Clique para ver a resolução
              </span>
            </div>
            <div className="space-y-3">
              {topico.exemplos.map((exemplo, index) => (
                <ExemploResolvido
                  key={index}
                  numero={index + 1}
                  enunciado={exemplo.enunciado}
                  resolucao={exemplo.resolucao}
                  resposta={exemplo.resposta}
                  accentColor={accentColor}
                  isFisica={isFisica}
                />
              ))}
            </div>
          </section>
        )}

        {/* Conexão com o Cotidiano */}
        {topico.conexaoCotidiano && (
          <DicaCard
            tipo="conceito"
            titulo="No seu dia a dia"
            conteudo={topico.conexaoCotidiano}
          />
        )}

        {/* Navegação entre tópicos */}
        <div className="flex gap-2 pt-3">
          {prevTopico ? (
            <button
              onClick={() => router.push(`/${componente}/teoria/${prevTopico.id}`)}
              className="flex-1 py-2.5 lg:py-2 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs lg:text-2xs truncate">Anterior</span>
            </button>
          ) : (
            <div className="flex-1" />
          )}
          {nextTopico ? (
            <button
              onClick={() => router.push(`/${componente}/teoria/${nextTopico.id}`)}
              className="flex-1 py-2.5 lg:py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              style={{
                background: accentColor,
                color: isFisica ? '#000' : '#fff',
              }}
            >
              <span className="text-xs lg:text-2xs truncate">Próximo: {nextTopico.titulo}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => router.push(`/${componente}/teoria`)}
              className="flex-1 py-2.5 lg:py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              style={{
                background: accentColor,
                color: isFisica ? '#000' : '#fff',
              }}
            >
              <span className="text-xs lg:text-2xs">Concluído! Ver todos</span>
            </button>
          )}
        </div>
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
