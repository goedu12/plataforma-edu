'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Filter,
  Users,
  BarChart3,
  Atom,
  Calculator,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import Badge from '@/components/ui/Badge'
import type { Componente } from '@/types'
import * as XLSX from 'xlsx'

interface Estudante {
  id: string
  nome: string
  email: string
  turma: string
  componentes: Componente[]
  fis_pontos: number
  fis_questoes_total: number
  fis_questoes_corretas: number
  fis_sequencia_dias: number
  fis_ultimo_estudo?: string
  mat_pontos: number
  mat_questoes_total: number
  mat_questoes_corretas: number
  mat_sequencia_dias: number
  mat_ultimo_estudo?: string
}

export default function RelatoriosProfessorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [estudantes, setEstudantes] = useState<Estudante[]>([])
  const [turmas, setTurmas] = useState<string[]>([])
  const [filtroTurma, setFiltroTurma] = useState('')
  const [filtroComponente, setFiltroComponente] = useState<Componente | ''>('')

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const response = await fetch('/api/professor/alunos')
        const data = await response.json()

        if (data.sucesso) {
          setEstudantes(data.alunos || [])
          setTurmas(data.turmas || [])
        } else if (response.status === 403) {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    buscarDados()
  }, [router])

  const estudantesFiltrados = estudantes.filter(e => {
    if (filtroTurma && e.turma !== filtroTurma) return false
    if (filtroComponente && !e.componentes.includes(filtroComponente)) return false
    return true
  })

  const calcularTaxaAcerto = (corretas: number, total: number) => {
    if (total === 0) return 0
    return Math.round((corretas / total) * 100)
  }

  const exportarExcel = async (tipo: 'geral' | 'fisica' | 'matematica') => {
    setExportando(true)

    try {
      let dados: Record<string, unknown>[] = []
      let nomeArquivo = ''

      if (tipo === 'geral') {
        nomeArquivo = `relatorio_geral_${new Date().toISOString().split('T')[0]}.xlsx`
        dados = estudantesFiltrados.map(e => ({
          'Nome': e.nome,
          'Email': e.email,
          'Turma': e.turma,
          'Componentes': e.componentes.join(', '),
          'Física - Pontos': e.componentes.includes('fisica') ? e.fis_pontos : '-',
          'Física - Questões': e.componentes.includes('fisica') ? e.fis_questoes_total : '-',
          'Física - Acertos': e.componentes.includes('fisica') ? e.fis_questoes_corretas : '-',
          'Física - Taxa (%)': e.componentes.includes('fisica') ? calcularTaxaAcerto(e.fis_questoes_corretas, e.fis_questoes_total) : '-',
          'Física - Sequência (dias)': e.componentes.includes('fisica') ? e.fis_sequencia_dias : '-',
          'Física - Último Estudo': e.componentes.includes('fisica') && e.fis_ultimo_estudo ? new Date(e.fis_ultimo_estudo).toLocaleDateString('pt-BR') : '-',
          'Matemática - Pontos': e.componentes.includes('matematica') ? e.mat_pontos : '-',
          'Matemática - Questões': e.componentes.includes('matematica') ? e.mat_questoes_total : '-',
          'Matemática - Acertos': e.componentes.includes('matematica') ? e.mat_questoes_corretas : '-',
          'Matemática - Taxa (%)': e.componentes.includes('matematica') ? calcularTaxaAcerto(e.mat_questoes_corretas, e.mat_questoes_total) : '-',
          'Matemática - Sequência (dias)': e.componentes.includes('matematica') ? e.mat_sequencia_dias : '-',
          'Matemática - Último Estudo': e.componentes.includes('matematica') && e.mat_ultimo_estudo ? new Date(e.mat_ultimo_estudo).toLocaleDateString('pt-BR') : '-',
        }))
      } else if (tipo === 'fisica') {
        nomeArquivo = `relatorio_fisica_${new Date().toISOString().split('T')[0]}.xlsx`
        dados = estudantesFiltrados
          .filter(e => e.componentes.includes('fisica'))
          .map(e => ({
            'Nome': e.nome,
            'Email': e.email,
            'Turma': e.turma,
            'Pontos': e.fis_pontos,
            'Questões Respondidas': e.fis_questoes_total,
            'Questões Corretas': e.fis_questoes_corretas,
            'Taxa de Acerto (%)': calcularTaxaAcerto(e.fis_questoes_corretas, e.fis_questoes_total),
            'Sequência (dias)': e.fis_sequencia_dias,
            'Último Estudo': e.fis_ultimo_estudo ? new Date(e.fis_ultimo_estudo).toLocaleDateString('pt-BR') : 'Nunca',
          }))
      } else {
        nomeArquivo = `relatorio_matematica_${new Date().toISOString().split('T')[0]}.xlsx`
        dados = estudantesFiltrados
          .filter(e => e.componentes.includes('matematica'))
          .map(e => ({
            'Nome': e.nome,
            'Email': e.email,
            'Turma': e.turma,
            'Pontos': e.mat_pontos,
            'Questões Respondidas': e.mat_questoes_total,
            'Questões Corretas': e.mat_questoes_corretas,
            'Taxa de Acerto (%)': calcularTaxaAcerto(e.mat_questoes_corretas, e.mat_questoes_total),
            'Sequência (dias)': e.mat_sequencia_dias,
            'Último Estudo': e.mat_ultimo_estudo ? new Date(e.mat_ultimo_estudo).toLocaleDateString('pt-BR') : 'Nunca',
          }))
      }

      // Criar workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dados)

      // Ajustar largura das colunas
      const colWidths = Object.keys(dados[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }))
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
      XLSX.writeFile(wb, nomeArquivo)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('Erro ao exportar relatório. Tente novamente.')
    } finally {
      setExportando(false)
    }
  }

  // Estatísticas rápidas
  const estatisticas = {
    total: estudantesFiltrados.length,
    fisica: estudantesFiltrados.filter(e => e.componentes.includes('fisica')).length,
    matematica: estudantesFiltrados.filter(e => e.componentes.includes('matematica')).length,
    mediaFisica: estudantesFiltrados.filter(e => e.componentes.includes('fisica')).length > 0
      ? Math.round(estudantesFiltrados.filter(e => e.componentes.includes('fisica')).reduce((acc, e) => acc + e.fis_pontos, 0) / estudantesFiltrados.filter(e => e.componentes.includes('fisica')).length)
      : 0,
    mediaMatematica: estudantesFiltrados.filter(e => e.componentes.includes('matematica')).length > 0
      ? Math.round(estudantesFiltrados.filter(e => e.componentes.includes('matematica')).reduce((acc, e) => acc + e.mat_pontos, 0) / estudantesFiltrados.filter(e => e.componentes.includes('matematica')).length)
      : 0,
  }

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/professor/dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Relatórios</h1>
              <p className="text-gray-300 text-sm">Exporte dados e visualize estatísticas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto p-4 lg:p-6">
        {/* Filtros */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-800">Filtros</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Turma</label>
              <select
                value={filtroTurma}
                onChange={e => setFiltroTurma(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">Todas as turmas</option>
                {turmas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Componente</label>
              <select
                value={filtroComponente}
                onChange={e => setFiltroComponente(e.target.value as Componente | '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">Todos os componentes</option>
                <option value="fisica">Física</option>
                <option value="matematica">Matemática</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <p className="text-2xl font-bold text-gray-800">{estatisticas.total}</p>
            <p className="text-sm text-gray-500">Estudantes</p>
          </Card>
          <Card className="text-center">
            <Atom className="w-8 h-8 mx-auto mb-2 text-fisica-500" />
            <p className="text-2xl font-bold text-fisica-600">{estatisticas.fisica}</p>
            <p className="text-sm text-gray-500">em Física</p>
          </Card>
          <Card className="text-center">
            <Calculator className="w-8 h-8 mx-auto mb-2 text-matematica-500" />
            <p className="text-2xl font-bold text-matematica-600">{estatisticas.matematica}</p>
            <p className="text-sm text-gray-500">em Matemática</p>
          </Card>
          <Card className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-green-600">
              {Math.round((estatisticas.mediaFisica + estatisticas.mediaMatematica) / 2)}
            </p>
            <p className="text-sm text-gray-500">Média Pontos</p>
          </Card>
        </div>

        {/* Opções de Exportação */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">Exportar para Excel</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => exportarExcel('geral')}
              disabled={exportando || estudantesFiltrados.length === 0}
              className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <p className="font-medium text-gray-800">Relatório Geral</p>
                <p className="text-xs text-gray-500">Todos os dados de todos os alunos</p>
              </div>
            </button>

            <button
              onClick={() => exportarExcel('fisica')}
              disabled={exportando || estatisticas.fisica === 0}
              className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-fisica-300 rounded-xl hover:border-fisica-400 hover:bg-fisica-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Atom className="w-5 h-5 text-fisica-500" />
              <div className="text-left">
                <p className="font-medium text-fisica-700">Relatório Física</p>
                <p className="text-xs text-fisica-500">{estatisticas.fisica} alunos</p>
              </div>
            </button>

            <button
              onClick={() => exportarExcel('matematica')}
              disabled={exportando || estatisticas.matematica === 0}
              className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-matematica-300 rounded-xl hover:border-matematica-400 hover:bg-matematica-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator className="w-5 h-5 text-matematica-500" />
              <div className="text-left">
                <p className="font-medium text-matematica-700">Relatório Matemática</p>
                <p className="text-xs text-matematica-500">{estatisticas.matematica} alunos</p>
              </div>
            </button>
          </div>
          {exportando && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Gerando relatório...
            </p>
          )}
        </Card>

        {/* Preview dos Dados */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Prévia dos Dados</h3>
            </div>
            <Badge>{estudantesFiltrados.length} registros</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Nome</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Turma</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-600">Componentes</th>
                  <th className="text-right py-3 px-2 font-medium text-fisica-600">Fís. Pts</th>
                  <th className="text-right py-3 px-2 font-medium text-fisica-600">Fís. %</th>
                  <th className="text-right py-3 px-2 font-medium text-matematica-600">Mat. Pts</th>
                  <th className="text-right py-3 px-2 font-medium text-matematica-600">Mat. %</th>
                </tr>
              </thead>
              <tbody>
                {estudantesFiltrados.slice(0, 10).map(e => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">{e.nome}</td>
                    <td className="py-3 px-2">
                      <Badge variant="default" size="sm">{e.turma}</Badge>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex justify-center gap-1">
                        {e.componentes.includes('fisica') && (
                          <Badge variant="fisica" size="sm">Fís</Badge>
                        )}
                        {e.componentes.includes('matematica') && (
                          <Badge variant="matematica" size="sm">Mat</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-fisica-600">
                      {e.componentes.includes('fisica') ? e.fis_pontos : '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-fisica-600">
                      {e.componentes.includes('fisica') ? `${calcularTaxaAcerto(e.fis_questoes_corretas, e.fis_questoes_total)}%` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-matematica-600">
                      {e.componentes.includes('matematica') ? e.mat_pontos : '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-matematica-600">
                      {e.componentes.includes('matematica') ? `${calcularTaxaAcerto(e.mat_questoes_corretas, e.mat_questoes_total)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {estudantesFiltrados.length > 10 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Mostrando 10 de {estudantesFiltrados.length} registros. Exporte o Excel para ver todos.
              </p>
            )}
            {estudantesFiltrados.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Nenhum estudante encontrado com os filtros selecionados.
              </p>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
