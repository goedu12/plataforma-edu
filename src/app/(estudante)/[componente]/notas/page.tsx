'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, GraduationCap, RefreshCw, WifiOff, TrendingUp, Calendar, Target, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import type { Componente } from '@/types'

interface NotaBimestre {
  bimestre: number
  ano: number
  data_inicio: string
  data_fim: string
  questoes_total: number
  questoes_corretas: number
  dias_ativos: number
  nota_desempenho: number
  nota_participacao: number
  nota_frequencia: number
  nota_calculada: number
  nota_final: number
  bloqueio: 'desempenho_baixo' | 'participacao_baixa' | null
  meta_questoes: number
  meta_dias: number
}

export default function NotasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [notaAtual, setNotaAtual] = useState<NotaBimestre | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const buscarNotas = async () => {
    setLoading(true)
    setErro(null)

    try {
      const response = await fetch(`/api/notas?componente=${componente}`)
      const data = await response.json()

      if (data.sucesso) {
        setNotaAtual(data.bimestre_atual)
      } else {
        setErro(data.erro || 'Erro ao carregar notas')
      }
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
      setErro('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    buscarNotas()
  }, [componente])

  const handleVoltar = () => {
    router.push(`/${componente}/menu`)
  }

  const nomeComponente = componente === 'fisica' ? 'Física' : 'Matemática'
  const isFisica = componente === 'fisica'
  const bgColor = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'

  const getNotaColor = (nota: number) => {
    if (nota >= 7) return 'text-green-600'
    if (nota >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getNotaBgColor = (nota: number) => {
    if (nota >= 7) return 'bg-green-100'
    if (nota >= 5) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  return (
    <div className="min-h-screen bg-calm-bg pb-8">
      {/* Header */}
      <header className={`${bgColor} text-white px-4 pt-4 pb-16`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleVoltar}
              className="p-2 -ml-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1 className="font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Minhas Notas
              </h1>
              <p className="text-sm text-white/80">{nomeComponente}</p>
            </div>
            <button
              onClick={buscarNotas}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {notaAtual && (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-sm text-white/80 mb-1">
                {notaAtual.bimestre}º Bimestre de {notaAtual.ano}
              </p>
              <p className={`text-5xl font-bold ${notaAtual.bloqueio ? 'text-yellow-300' : ''}`}>
                {notaAtual.nota_final.toFixed(1)}
              </p>
              <p className="text-sm text-white/80 mt-1">Nota Atual</p>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 -mt-8">
        {erro ? (
          <Card className="text-center py-10">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-100">
              <WifiOff className="w-8 h-8 text-error" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Erro</h2>
            <p className="text-text-secondary mb-6">{erro}</p>
            <Button variant="primary" onClick={buscarNotas}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </Card>
        ) : notaAtual ? (
          <div className="space-y-4">
            {/* Alerta de bloqueio */}
            {notaAtual.bloqueio && (
              <Card className="bg-orange-50 border border-orange-200 animate-slide-up">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-700">Nota Limitada</p>
                    <p className="text-sm text-orange-900">
                      {notaAtual.bloqueio === 'desempenho_baixo'
                        ? 'Sua taxa de acerto está abaixo de 40%. Nota máxima: 5.9'
                        : 'Sua participação está abaixo de 30 questões. Nota máxima: 5.9'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Detalhes das notas */}
            <Card className="animate-slide-up">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Composição da Nota
              </h3>

              <div className="space-y-4">
                {/* Desempenho */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-secondary">Desempenho (50%)</span>
                    <span className={`font-bold ${getNotaColor(notaAtual.nota_desempenho)}`}>
                      {notaAtual.nota_desempenho.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 bg-calm-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getNotaBgColor(notaAtual.nota_desempenho).replace('bg-', 'bg-').replace('-100', '-500')}`}
                      style={{ width: `${(notaAtual.nota_desempenho / 10) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {notaAtual.questoes_corretas} de {notaAtual.questoes_total} questões corretas
                    ({notaAtual.questoes_total > 0 ? Math.round((notaAtual.questoes_corretas / notaAtual.questoes_total) * 100) : 0}%)
                  </p>
                </div>

                {/* Participação */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-secondary">Participação (30%)</span>
                    <span className={`font-bold ${getNotaColor(notaAtual.nota_participacao)}`}>
                      {notaAtual.nota_participacao.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 bg-calm-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getNotaBgColor(notaAtual.nota_participacao).replace('bg-', 'bg-').replace('-100', '-500')}`}
                      style={{ width: `${(notaAtual.nota_participacao / 10) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {notaAtual.questoes_total} de {notaAtual.meta_questoes} questões (meta)
                  </p>
                </div>

                {/* Frequência */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-secondary">Frequência (20%)</span>
                    <span className={`font-bold ${getNotaColor(notaAtual.nota_frequencia)}`}>
                      {notaAtual.nota_frequencia.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 bg-calm-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getNotaBgColor(notaAtual.nota_frequencia).replace('bg-', 'bg-').replace('-100', '-500')}`}
                      style={{ width: `${(notaAtual.nota_frequencia / 10) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {notaAtual.dias_ativos} de {notaAtual.meta_dias} dias ativos (meta)
                  </p>
                </div>
              </div>
            </Card>

            {/* Período do bimestre */}
            <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Período do Bimestre</p>
                  <p className="text-sm text-text-secondary">
                    {new Date(notaAtual.data_inicio).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(notaAtual.data_fim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </Card>

            {/* Dicas */}
            <Card className="animate-slide-up bg-orange-50 border border-orange-200" style={{ animationDelay: '200ms' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100">
                  <Target className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-orange-700 text-sm mb-1">Como melhorar sua nota?</p>
                  <ul className="text-sm text-orange-900 space-y-1">
                    <li>• Responda questões com atenção para aumentar o desempenho</li>
                    <li>• Complete pelo menos {notaAtual.meta_questoes} questões no bimestre</li>
                    <li>• Estude em pelo menos {notaAtual.meta_dias} dias diferentes</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  )
}
