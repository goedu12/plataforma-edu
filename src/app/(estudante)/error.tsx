'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function EstudanteError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log do erro para monitoramento (sem expor detalhes ao usuário)
    console.error('Erro na área do estudante:', error.digest || error.message)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="card-standard max-w-md w-full text-center py-8 px-6">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'var(--error-bg-10)' }}
        >
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h1
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Algo deu errado
        </h1>

        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          Desculpe, ocorreu um erro inesperado. Por favor, tente novamente.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="fisica"
            onClick={reset}
            leftIcon={<RefreshCw className="w-5 h-5" />}
            className="w-full"
          >
            Tentar Novamente
          </Button>

          <Button
            variant="secondary"
            onClick={() => window.location.href = '/selecionar'}
            leftIcon={<Home className="w-5 h-5" />}
            className="w-full"
          >
            Voltar ao Início
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <details className="mt-6 text-left">
            <summary
              className="text-xs cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre
              className="mt-2 p-3 rounded-lg text-xs overflow-auto"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
