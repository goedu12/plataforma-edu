import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulado ENEM — seu10.com',
  description: 'Pratique com questões reais do ENEM 2024 e 2025',
}

export default function ENEMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
