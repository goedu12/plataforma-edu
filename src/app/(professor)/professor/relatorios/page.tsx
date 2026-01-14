'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Users,
  BarChart3,
  Atom,
  Calculator,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import Badge from '@/components/ui/Badge'
import type { Componente } from '@/types'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

      // Verificar se há dados
      if (dados.length === 0) {
        alert('Nenhum dado para exportar.')
        return
      }

      // Criar workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dados)

      // Ajustar largura das colunas
      const colWidths = Object.keys(dados[0]).map(key => ({
        wch: Math.max(key.length, 15)
      }))
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
      XLSX.writeFile(wb, nomeArquivo)
    } catch {
      alert('Erro ao exportar relatório. Tente novamente.')
    } finally {
      setExportando(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTAR PDF - Relatório completo em uma única página
  // ═══════════════════════════════════════════════════════════════════════════
  const exportarPDF = async (tipo: 'geral' | 'fisica' | 'matematica') => {
    setExportando(true)

    try {
      // Filtrar estudantes conforme tipo
      let estudantesParaExportar = estudantesFiltrados
      let titulo = 'Relatório Geral'
      let corTema = '#10b981' // verde padrão

      if (tipo === 'fisica') {
        estudantesParaExportar = estudantesFiltrados.filter(e => e.componentes.includes('fisica'))
        titulo = 'Relatório de Física'
        corTema = '#22c55e'
      } else if (tipo === 'matematica') {
        estudantesParaExportar = estudantesFiltrados.filter(e => e.componentes.includes('matematica'))
        titulo = 'Relatório de Matemática'
        corTema = '#a855f7'
      }

      if (estudantesParaExportar.length === 0) {
        alert('Nenhum dado para exportar.')
        return
      }

      // Criar documento PDF (A4 landscape para caber mais colunas)
      const doc = new jsPDF({
        orientation: estudantesParaExportar.length > 20 ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10
      let yPos = margin

      // ─────────────────────────────────────────────────────────────
      // CABEÇALHO
      // ─────────────────────────────────────────────────────────────
      doc.setFillColor(corTema)
      doc.rect(0, 0, pageWidth, 25, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(titulo, margin, 12)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.text(`Gerado em: ${dataAtual}`, margin, 20)

      // Filtros aplicados
      const filtrosTexto = []
      if (filtroTurma) filtrosTexto.push(`Turma: ${filtroTurma}`)
      if (filtroComponente) filtrosTexto.push(`Componente: ${filtroComponente}`)
      if (filtrosTexto.length > 0) {
        doc.text(`Filtros: ${filtrosTexto.join(' | ')}`, pageWidth - margin - 60, 20)
      }

      yPos = 35

      // ─────────────────────────────────────────────────────────────
      // ESTATÍSTICAS RESUMIDAS
      // ─────────────────────────────────────────────────────────────
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Resumo Estatístico', margin, yPos)
      yPos += 8

      // Cards de estatísticas
      const cardWidth = (pageWidth - margin * 2 - 15) / 4
      const cardHeight = 20

      // Calcular estatísticas
      const totalAlunos = estudantesParaExportar.length
      const mediaFis = tipo !== 'matematica'
        ? Math.round(estudantesParaExportar.filter(e => e.componentes.includes('fisica')).reduce((acc, e) => acc + e.fis_pontos, 0) / Math.max(1, estudantesParaExportar.filter(e => e.componentes.includes('fisica')).length))
        : 0
      const mediaMat = tipo !== 'fisica'
        ? Math.round(estudantesParaExportar.filter(e => e.componentes.includes('matematica')).reduce((acc, e) => acc + e.mat_pontos, 0) / Math.max(1, estudantesParaExportar.filter(e => e.componentes.includes('matematica')).length))
        : 0
      const taxaFis = tipo !== 'matematica'
        ? calcularTaxaAcerto(
            estudantesParaExportar.filter(e => e.componentes.includes('fisica')).reduce((acc, e) => acc + e.fis_questoes_corretas, 0),
            estudantesParaExportar.filter(e => e.componentes.includes('fisica')).reduce((acc, e) => acc + e.fis_questoes_total, 0)
          )
        : 0
      const taxaMat = tipo !== 'fisica'
        ? calcularTaxaAcerto(
            estudantesParaExportar.filter(e => e.componentes.includes('matematica')).reduce((acc, e) => acc + e.mat_questoes_corretas, 0),
            estudantesParaExportar.filter(e => e.componentes.includes('matematica')).reduce((acc, e) => acc + e.mat_questoes_total, 0)
          )
        : 0

      const cards = [
        { label: 'Total de Alunos', value: totalAlunos.toString(), color: '#3b82f6' },
        { label: tipo === 'matematica' ? 'Média Matemática' : 'Média Física', value: tipo === 'matematica' ? `${mediaMat} pts` : `${mediaFis} pts`, color: tipo === 'matematica' ? '#a855f7' : '#22c55e' },
        { label: tipo === 'matematica' ? 'Taxa Acerto Mat' : 'Taxa Acerto Fís', value: tipo === 'matematica' ? `${taxaMat}%` : `${taxaFis}%`, color: tipo === 'matematica' ? '#a855f7' : '#22c55e' },
        { label: tipo === 'geral' ? 'Média Matemática' : 'Total Questões', value: tipo === 'geral' ? `${mediaMat} pts` : estudantesParaExportar.reduce((acc, e) => acc + (tipo === 'fisica' ? e.fis_questoes_total : e.mat_questoes_total), 0).toString(), color: tipo === 'geral' ? '#a855f7' : '#f59e0b' },
      ]

      cards.forEach((card, i) => {
        const x = margin + i * (cardWidth + 5)

        // Fundo do card
        doc.setFillColor(245, 245, 245)
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, 'F')

        // Borda colorida superior
        doc.setFillColor(card.color)
        doc.rect(x, yPos, cardWidth, 3, 'F')

        // Texto
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(card.value, x + cardWidth / 2, yPos + 11, { align: 'center' })

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(card.label, x + cardWidth / 2, yPos + 17, { align: 'center' })
      })

      yPos += cardHeight + 10

      // ─────────────────────────────────────────────────────────────
      // TABELA DE ALUNOS
      // ─────────────────────────────────────────────────────────────
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Detalhamento por Aluno', margin, yPos)
      yPos += 5

      // Preparar dados da tabela
      let colunas: string[] = []
      let linhas: (string | number)[][] = []

      if (tipo === 'geral') {
        colunas = ['Nome', 'Turma', 'Fís Pts', 'Fís %', 'Fís Seq', 'Mat Pts', 'Mat %', 'Mat Seq']
        linhas = estudantesParaExportar.map(e => [
          e.nome.length > 25 ? e.nome.substring(0, 25) + '...' : e.nome,
          e.turma,
          e.componentes.includes('fisica') ? e.fis_pontos : '-',
          e.componentes.includes('fisica') ? `${calcularTaxaAcerto(e.fis_questoes_corretas, e.fis_questoes_total)}%` : '-',
          e.componentes.includes('fisica') ? e.fis_sequencia_dias : '-',
          e.componentes.includes('matematica') ? e.mat_pontos : '-',
          e.componentes.includes('matematica') ? `${calcularTaxaAcerto(e.mat_questoes_corretas, e.mat_questoes_total)}%` : '-',
          e.componentes.includes('matematica') ? e.mat_sequencia_dias : '-',
        ])
      } else if (tipo === 'fisica') {
        colunas = ['Nome', 'Turma', 'Pontos', 'Questões', 'Acertos', 'Taxa (%)', 'Sequência']
        linhas = estudantesParaExportar.map(e => [
          e.nome.length > 30 ? e.nome.substring(0, 30) + '...' : e.nome,
          e.turma,
          e.fis_pontos,
          e.fis_questoes_total,
          e.fis_questoes_corretas,
          `${calcularTaxaAcerto(e.fis_questoes_corretas, e.fis_questoes_total)}%`,
          e.fis_sequencia_dias,
        ])
      } else {
        colunas = ['Nome', 'Turma', 'Pontos', 'Questões', 'Acertos', 'Taxa (%)', 'Sequência']
        linhas = estudantesParaExportar.map(e => [
          e.nome.length > 30 ? e.nome.substring(0, 30) + '...' : e.nome,
          e.turma,
          e.mat_pontos,
          e.mat_questoes_total,
          e.mat_questoes_corretas,
          `${calcularTaxaAcerto(e.mat_questoes_corretas, e.mat_questoes_total)}%`,
          e.mat_sequencia_dias,
        ])
      }

      // Gerar tabela com autoTable
      autoTable(doc, {
        startY: yPos,
        head: [colunas],
        body: linhas,
        theme: 'striped',
        headStyles: {
          fillColor: corTema,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        // Ajuste de escala para caber em uma página
        didDrawPage: (data) => {
          // Rodapé em cada página
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text(
            `Página ${data.pageNumber} de ${pageCount} | seu10 - Plataforma Educacional`,
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
          )
        },
      })

      // ─────────────────────────────────────────────────────────────
      // SALVAR PDF
      // ─────────────────────────────────────────────────────────────
      const nomeArquivo = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(nomeArquivo)

    } catch {
      alert('Erro ao gerar PDF. Tente novamente.')
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/professor/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-body">Voltar ao Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="icon-box-cyan w-12 h-12">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-title text-slate-800">Relatórios</h1>
              <p className="text-caption text-slate-500">Exporte dados e visualize estatísticas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto p-4 lg:p-6">
        {/* Filtros */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <h3 className="text-heading text-slate-800">Filtros</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption text-slate-600 mb-2">Turma</label>
              <select
                value={filtroTurma}
                onChange={e => setFiltroTurma(e.target.value)}
                className="select-koyeb"
              >
                <option value="">Todas as turmas</option>
                {turmas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-caption text-slate-600 mb-2">Componente</label>
              <select
                value={filtroComponente}
                onChange={e => setFiltroComponente(e.target.value as Componente | '')}
                className="select-koyeb"
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
          <div className="stat-card-2026 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="stat-value">{estatisticas.total}</p>
            <p className="stat-label">Estudantes</p>
          </div>
          <div className="stat-card-2026 stat-green text-center">
            <Atom className="w-8 h-8 mx-auto mb-2 text-fisica-500" />
            <p className="stat-value text-fisica-500">{estatisticas.fisica}</p>
            <p className="stat-label">em Física</p>
          </div>
          <div className="stat-card-2026 stat-lilas text-center">
            <Calculator className="w-8 h-8 mx-auto mb-2 text-matematica-500" />
            <p className="stat-value text-matematica-500">{estatisticas.matematica}</p>
            <p className="stat-label">em Matemática</p>
          </div>
          <div className="stat-card-2026 stat-cyan text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-accent-500" />
            <p className="stat-value text-accent-500">
              {Math.round((estatisticas.mediaFisica + estatisticas.mediaMatematica) / 2)}
            </p>
            <p className="stat-label">Média Pontos</p>
          </div>
        </div>

        {/* Opções de Exportação Excel */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="w-5 h-5 text-success" />
            <h3 className="text-heading text-slate-800">Exportar para Excel</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => exportarExcel('geral')}
              disabled={exportando || estudantesFiltrados.length === 0}
              className="export-btn"
            >
              <Download className="w-5 h-5 text-slate-500" />
              <div className="text-left">
                <p className="text-body font-medium text-slate-800">Relatório Geral</p>
                <p className="text-caption text-slate-500">Todos os dados de todos os alunos</p>
              </div>
            </button>

            <button
              onClick={() => exportarExcel('fisica')}
              disabled={exportando || estatisticas.fisica === 0}
              className="export-btn export-fisica"
            >
              <Atom className="w-5 h-5 text-fisica-500" />
              <div className="text-left">
                <p className="text-body font-medium text-fisica-500">Relatório Física</p>
                <p className="text-caption text-fisica-400">{estatisticas.fisica} alunos</p>
              </div>
            </button>

            <button
              onClick={() => exportarExcel('matematica')}
              disabled={exportando || estatisticas.matematica === 0}
              className="export-btn export-matematica"
            >
              <Calculator className="w-5 h-5 text-matematica-500" />
              <div className="text-left">
                <p className="text-body font-medium text-matematica-500">Relatório Matemática</p>
                <p className="text-caption text-matematica-400">{estatisticas.matematica} alunos</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Opções de Exportação PDF */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-error" />
            <h3 className="text-heading text-slate-800">Exportar para PDF</h3>
            <Badge variant="default" size="sm">Novo</Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => exportarPDF('geral')}
              disabled={exportando || estudantesFiltrados.length === 0}
              className="export-btn"
            >
              <FileText className="w-5 h-5 text-error" />
              <div className="text-left">
                <p className="text-body font-medium text-slate-800">PDF Geral</p>
                <p className="text-caption text-slate-500">Relatório completo formatado</p>
              </div>
            </button>

            <button
              onClick={() => exportarPDF('fisica')}
              disabled={exportando || estatisticas.fisica === 0}
              className="export-btn export-fisica"
            >
              <FileText className="w-5 h-5 text-fisica-500" />
              <div className="text-left">
                <p className="text-body font-medium text-fisica-500">PDF Física</p>
                <p className="text-caption text-fisica-400">{estatisticas.fisica} alunos</p>
              </div>
            </button>

            <button
              onClick={() => exportarPDF('matematica')}
              disabled={exportando || estatisticas.matematica === 0}
              className="export-btn export-matematica"
            >
              <FileText className="w-5 h-5 text-matematica-500" />
              <div className="text-left">
                <p className="text-body font-medium text-matematica-500">PDF Matemática</p>
                <p className="text-caption text-matematica-400">{estatisticas.matematica} alunos</p>
              </div>
            </button>
          </div>
          {exportando && (
            <p className="text-center text-caption text-slate-500 mt-4">
              Gerando relatório...
            </p>
          )}
        </Card>

        {/* Preview dos Dados */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              <h3 className="text-heading text-slate-800">Prévia dos Dados</h3>
            </div>
            <Badge>{estudantesFiltrados.length} registros</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="table-koyeb">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Turma</th>
                  <th className="text-center">Componentes</th>
                  <th className="text-right">Fís. Pts</th>
                  <th className="text-right">Fís. %</th>
                  <th className="text-right">Mat. Pts</th>
                  <th className="text-right">Mat. %</th>
                </tr>
              </thead>
              <tbody>
                {estudantesFiltrados.slice(0, 10).map(e => (
                  <tr key={e.id}>
                    <td>{e.nome}</td>
                    <td>
                      <Badge variant="default" size="sm">{e.turma}</Badge>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        {e.componentes.includes('fisica') && (
                          <Badge variant="fisica" size="sm">Fís</Badge>
                        )}
                        {e.componentes.includes('matematica') && (
                          <Badge variant="matematica" size="sm">Mat</Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-right text-fisica-500">
                      {e.componentes.includes('fisica') ? e.fis_pontos : '-'}
                    </td>
                    <td className="text-right text-fisica-500">
                      {e.componentes.includes('fisica') ? `${calcularTaxaAcerto(e.fis_questoes_corretas, e.fis_questoes_total)}%` : '-'}
                    </td>
                    <td className="text-right text-matematica-500">
                      {e.componentes.includes('matematica') ? e.mat_pontos : '-'}
                    </td>
                    <td className="text-right text-matematica-500">
                      {e.componentes.includes('matematica') ? `${calcularTaxaAcerto(e.mat_questoes_corretas, e.mat_questoes_total)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {estudantesFiltrados.length > 10 && (
              <p className="text-center text-caption text-slate-500 mt-4">
                Mostrando 10 de {estudantesFiltrados.length} registros. Exporte o Excel para ver todos.
              </p>
            )}
            {estudantesFiltrados.length === 0 && (
              <p className="text-center text-slate-500 py-8">
                Nenhum estudante encontrado com os filtros selecionados.
              </p>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
