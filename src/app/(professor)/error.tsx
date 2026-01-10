'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProfessorError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log do erro para monitoramento (sem expor detalhes ao usuário)
    console.error('Erro na área do professor:', error.digest || error.message)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-bg">
      <div className="bg-dark-surface border border-border rounded-2xl max-w-md w-full text-center py-8 px-6">
        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-500/10">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-xl font-bold mb-2 text-text-primary">
          Algo deu errado
        </h1>

        <p className="text-sm mb-6 text-text-secondary">
          Desculpe, ocorreu um erro inesperado. Por favor, tente novamente.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={reset}
            leftIcon={<RefreshCw className="w-5 h-5" />}
            fullWidth
          >
            Tentar Novamente
          </Button>

          <Button
            variant="secondary"
            onClick={() => window.location.href = '/professor/dashboard'}
            leftIcon={<Home className="w-5 h-5" />}
            fullWidth
          >
            Voltar ao Dashboard
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <details className="mt-6 text-left">
            <summary className="text-xs cursor-pointer text-text-muted">
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre className="mt-2 p-3 rounded-lg text-xs overflow-auto bg-dark-elevated text-text-secondary">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
