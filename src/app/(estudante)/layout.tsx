import MonitorIndicator from '@/components/MonitorIndicator'
import TutorFAB from '@/components/TutorFAB'

export default function EstudanteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <MonitorIndicator />
      <TutorFAB />
    </>
  )
}
