'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  GraduationCap,
  RefreshCw,
  WifiOff,
  TrendingUp,
  Calendar,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Trophy,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA DE NOTAS 2025
// Baseado em PARTICIPAÇÃO + BÔNUS DE FREQUÊNCIA
// ═══════════════════════════════════════════════════════════════════════════

interface NotaBimestre {
  bimestre: number
  ano: number
  // Período
  tipo_periodo: 'regular' | 'recuperacao'
  data_inicio: string
  data_fim: string
  dias_restantes: number
  // Dados do regular
  questoes_respondidas: number
  meta_questoes: number
  percentual_questoes: number
  dias_ativos: number
  nota_base: number
  bonus_frequencia: number
  nota_regular: number
  // Recuperação
  em_recuperacao: boolean
  questoes_pendentes: number
  questoes_recuperacao: number
  nota_recuperacao: number | null
  // Final
  nota_final: number
  status: 'em_andamento' | 'recuperacao' | 'aprovado' | 'reprovado'
  // Semanal
  questoes_semana: number
  limite_semanal: number | null
  pode_responder: boolean
}

interface TabelaBonus {
  dias: string
  bonus: number
}

export default function NotasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [notaAtual, setNotaAtual] = useState<NotaBimestre | null>(null)
  const [tabelaBonus, setTabelaBonus] = useState<TabelaBonus[]>([])
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
        setTabelaBonus(data.tabela_bonus || [])
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
  const textColor = isFisica ? 'text-fisica-500' : 'text-matematica-500'

  const getNotaColor = (nota: number) => {
    if (nota >= 7) return 'text-emerald-400'
    if (nota >= 6) return 'text-green-400'
    if (nota >= 5) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      case 'reprovado':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      case 'recuperacao':
        return <RefreshCw className="w-5 h-5 text-amber-400" />
      default:
        return <Clock className="w-5 h-5 text-blue-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'Aprovado'
      case 'reprovado':
        return 'Reprovado'
      case 'recuperacao':
        return 'Em Recuperação'
      default:
        return 'Em Andamento'
    }
  }

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-8">
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
                Boletim 2025
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
                {notaAtual.bimestre}º Bimestre {notaAtual.em_recuperacao ? '(Recuperação)' : ''}
              </p>
              <p className={`text-5xl font-bold ${notaAtual.em_recuperacao ? 'text-amber-300' : ''}`}>
                {notaAtual.nota_final.toFixed(1)}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {getStatusIcon(notaAtual.status)}
                <span className="text-sm text-white/90">{getStatusLabel(notaAtual.status)}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 -mt-8 space-y-4">
        {erro ? (
          <Card className="text-center py-10">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-500/20 border border-red-500/30">
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Erro</h2>
            <p className="text-text-secondary mb-6">{erro}</p>
            <Button variant="primary" onClick={buscarNotas}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </Card>
        ) : notaAtual ? (
          <>
            {/* Progresso do Bimestre */}
            <Card className="animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Progresso</h3>
                  <p className="text-xs text-text-muted">
                    {new Date(notaAtual.data_inicio).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(notaAtual.data_fim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {notaAtual.dias_restantes > 0 && (
                  <span className="ml-auto text-sm text-amber-400 font-medium">
                    {notaAtual.dias_restantes} dias restantes
                  </span>
                )}
              </div>

              {/* Barra de Progresso */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Questões respondidas</span>
                  <span className="font-bold text-text-primary">
                    {notaAtual.questoes_respondidas}/{notaAtual.meta_questoes}
                  </span>
                </div>
                <div className="h-3 bg-dark-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${bgColor}`}
                    style={{ width: `${Math.min(notaAtual.percentual_questoes, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1 text-right">
                  {notaAtual.percentual_questoes}% concluído
                </p>
              </div>

              {/* Controle Semanal */}
              <div className="rounded-xl p-3 bg-dark-elevated border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">Esta semana</span>
                  </div>
                  <span className={`text-sm font-bold ${notaAtual.pode_responder ? 'text-emerald-400' : 'text-red-400'}`}>
                    {notaAtual.questoes_semana}/{notaAtual.limite_semanal || '∞'}
                  </span>
                </div>
                {!notaAtual.pode_responder && notaAtual.limite_semanal && (
                  <p className="text-xs text-amber-400 mt-2">
                    ⚠️ Limite semanal atingido. Volte na segunda-feira!
                  </p>
                )}
                {notaAtual.em_recuperacao && (
                  <p className="text-xs text-emerald-400 mt-2">
                    ⚡ Recuperação: sem limite de questões!
                  </p>
                )}
              </div>
            </Card>

            {/* Composição da Nota */}
            <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-text-primary">Composição da Nota</h3>
              </div>

              <div className="space-y-4">
                {/* Nota Base */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-dark-elevated">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Nota Base</p>
                    <p className="text-xs text-text-muted">
                      ({notaAtual.questoes_respondidas}/{notaAtual.meta_questoes}) × 10
                    </p>
                  </div>
                  <span className={`text-2xl font-bold ${getNotaColor(notaAtual.nota_base)}`}>
                    {notaAtual.nota_base.toFixed(2)}
                  </span>
                </div>

                {/* Bônus de Frequência */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-dark-elevated">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Bônus Frequência</p>
                    <p className="text-xs text-text-muted">
                      {notaAtual.dias_ativos} dias ativos
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-emerald-400">
                    +{notaAtual.bonus_frequencia.toFixed(1)}
                  </span>
                </div>

                {/* Separador */}
                <div className="border-t border-border" />

                {/* Nota Final */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-dark-surface border border-border">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {notaAtual.em_recuperacao ? 'Nota Recuperação' : 'Nota Regular'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {notaAtual.em_recuperacao
                        ? `${notaAtual.questoes_recuperacao}/${notaAtual.questoes_pendentes} pendentes (máx 6.0)`
                        : 'base + bônus (máx 10.0)'}
                    </p>
                  </div>
                  <span className={`text-3xl font-bold ${getNotaColor(notaAtual.nota_final)}`}>
                    {notaAtual.nota_final.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Tabela de Bônus - Estilo Terminal */}
            <div className="animate-slide-up rounded-2xl overflow-hidden border border-emerald-500/30" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-emerald-500/20">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                <span className="ml-2 text-xs text-gray-400 font-mono">bonus_frequencia.sh</span>
              </div>
              <div className="p-4 bg-[#0d0d0d] font-mono text-sm">
                <p className="text-emerald-400 mb-3"># Tabela de Bônus por Dias Ativos</p>
                <div className="space-y-1">
                  {tabelaBonus.map((item, i) => (
                    <p
                      key={i}
                      className={`${notaAtual.dias_ativos >= parseInt(item.dias.split('-')[0]) &&
                        (item.dias.includes('+') || notaAtual.dias_ativos <= parseInt(item.dias.split('-')[1]))
                        ? 'text-emerald-300'
                        : 'text-gray-500'}`}
                    >
                      $ {item.dias.padEnd(6)} dias → +{item.bonus.toFixed(1)} pontos
                      {notaAtual.bonus_frequencia === item.bonus && ' ← você está aqui'}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Recuperação Info */}
            {notaAtual.em_recuperacao && (
              <div className="animate-slide-up rounded-2xl overflow-hidden border border-amber-500/30" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-amber-500/20">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 text-xs text-gray-400 font-mono">recuperacao.sh</span>
                </div>
                <div className="p-4 bg-[#0d0d0d] font-mono text-sm">
                  <p className="text-amber-400 mb-2"># Período de Recuperação</p>
                  <p className="text-gray-300">$ Questões pendentes: {notaAtual.questoes_pendentes}</p>
                  <p className="text-gray-300">$ Respondidas na recuperação: {notaAtual.questoes_recuperacao}</p>
                  <p className="text-gray-300">$ Nota máxima possível: 6.0</p>
                  <p className="text-emerald-300 mt-2">$ SEM LIMITE - Faça todas as questões!</p>
                </div>
              </div>
            )}

            {/* Dicas */}
            {!notaAtual.em_recuperacao && notaAtual.nota_final < 10 && (
              <div className="animate-slide-up rounded-2xl overflow-hidden border border-emerald-500/30" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-emerald-500/20">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 text-xs text-gray-400 font-mono">dicas.sh</span>
                </div>
                <div className="p-4 bg-[#0d0d0d] font-mono text-sm">
                  <p className="text-emerald-400 mb-2"># Como melhorar sua nota?</p>
                  {notaAtual.questoes_respondidas < notaAtual.meta_questoes && (
                    <p className="text-gray-300">
                      $ Responda mais {notaAtual.meta_questoes - notaAtual.questoes_respondidas} questões para atingir a meta
                    </p>
                  )}
                  {notaAtual.bonus_frequencia < 2.0 && (
                    <p className="text-gray-300">
                      $ Estude em mais dias para aumentar o bônus (atual: +{notaAtual.bonus_frequencia.toFixed(1)}, máx: +2.0)
                    </p>
                  )}
                  <p className="text-gray-300">$ Máximo de 15 questões por semana no período regular</p>
                </div>
              </div>
            )}

            {/* Nota 10 */}
            {notaAtual.nota_final >= 10 && (
              <Card className="animate-slide-up text-center py-6" style={{ animationDelay: '300ms' }}>
                <Trophy className="w-16 h-16 mx-auto mb-4 text-amber-400" />
                <h3 className="text-xl font-bold text-emerald-400 mb-2">Parabéns! Nota Máxima!</h3>
                <p className="text-text-secondary">
                  Você atingiu a nota máxima neste bimestre. Continue assim!
                </p>
              </Card>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}
