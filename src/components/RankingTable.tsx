'use client'

import { Trophy, Medal, Star, Crown, TrendingUp } from 'lucide-react'
import ProfilePhoto from './ProfilePhoto'
import type { RankingItem, Componente } from '@/types'

interface RankingTableProps {
  ranking: RankingItem[]
  componente: Componente
  usuarioAtualId: string
}

// Cores Koyeb
const KOYEB = {
  bg: '#0D0D14',
  bgCard: '#1A1A2E',
  bgElevated: '#222238',
  bgDark: '#12121C',
  primary: '#00FF88',
  accent: '#00D4FF',
  fisica: '#00FF88',
  matematica: '#A855F7',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B8B9A',
  textMuted: '#5A5A6E',
  border: 'rgba(255,255,255,0.05)',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
}

export default function RankingTable({
  ranking,
  componente,
  usuarioAtualId,
}: RankingTableProps) {
  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? KOYEB.fisica : KOYEB.matematica

  const top3 = ranking.slice(0, 3)
  const restante = ranking.slice(3)

  // Encontrar posição do usuário
  const posicaoUsuario = ranking.findIndex(r => r.usuario_id === usuarioAtualId) + 1
  const dadosUsuario = ranking.find(r => r.usuario_id === usuarioAtualId)

  const getPodiumColor = (posicao: number) => {
    switch (posicao) {
      case 1: return KOYEB.gold
      case 2: return KOYEB.silver
      case 3: return KOYEB.bronze
      default: return KOYEB.textMuted
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
          style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
        >
          <div className="flex items-end justify-center gap-3 pt-4">
            {/* 2º Lugar */}
            <div className="flex flex-col items-center w-24">
              <div className="relative mb-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    border: `3px solid ${KOYEB.silver}`,
                    boxShadow: `0 0 20px rgba(192, 192, 192, 0.3)`,
                  }}
                >
                  {top3[1]?.foto_url ? (
                    <img
                      src={top3[1].foto_url}
                      alt={top3[1].nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-2xl font-bold"
                      style={{ color: KOYEB.silver }}
                    >
                      {top3[1]?.nome?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: KOYEB.silver }}
                >
                  <span className="text-xs font-bold" style={{ color: KOYEB.bg }}>2</span>
                </div>
              </div>
              <p
                className="font-mono text-xs font-bold truncate max-w-full text-center"
                style={{ color: KOYEB.textPrimary }}
              >
                {top3[1]?.nome.split(' ')[0]}
              </p>
              <p
                className="font-mono text-xs tabular-nums"
                style={{ color: KOYEB.silver }}
              >
                {top3[1]?.pontos} pts
              </p>
              <div
                className={`w-full ${getPodiumHeight(2)} rounded-t-lg mt-3`}
                style={{
                  background: `linear-gradient(180deg, ${KOYEB.silver}40 0%, ${KOYEB.silver}20 100%)`,
                  borderTop: `2px solid ${KOYEB.silver}`,
                }}
              />
            </div>

            {/* 1º Lugar - Mais alto */}
            <div className="flex flex-col items-center w-28 -mt-4">
              <Crown
                className="w-8 h-8 mb-2 animate-bounce"
                style={{ color: KOYEB.gold, animationDuration: '2s' }}
              />
              <div className="relative mb-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    border: `4px solid ${KOYEB.gold}`,
                    boxShadow: `0 0 30px rgba(255, 215, 0, 0.4)`,
                  }}
                >
                  {top3[0]?.foto_url ? (
                    <img
                      src={top3[0].foto_url}
                      alt={top3[0].nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-3xl font-bold"
                      style={{ color: KOYEB.gold }}
                    >
                      {top3[0]?.nome?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: KOYEB.gold }}
                >
                  <Trophy className="w-4 h-4" style={{ color: KOYEB.bg }} />
                </div>
              </div>
              <p
                className="font-mono text-sm font-bold truncate max-w-full text-center"
                style={{ color: KOYEB.textPrimary }}
              >
                {top3[0]?.nome.split(' ')[0]}
              </p>
              <p
                className="font-mono text-sm tabular-nums font-bold"
                style={{ color: KOYEB.gold }}
              >
                {top3[0]?.pontos} pts
              </p>
              <div
                className={`w-full ${getPodiumHeight(1)} rounded-t-lg mt-3`}
                style={{
                  background: `linear-gradient(180deg, ${KOYEB.gold}40 0%, ${KOYEB.gold}20 100%)`,
                  borderTop: `2px solid ${KOYEB.gold}`,
                }}
              />
            </div>

            {/* 3º Lugar */}
            <div className="flex flex-col items-center w-24">
              <div className="relative mb-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    border: `3px solid ${KOYEB.bronze}`,
                    boxShadow: `0 0 20px rgba(205, 127, 50, 0.3)`,
                  }}
                >
                  {top3[2]?.foto_url ? (
                    <img
                      src={top3[2].foto_url}
                      alt={top3[2].nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-2xl font-bold"
                      style={{ color: KOYEB.bronze }}
                    >
                      {top3[2]?.nome?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: KOYEB.bronze }}
                >
                  <span className="text-xs font-bold" style={{ color: KOYEB.bg }}>3</span>
                </div>
              </div>
              <p
                className="font-mono text-xs font-bold truncate max-w-full text-center"
                style={{ color: KOYEB.textPrimary }}
              >
                {top3[2]?.nome.split(' ')[0]}
              </p>
              <p
                className="font-mono text-xs tabular-nums"
                style={{ color: KOYEB.bronze }}
              >
                {top3[2]?.pontos} pts
              </p>
              <div
                className={`w-full ${getPodiumHeight(3)} rounded-t-lg mt-3`}
                style={{
                  background: `linear-gradient(180deg, ${KOYEB.bronze}40 0%, ${KOYEB.bronze}20 100%)`,
                  borderTop: `2px solid ${KOYEB.bronze}`,
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
            background: `linear-gradient(135deg, ${KOYEB.bgCard} 0%, ${isFisica ? 'rgba(0, 255, 136, 0.1)' : 'rgba(168, 85, 247, 0.1)'} 100%)`,
            border: `2px solid ${accentColor}40`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold"
              style={{ background: `${accentColor}20`, color: accentColor }}
            >
              {posicaoUsuario}º
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-mono text-sm font-bold truncate"
                style={{ color: KOYEB.textPrimary }}
              >
                {dadosUsuario.nome}
                <span className="ml-2 text-xs" style={{ color: accentColor }}>(você)</span>
              </p>
              <p className="text-xs" style={{ color: KOYEB.textMuted }}>
                {dadosUsuario.nivel} • {dadosUsuario.taxa_acerto}% acerto
              </p>
            </div>
            <div className="text-right">
              <p
                className="font-mono text-lg font-bold"
                style={{ color: accentColor }}
              >
                {dadosUsuario.pontos}
              </p>
              <p className="text-xs" style={{ color: KOYEB.textMuted }}>pontos</p>
            </div>
            <Star className="w-5 h-5" style={{ color: accentColor }} />
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
              className="rounded-xl p-4 transition-all duration-300 hover:translate-y-[-1px]"
              style={{
                background: isUsuario
                  ? `linear-gradient(135deg, ${KOYEB.bgCard} 0%, ${isFisica ? 'rgba(0, 255, 136, 0.1)' : 'rgba(168, 85, 247, 0.1)'} 100%)`
                  : KOYEB.bgCard,
                border: isUsuario
                  ? `2px solid ${accentColor}40`
                  : `1px solid ${KOYEB.border}`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold"
                  style={{
                    background: KOYEB.bgElevated,
                    color: item.posicao <= 10 ? accentColor : KOYEB.textMuted,
                  }}
                >
                  {item.posicao}º
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className="font-mono text-sm font-medium truncate"
                      style={{ color: KOYEB.textPrimary }}
                    >
                      {item.nome}
                      {isUsuario && (
                        <span className="ml-2 text-xs" style={{ color: accentColor }}>(você)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: KOYEB.textMuted }}>
                    {item.nivel} • {item.taxa_acerto}% acerto
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className="font-mono text-lg font-bold tabular-nums"
                    style={{ color: isUsuario ? accentColor : KOYEB.textPrimary }}
                  >
                    {item.pontos}
                  </p>
                  <p className="text-xs" style={{ color: KOYEB.textMuted }}>pts</p>
                </div>

                {isUsuario && (
                  <Star className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {ranking.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
        >
          <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: KOYEB.textMuted }} />
          <p className="font-mono text-sm" style={{ color: KOYEB.textSecondary }}>
            Nenhum estudante no ranking ainda.
          </p>
          <p className="text-xs mt-1" style={{ color: KOYEB.textMuted }}>
            Comece a estudar para aparecer aqui!
          </p>
        </div>
      )}
    </div>
  )
}
