'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  X,
  Lightbulb,
  Calculator,
  BookOpen,
  Eye,
  ListOrdered,
  MessageSquare,
  Gauge,
  Check,
  Save
} from 'lucide-react'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════

interface Preferencias {
  prefere_analogias: boolean
  prefere_formulas: boolean
  prefere_exemplos: boolean
  prefere_visual: boolean
  prefere_passo_a_passo: boolean
  nivel_detalhe: 'minimo' | 'medio' | 'maximo'
  tom_conversa: 'formal' | 'amigavel' | 'descontraido'
  velocidade: 'lento' | 'normal' | 'rapido'
  usar_exemplos_brasileiros: boolean
}

interface TutorPreferenciasProps {
  componente: Componente
  isOpen: boolean
  onClose: () => void
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════

export default function TutorPreferencias({ componente, isOpen, onClose }: TutorPreferenciasProps) {
  const [preferencias, setPreferencias] = useState<Preferencias | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Carregar preferências
  useEffect(() => {
    if (isOpen) {
      carregarPreferencias()
    }
  }, [isOpen])

  const PREFERENCIAS_PADRAO: Preferencias = {
    prefere_analogias: true,
    prefere_formulas: true,
    prefere_exemplos: true,
    prefere_visual: true,
    prefere_passo_a_passo: true,
    nivel_detalhe: 'medio',
    tom_conversa: 'amigavel',
    velocidade: 'normal',
    usar_exemplos_brasileiros: true,
  }

  const carregarPreferencias = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tutor/preferencias')
      const data = await res.json()
      if (data.sucesso && data.preferencias) {
        setPreferencias(data.preferencias)
      } else {
        setPreferencias(PREFERENCIAS_PADRAO)
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error)
      setPreferencias(PREFERENCIAS_PADRAO)
    } finally {
      setLoading(false)
    }
  }

  const salvarPreferencias = async () => {
    if (!preferencias) return

    setSalvando(true)
    setSalvo(false)
    try {
      const res = await fetch('/api/tutor/preferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferencias),
      })
      const data = await res.json()
      if (data.sucesso) {
        setSalvo(true)
        setTimeout(() => {
          onClose()
        }, 1000)
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error)
    } finally {
      setSalvando(false)
    }
  }

  const togglePreferencia = (campo: keyof Preferencias) => {
    if (!preferencias) return
    setPreferencias(prev => prev ? {
      ...prev,
      [campo]: !prev[campo as keyof typeof prev]
    } : null)
  }

  const setValor = (campo: keyof Preferencias, valor: string) => {
    if (!preferencias) return
    setPreferencias(prev => prev ? { ...prev, [campo]: valor } : null)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'var(--overlay-modal)', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)' }}
            >
              <Settings className="w-5 h-5" style={{ color: corPrimaria }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Preferências de Estudo
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Personalize como o tutor explica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner" style={{ borderTopColor: corPrimaria }} />
            </div>
          ) : preferencias ? (
            <>
              {/* Estilo de Explicação */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Estilo de Explicação
                </h4>

                <PreferenciaToggle
                  icon={<Lightbulb className="w-4 h-4" />}
                  label="Usar analogias"
                  sublabel="Comparações com o dia a dia"
                  ativo={preferencias.prefere_analogias}
                  onToggle={() => togglePreferencia('prefere_analogias')}
                  cor={corPrimaria}
                />

                <PreferenciaToggle
                  icon={<Calculator className="w-4 h-4" />}
                  label="Mostrar fórmulas"
                  sublabel="Fórmulas matemáticas nas explicações"
                  ativo={preferencias.prefere_formulas}
                  onToggle={() => togglePreferencia('prefere_formulas')}
                  cor={corPrimaria}
                />

                <PreferenciaToggle
                  icon={<BookOpen className="w-4 h-4" />}
                  label="Dar exemplos"
                  sublabel="Exemplos práticos ao explicar"
                  ativo={preferencias.prefere_exemplos}
                  onToggle={() => togglePreferencia('prefere_exemplos')}
                  cor={corPrimaria}
                />

                <PreferenciaToggle
                  icon={<ListOrdered className="w-4 h-4" />}
                  label="Passo a passo"
                  sublabel="Resoluções detalhadas"
                  ativo={preferencias.prefere_passo_a_passo}
                  onToggle={() => togglePreferencia('prefere_passo_a_passo')}
                  cor={corPrimaria}
                />
              </div>

              {/* Nível de Detalhe */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Nível de Detalhe
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {['minimo', 'medio', 'maximo'].map(nivel => (
                    <button
                      key={nivel}
                      onClick={() => setValor('nivel_detalhe', nivel)}
                      className="p-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: preferencias.nivel_detalhe === nivel
                          ? isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)'
                          : 'var(--bg-elevated)',
                        border: preferencias.nivel_detalhe === nivel
                          ? `2px solid ${corPrimaria}`
                          : '1px solid var(--border-default)',
                        color: preferencias.nivel_detalhe === nivel
                          ? corPrimaria
                          : 'var(--text-secondary)',
                      }}
                    >
                      {nivel === 'minimo' ? 'Direto' : nivel === 'medio' ? 'Balanceado' : 'Detalhado'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tom da Conversa */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Tom da Conversa
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {['formal', 'amigavel', 'descontraido'].map(tom => (
                    <button
                      key={tom}
                      onClick={() => setValor('tom_conversa', tom)}
                      className="p-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: preferencias.tom_conversa === tom
                          ? isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)'
                          : 'var(--bg-elevated)',
                        border: preferencias.tom_conversa === tom
                          ? `2px solid ${corPrimaria}`
                          : '1px solid var(--border-default)',
                        color: preferencias.tom_conversa === tom
                          ? corPrimaria
                          : 'var(--text-secondary)',
                      }}
                    >
                      {tom === 'formal' ? 'Formal' : tom === 'amigavel' ? 'Amigável' : 'Descontraído'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Velocidade */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Ritmo das Explicações
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {['lento', 'normal', 'rapido'].map(vel => (
                    <button
                      key={vel}
                      onClick={() => setValor('velocidade', vel)}
                      className="p-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: preferencias.velocidade === vel
                          ? isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)'
                          : 'var(--bg-elevated)',
                        border: preferencias.velocidade === vel
                          ? `2px solid ${corPrimaria}`
                          : '1px solid var(--border-default)',
                        color: preferencias.velocidade === vel
                          ? corPrimaria
                          : 'var(--text-secondary)',
                      }}
                    >
                      {vel === 'lento' ? 'Devagar' : vel === 'normal' ? 'Normal' : 'Rápido'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Erro ao carregar preferências
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <button
            onClick={salvarPreferencias}
            disabled={salvando || salvo || loading}
            className="w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: salvo ? 'var(--success)' : corPrimaria,
              color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)',
              opacity: (salvando || loading) ? 0.7 : 1,
            }}
          >
            {salvando ? (
              <>
                <div className="spinner-white w-4 h-4" />
                Salvando...
              </>
            ) : salvo ? (
              <>
                <Check className="w-5 h-5" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Preferências
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE AUXILIAR - Toggle de Preferência
// ═══════════════════════════════════════════════════════════

function PreferenciaToggle({
  icon,
  label,
  sublabel,
  ativo,
  onToggle,
  cor,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  ativo: boolean
  onToggle: () => void
  cor: string
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{
        background: ativo ? `${cor}15` : 'var(--bg-elevated)',
        border: `1px solid ${ativo ? cor : 'var(--border-default)'}`,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: ativo ? `${cor}20` : 'var(--bg-surface)',
          color: ativo ? cor : 'var(--text-muted)',
        }}
      >
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {sublabel}
        </p>
      </div>
      <div
        className="w-10 h-6 rounded-full p-1 transition-all"
        style={{
          background: ativo ? cor : 'var(--bg-overlay)',
        }}
      >
        <div
          className="w-4 h-4 rounded-full bg-white transition-transform"
          style={{
            transform: ativo ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
      </div>
    </button>
  )
}
