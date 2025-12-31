'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Upload,
  Download,
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
    // Criar conteúdo do modelo
    const conteudo =
      tipo === 'csv'
        ? 'nome,turma,componente\nMaria Silva,1A,fisica\nMaria Silva,1A,matematica\nJoão Pedro,7B,matematica'
        : '' // Para XLSX, seria necessário uma biblioteca adicional

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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/professor/dashboard')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-800 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Estudantes
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto p-4">
        {/* Download Modelo */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Baixar Modelo
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Baixe o modelo e preencha com os dados dos estudantes.
            Cada linha representa um estudante com um componente.
            Se o estudante tiver 2 componentes, adicione 2 linhas.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => downloadModelo('csv')}>
              <FileSpreadsheet className="w-5 h-5" />
              CSV
            </Button>
          </div>
        </Card>

        {/* Upload */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enviar Arquivo
          </h3>
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-colors duration-200
              ${arquivo ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
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
                <FileSpreadsheet className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium text-gray-800">{arquivo.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Clique para trocar o arquivo
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-600">
                  Arraste o arquivo aqui
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  ou clique para selecionar
                </p>
                <p className="text-xs text-gray-400 mt-2">
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
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {resultado.sucesso ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Importação Concluída
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Importação com Alertas
                </>
              )}
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{resultado.novos}</p>
                <p className="text-xs text-green-700">Novos</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{resultado.atualizados}</p>
                <p className="text-xs text-blue-700">Atualizados</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{resultado.erros}</p>
                <p className="text-xs text-red-700">Erros</p>
              </div>
            </div>

            {resultado.detalhes.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {resultado.detalhes.slice(0, 20).map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                      item.status === 'erro'
                        ? 'bg-red-50'
                        : item.status === 'novo'
                          ? 'bg-green-50'
                          : 'bg-blue-50'
                    }`}
                  >
                    {item.status === 'erro' ? (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${
                          item.status === 'novo' ? 'text-green-500' : 'text-blue-500'
                        }`}
                      />
                    )}
                    <span className="flex-1 truncate">{item.nome}</span>
                    <Badge variant="default" size="sm">
                      {item.turma}
                    </Badge>
                    {item.erro && (
                      <span className="text-xs text-red-600">{item.erro}</span>
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
