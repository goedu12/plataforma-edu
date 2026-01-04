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

  const posicaoUsuario = ranking.findIndex(r => r.usuario_id === usuarioAtualId) + 1
  const dadosUsuario = ranking.find(r => r.usuario_id === usuarioAtualId)

  const getPodiumColor = (posicao: number) => {
    switch (posicao) {
      case 1: return '#FFD700'
      case 2: return '#C0C0C0'
      case 3: return '#CD7F32'
      default: return 'var(--text-muted)'
    }
  }

  const getPodiumHeight = (posicao: number) => {
    switch (posicao) {
      case 1: return 'h-24'
      case 2: return 'h-16'
      case 3: return 'h-12'
      default: return 'h-8'
    }
  }

  return (
    <div className="space-y-6">
      {/* Pódio Visual - Top 3 */}
      {top3.length >= 3 && (
        <div
          className="rounded-2xl p-6 overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-end justify-center gap-3 pt-4">
            {/* 2º Lugar */}
            <div className="flex flex-col items-center w-24">
              <div className="relative mb-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    border: `3px solid ${getPodiumColor(2)}`,
                    boxShadow: `0 0 20px rgba(192, 192, 192, 0.3)`,
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <span
                    className="text-2xl font-bold"
                    style={{ color: getPodiumColor(2) }}
                  >
                    {top3[1]?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: getPodiumColor(2) }}
                >
                  <span className="text-xs font-bold" style={{ color: 'var(--bg-base)' }}>2</span>
                </div>
              </div>
              <p
                className="text-xs font-bold truncate max-w-full text-center"
                style={{ color: 'var(--text-primary)' }}
              >
                {top3[1]?.nome.split(' ')[0]}
              </p>
              <p
                className="text-xs tabular-nums"
                style={{ color: getPodiumColor(2) }}
              >
                {top3[1]?.pontos} pts
              </p>
              <div
                className={`w-full ${getPodiumHeight(2)} rounded-t-lg mt-3`}
                style={{
                  background: `linear-gradient(180deg, ${getPodiumColor(2)}40 0%, ${getPodiumColor(2)}20 100%)`,
                  borderTop: `2px solid ${getPodiumColor(2)}`,
                }}
              />
            </div>

            {/* 1º Lugar */}
            <div className="flex flex-col items-center w-28 -mt-4">
              <Crown
                className="w-8 h-8 mb-2 animate-bounce"
                style={{ color: getPodiumColor(1), animationDuration: '2s' }}
              />
              <div className="relative mb-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    border: `4px solid ${getPodiumColor(1)}`,
                    boxShadow: `0 0 30px rgba(255, 215, 0, 0.4)`,
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <span
                    className="text-3xl font-bold"
                    style={{ color: getPodiumColor(1) }}
                  >
                    {top3[0]?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: getPodiumColor(1) }}
                >
                  <Trophy className="w-4 h-4" style={{ color: 'var(--bg-base)' }} />
                </div>
              </div>
              <p
                className="text-sm font-bold truncate max-w-full text-center"
                style={{ color: 'var(--text-primary)' }}
              >
                {top3[0]?.nome.split(' ')[0]}
              </p>
              <p
                className="text-sm tabular-nums font-bold"
                style={{ color: getPodiumColor(1) }}
              >
                {top3[0]?.pontos} pts
              </p>
              <div
                className={`w-full ${getPodiumHeight(1)} rounded-t-lg mt-3`}
                style={{
                  background: `linear-gradient(180deg, ${getPodiumColor(1)}40 0%, ${getPodiumColor(1)}20 100%)`,
                  borderTop: `2px solid ${getPodiumColor(1)}`,
                }}
              />
            </div>

            {/* 3º Lugar */}
            <div className="flex flex-col items-center w-24">
              <div className="relative mb-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    border: `3px solid ${getPodiumColor(3)}`,
                    boxShadow: `0 0 20px rgba(205, 127, 50, 0.3)`,
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <span
                    className="text-2xl font-bold"
                    style={{ color: getPodiumColor(3) }}
                  >
                    {top3[2]?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: getPodiumColor(3) }}
                >
                  <span className="text-xs font-bold" style={{ color: 'var(--bg-base)' }}>3</span>
                </div>
              </div>
              <p
                className="text-xs font-bold truncate max-w-full text-center"
                style={{ color: 'var(--text-primary)' }}
              >
                {top3[2]?.nome.split(' ')[0]}
              </p>
              <p
                className="text-xs tabular-nums"
                style={{ color: getPodiumColor(3) }}
              >
                {top3[2]?.pontos} pts
              </p>
              <div
                className={`w-full ${getPodiumHeight(3)} rounded-t-lg mt-3`}
                style={{
                  background: `linear-gradient(180deg, ${getPodiumColor(3)}40 0%, ${getPodiumColor(3)}20 100%)`,
                  borderTop: `2px solid ${getPodiumColor(3)}`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sua Posição - Card destacado */}
      {posicaoUsuario > 3 && dadosUsuario && (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'var(--bg-surface)',
            border: `2px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                color: corPrimaria,
              }}
            >
              {posicaoUsuario}º
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {dadosUsuario.nome}
                <span className="ml-2 text-xs" style={{ color: corPrimaria }}>(você)</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {dadosUsuario.nivel} • {dadosUsuario.taxa_acerto}% acerto
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: corPrimaria }}>
                {dadosUsuario.pontos}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>pontos</p>
            </div>
            <Star className="w-5 h-5" style={{ color: corPrimaria }} />
          </div>
        </div>
      )}

      {/* Lista restante */}
      <div className="space-y-2">
        {(top3.length < 3 ? ranking : restante).map(item => {
          const isUsuario = item.usuario_id === usuarioAtualId
          return (
            <div
              key={item.usuario_id}
              className="rounded-xl p-4 transition-all duration-300"
              style={{
                background: 'var(--bg-surface)',
                border: isUsuario
                  ? `2px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`
                  : '1px solid var(--border-default)',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: item.posicao <= 10 ? corPrimaria : 'var(--text-muted)',
                  }}
                >
                  {item.posicao}º
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.nome}
                      {isUsuario && (
                        <span className="ml-2 text-xs" style={{ color: corPrimaria }}>(você)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.nivel} • {item.taxa_acerto}% acerto
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: isUsuario ? corPrimaria : 'var(--text-primary)' }}
                  >
                    {item.pontos}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>pts</p>
                </div>

                {isUsuario && (
                  <Star className="w-5 h-5 flex-shrink-0" style={{ color: corPrimaria }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {ranking.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
          }}
        >
          <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhum estudante no ranking ainda.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Comece a estudar para aparecer aqui!
          </p>
        </div>
      )}
    </div>
  )
}
