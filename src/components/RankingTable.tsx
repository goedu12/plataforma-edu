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

  if (ranking.length === 0) {
    return (
      <div className="card-standard text-center py-8">
        <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Nenhum estudante no ranking ainda.
        </p>
        <p className="text-2xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Comece a estudar para aparecer aqui!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pódio - Top 3 */}
      {top3.length >= 3 && (
        <div className="card-standard">
          <div className="flex items-end justify-center gap-3 pt-2">
            {/* 2º Lugar */}
            <div className="flex flex-col items-center w-24">
              <div className="relative mb-2">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    border: `3px solid ${getPodiumColor(2)}`,
                    background: 'var(--bg-elevated)',
                    boxShadow: `0 0 15px ${getPodiumColor(2)}40`,
                  }}
                >
                  <span className="text-lg font-bold" style={{ color: getPodiumColor(2) }}>
                    {top3[1]?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold"
                  style={{ background: getPodiumColor(2), color: '#000' }}
                >
                  2
                </div>
              </div>
              <p className="text-xs font-semibold truncate max-w-full text-center" style={{ color: 'var(--text-primary)' }}>
                {top3[1]?.nome.split(' ')[0]}
              </p>
              <p className="text-2xs tabular-nums font-semibold" style={{ color: getPodiumColor(2) }}>
                {top3[1]?.pontos} pts
              </p>
              <div
                className="w-full h-12 rounded-t-lg mt-2"
                style={{ background: `linear-gradient(180deg, ${getPodiumColor(2)}40 0%, ${getPodiumColor(2)}15 100%)` }}
              />
            </div>

            {/* 1º Lugar */}
            <div className="flex flex-col items-center w-28 -mt-4">
              <Crown className="w-6 h-6 mb-1" style={{ color: getPodiumColor(1) }} />
              <div className="relative mb-2">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    border: `4px solid ${getPodiumColor(1)}`,
                    background: 'var(--bg-elevated)',
                    boxShadow: `0 0 25px ${getPodiumColor(1)}50`,
                  }}
                >
                  <span className="text-xl font-bold" style={{ color: getPodiumColor(1) }}>
                    {top3[0]?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: getPodiumColor(1) }}
                >
                  <Trophy className="w-3.5 h-3.5" style={{ color: '#000' }} />
                </div>
              </div>
              <p className="text-sm font-bold truncate max-w-full text-center" style={{ color: 'var(--text-primary)' }}>
                {top3[0]?.nome.split(' ')[0]}
              </p>
              <p className="text-xs tabular-nums font-bold" style={{ color: getPodiumColor(1) }}>
                {top3[0]?.pontos} pts
              </p>
              <div
                className="w-full h-16 rounded-t-lg mt-2"
                style={{ background: `linear-gradient(180deg, ${getPodiumColor(1)}40 0%, ${getPodiumColor(1)}15 100%)` }}
              />
            </div>

            {/* 3º Lugar */}
            <div className="flex flex-col items-center w-24">
              <div className="relative mb-2">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    border: `3px solid ${getPodiumColor(3)}`,
                    background: 'var(--bg-elevated)',
                    boxShadow: `0 0 15px ${getPodiumColor(3)}40`,
                  }}
                >
                  <span className="text-lg font-bold" style={{ color: getPodiumColor(3) }}>
                    {top3[2]?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold"
                  style={{ background: getPodiumColor(3), color: '#fff' }}
                >
                  3
                </div>
              </div>
              <p className="text-xs font-semibold truncate max-w-full text-center" style={{ color: 'var(--text-primary)' }}>
                {top3[2]?.nome.split(' ')[0]}
              </p>
              <p className="text-2xs tabular-nums font-semibold" style={{ color: getPodiumColor(3) }}>
                {top3[2]?.pontos} pts
              </p>
              <div
                className="w-full h-8 rounded-t-lg mt-2"
                style={{ background: `linear-gradient(180deg, ${getPodiumColor(3)}40 0%, ${getPodiumColor(3)}15 100%)` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista de Posições */}
      <div className="space-y-2">
        {(top3.length < 3 ? ranking : restante).map(item => {
          const isUsuario = item.usuario_id === usuarioAtualId
          return (
            <div
              key={item.usuario_id}
              className="list-item"
              style={{
                border: isUsuario
                  ? `2px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`
                  : '1px solid var(--border-default)',
              }}
            >
              <div className="flex items-center gap-4">
                {/* Posição */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: item.posicao <= 10
                      ? (isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)')
                      : 'var(--bg-elevated)',
                    color: item.posicao <= 10 ? corPrimaria : 'var(--text-muted)',
                  }}
                >
                  {item.posicao}º
                </div>

                {/* Nome e Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.nome}
                    {isUsuario && (
                      <span className="ml-2 text-2xs font-semibold" style={{ color: corPrimaria }}>
                        (você)
                      </span>
                    )}
                  </p>
                  <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                    {item.nivel} • {item.taxa_acerto}% acerto
                  </p>
                </div>

                {/* Pontos */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-base font-bold tabular-nums"
                    style={{ color: isUsuario ? corPrimaria : 'var(--text-primary)' }}
                  >
                    {item.pontos}
                  </span>
                  {isUsuario && (
                    <Star className="w-4 h-4" style={{ color: corPrimaria }} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
