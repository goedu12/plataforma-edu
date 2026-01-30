import MonitorIndicator from '@/components/MonitorIndicator'

export default function EstudanteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <MonitorIndicator />
    </>
  )
}
