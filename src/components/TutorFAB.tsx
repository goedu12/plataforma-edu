'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Componente } from '@/types'

const TutorMiniChat = dynamic(() => import('./TutorMiniChat'), { ssr: false })

// Wrapper que detecta o componente a partir da URL e renderiza o TutorMiniChat
// Só aparece em páginas dentro de /fisica/* ou /matematica/*
// Não aparece na própria página do tutor (já tem chat completo)
export default function TutorFAB() {
  const pathname = usePathname()

  let componente: Componente | null = null
  if (pathname.startsWith('/fisica')) componente = 'fisica'
  else if (pathname.startsWith('/matematica')) componente = 'matematica'

  // Não mostrar na página do tutor (já tem chat completo)
  if (!componente || pathname.includes('/tutor')) return null

  return <TutorMiniChat componente={componente} />
}
