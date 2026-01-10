'use client'

import { Trophy, Star, Crown, TrendingUp } from 'lucide-react'
import type { RankingItem, Componente } from '@/types'

interface RankingTableProps {
  ranking: RankingItem[]
  componente: Componente
  usuarioAtualId: string
}

export default function RankingTable({
  ranking,
  componente,
  usuarioAtualId,
}: RankingTableProps) {
  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const top3 = ranking.slice(0, 3)
  const restante = ranking.slice(3)

  const getPodiumColor = (posicao: number) => {
    switch (posicao) {
      case 1: return '#FFD700'
      case 2: return '#C0C0C0'
      case 3: return '#CD7F32'
      default: return 'var(--text-muted)'
    }
  }

  return (
    <div className="space-y-3">
      {/* Pódio Compacto - Top 3 */}
      {top3.length >= 3 && (
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-end justify-center gap-2">
            {/* 2º Lugar */}
            <div className="flex flex-col items-center w-20">
              <div className="relative mb-1">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ border: `2px solid ${getPodiumColor(2)}`, background: 'var(--bg-elevated)' }}
                >
                  <span className="text-base font-bold" style={{ color: getPodiumColor(2) }}>
                    {top3[1]?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: getPodiumColor(2), color: 'var(--bg-base)' }}
                >
                  2
                </div>
              </div>
              <p className="text-[11px] font-semibold truncate max-w-full text-center" style={{ color: 'var(--text-primary)' }}>
                {top3[1]?.nome.split(' ')[0]}
              </p>
              <p className="text-[10px] tabular-nums" style={{ color: getPodiumColor(2) }}>
                {top3[1]?.pontos} pts
              </p>
              <div
                className="w-full h-10 rounded-t-md mt-1"
                style={{ background: `linear-gradient(180deg, ${getPodiumColor(2)}30 0%, ${getPodiumColor(2)}10 100%)` }}
              />
            </div>

            {/* 1º Lugar */}
            <div className="flex flex-col items-center w-24 -mt-2">
              <Crown className="w-5 h-5 mb-1" style={{ color: getPodiumColor(1) }} />
              <div className="relative mb-1">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ border: `3px solid ${getPodiumColor(1)}`, background: 'var(--bg-elevated)', boxShadow: `0 0 15px rgba(255, 215, 0, 0.3)` }}
                >
                  <span className="text-xl font-bold" style={{ color: getPodiumColor(1) }}>
                    {top3[0]?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: getPodiumColor(1) }}
                >
                  <Trophy className="w-3 h-3" style={{ color: 'var(--bg-base)' }} />
                </div>
              </div>
              <p className="text-xs font-bold truncate max-w-full text-center" style={{ color: 'var(--text-primary)' }}>
                {top3[0]?.nome.split(' ')[0]}
              </p>
              <p className="text-[11px] tabular-nums font-bold" style={{ color: getPodiumColor(1) }}>
                {top3[0]?.pontos} pts
              </p>
              <div
                className="w-full h-14 rounded-t-md mt-1"
                style={{ background: `linear-gradient(180deg, ${getPodiumColor(1)}30 0%, ${getPodiumColor(1)}10 100%)` }}
              />
            </div>

            {/* 3º Lugar */}
            <div className="flex flex-col items-center w-20">
              <div className="relative mb-1">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ border: `2px solid ${getPodiumColor(3)}`, background: 'var(--bg-elevated)' }}
                >
                  <span className="text-base font-bold" style={{ color: getPodiumColor(3) }}>
                    {top3[2]?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: getPodiumColor(3), color: 'var(--bg-base)' }}
                >
                  3
                </div>
              </div>
              <p className="text-[11px] font-semibold truncate max-w-full text-center" style={{ color: 'var(--text-primary)' }}>
                {top3[2]?.nome.split(' ')[0]}
              </p>
              <p className="text-[10px] tabular-nums" style={{ color: getPodiumColor(3) }}>
                {top3[2]?.pontos} pts
              </p>
              <div
                className="w-full h-7 rounded-t-md mt-1"
                style={{ background: `linear-gradient(180deg, ${getPodiumColor(3)}30 0%, ${getPodiumColor(3)}10 100%)` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista compacta */}
      <div className="space-y-1.5">
        {(top3.length < 3 ? ranking : restante).map(item => {
          const isUsuario = item.usuario_id === usuarioAtualId
          return (
            <div
              key={item.usuario_id}
              className="rounded-lg px-3 py-2 transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: isUsuario
                  ? `2px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`
                  : '1px solid var(--border-default)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{
                    background: item.posicao <= 10 ? (isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)') : 'var(--bg-elevated)',
                    color: item.posicao <= 10 ? corPrimaria : 'var(--text-muted)',
                  }}
                >
                  {item.posicao}º
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.nome}
                    {isUsuario && <span className="ml-1 text-[10px]" style={{ color: corPrimaria }}>(você)</span>}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {item.nivel} • {item.taxa_acerto}%
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: isUsuario ? corPrimaria : 'var(--text-primary)' }}
                  >
                    {item.pontos}
                  </span>
                  {isUsuario && <Star className="w-4 h-4 flex-shrink-0" style={{ color: corPrimaria }} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {ranking.length === 0 && (
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhum estudante no ranking.
          </p>
        </div>
      )}
    </div>
  )
}
