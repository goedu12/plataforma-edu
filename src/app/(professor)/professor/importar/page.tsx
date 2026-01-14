'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { ResultadoImportacao } from '@/types'

export default function ImportarProfessorPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArquivo(file)
      setResultado(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
      setArquivo(file)
      setResultado(null)
    }
  }

  const handleImportar = async () => {
    if (!arquivo) return

    setLoading(true)
    setResultado(null)

    try {
      const formData = new FormData()
      formData.append('arquivo', arquivo)

      const response = await fetch('/api/professor/importar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResultado(data)
    } catch (error) {
      console.error('Erro na importação:', error)
      setResultado({
        sucesso: false,
        total: 0,
        novos: 0,
        atualizados: 0,
        erros: 1,
        detalhes: [
          {
            nome: 'Erro',
            turma: '-',
            componente: '-',
            status: 'erro',
            erro: 'Erro ao processar arquivo',
          },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadModelo = (tipo: 'xlsx' | 'csv') => {
    // Colunas: nome, turma, componente, colegio (opcional)
    const conteudo =
      tipo === 'csv'
        ? 'nome,turma,componente,colegio\nMaria Silva,1A,fisica,Colégio Dom Bosco\nMaria Silva,1A,matematica,Colégio Dom Bosco\nJoão Pedro da Costa,2B,matematica,Escola Santa Maria'
        : ''

    if (tipo === 'csv') {
      const blob = new Blob([conteudo], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'modelo_importacao.csv'
      a.click()
      URL.revokeObjectURL(url)
    } else {
      alert('Para o modelo XLSX, use o modelo CSV como referência.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/professor/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-body">Voltar ao Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="icon-box-green w-12 h-12">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-title text-slate-800">Importar Estudantes</h1>
              <p className="text-caption text-slate-500">Adicione estudantes via planilha</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto p-4">
        {/* Download Modelo - Terminal Style */}
        <div className="terminal-box terminal-cyan mb-6">
          <div className="terminal-header">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
            <span className="title">modelo_importacao.sh</span>
          </div>
          <div className="terminal-body space-y-2">
            <p className="comment"># Instrucoes para importar estudantes</p>
            <p className="text-white">$ Colunas: nome, turma, componente, colegio (opcional)</p>
            <p className="text-white">$ Se o estudante tiver 2 componentes, adicione 2 linhas</p>
            <p className="comment"># Como funciona o acesso:</p>
            <p className="text-white">$ Email: primeironome.ultimonome@turma</p>
            <p className="text-white">$ Exemplo: joao.silva@1a</p>
            <p className="text-white">$ Senha padrao: @estudante</p>
            <div className="mt-4">
              <Button variant="secondary" onClick={() => downloadModelo('csv')}>
                <FileSpreadsheet className="w-5 h-5" />
                Baixar CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Upload */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-primary-500" />
            <h3 className="text-heading text-slate-800">Enviar Arquivo</h3>
          </div>
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-300
              ${arquivo
                ? 'border-primary-500/50 bg-primary-500/10'
                : 'border-border hover:border-border-hover hover:bg-white'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleArquivo}
              className="hidden"
            />
            {arquivo ? (
              <>
                <FileSpreadsheet className="w-12 h-12 text-primary-500 mx-auto mb-3" />
                <p className="font-medium text-slate-800">{arquivo.name}</p>
                <p className="text-caption text-slate-500 mt-1">
                  Clique para trocar o arquivo
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="font-medium text-slate-600">
                  Arraste o arquivo aqui
                </p>
                <p className="text-caption text-slate-500 mt-1">
                  ou clique para selecionar
                </p>
                <p className="text-caption text-slate-500 mt-2">
                  Formatos: .xlsx, .csv
                </p>
              </>
            )}
          </div>

          {arquivo && !resultado && (
            <Button
              onClick={handleImportar}
              loading={loading}
              className="w-full mt-4"
            >
              Importar Estudantes
            </Button>
          )}
        </Card>

        {/* Resultado */}
        {resultado && (
          <Card className="animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              {resultado.sucesso ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <h3 className="text-heading text-slate-800">Importação Concluída</h3>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <h3 className="text-heading text-slate-800">Importação com Alertas</h3>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                <p className="text-2xl font-bold text-primary-500">{resultado.novos}</p>
                <p className="text-caption text-primary-400">Novos</p>
              </div>
              <div className="p-3 bg-accent-500/10 border border-accent-500/20 rounded-xl">
                <p className="text-2xl font-bold text-accent-500">{resultado.atualizados}</p>
                <p className="text-caption text-accent-400">Atualizados</p>
              </div>
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl">
                <p className="text-2xl font-bold text-error">{resultado.erros}</p>
                <p className="text-caption text-error/80">Erros</p>
              </div>
            </div>

            {resultado.detalhes.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {resultado.detalhes.slice(0, 20).map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                      item.status === 'erro'
                        ? 'bg-error/10 border border-error/20'
                        : item.status === 'novo'
                          ? 'bg-primary-500/10 border border-primary-500/20'
                          : 'bg-accent-500/10 border border-accent-500/20'
                    }`}
                  >
                    {item.status === 'erro' ? (
                      <XCircle className="w-4 h-4 text-error flex-shrink-0" />
                    ) : (
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${
                          item.status === 'novo' ? 'text-primary-500' : 'text-accent-500'
                        }`}
                      />
                    )}
                    <span className="flex-1 truncate text-slate-800">{item.nome}</span>
                    <Badge variant="default" size="sm">
                      {item.turma}
                    </Badge>
                    {item.erro && (
                      <span className="text-caption text-error">{item.erro}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setArquivo(null)
                  setResultado(null)
                }}
                className="flex-1"
              >
                Nova Importação
              </Button>
              <Button onClick={() => router.push('/professor/alunos')} className="flex-1">
                Ver Alunos
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
