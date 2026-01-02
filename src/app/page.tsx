'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Atom, Calculator } from 'lucide-react'
import Loading from '@/components/ui/Loading'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Verificar se está autenticado
    const verificarAuth = async () => {
      try {
        const response = await fetch('/api/usuario')
        const data = await response.json()

        if (data.sucesso && data.usuario) {
          // Redirecionar baseado no tipo
          if (data.usuario.tipo === 'professor') {
            router.push('/professor/dashboard')
          } else if (Array.isArray(data.usuario.componentes) && data.usuario.componentes.length === 1) {
            router.push(`/${data.usuario.componentes[0]}/menu`)
          } else if (Array.isArray(data.usuario.componentes) && data.usuario.componentes.length > 1) {
            router.push('/selecionar')
          } else {
            // Sem componentes ou componentes inválido - vai para seleção
            router.push('/selecionar')
          }
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      }
    }

    verificarAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-fisica-500 flex items-center justify-center">
            <Atom className="w-10 h-10 text-white" />
          </div>
          <BookOpen className="w-10 h-10 text-gray-400" />
          <div className="w-16 h-16 rounded-2xl bg-matematica-500 flex items-center justify-center">
            <Calculator className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Plataforma EDU</h1>
        <p className="text-gray-500 mb-6">Colégio Cora Coralina</p>
        <Loading text="Carregando..." />
      </div>
    </div>
  )
}
