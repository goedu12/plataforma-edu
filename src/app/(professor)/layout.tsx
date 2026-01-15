'use client'

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="professor-theme">
      {children}
    </div>
  )
}
