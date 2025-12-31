'use client'

import { Trophy, Medal, Star, TrendingUp } from 'lucide-react'
import Card from './ui/Card'
import Badge from './ui/Badge'
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
  const getPodiumIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-semibold">{posicao}</span>
    }
  }

  const top3 = ranking.slice(0, 3)
  const restante = ranking.slice(3)

  const bgColor = componente === 'fisica' ? 'bg-fisica-500' : 'bg-matematica-500'
  const gradientFrom = componente === 'fisica' ? 'from-fisica-500' : 'from-matematica-500'
  const gradientTo = componente === 'fisica' ? 'to-fisica-600' : 'to-matematica-600'

  return (
    <div className="space-y-6">
      {/* Pódio - Top 3 */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-6">
          {/* 2º Lugar */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-gray-600">2</span>
            </div>
            <p className="text-sm font-medium text-center truncate max-w-[80px]">
              {top3[1]?.nome.split(' ')[0]}
            </p>
            <p className="text-xs text-gray-500">{top3[1]?.pontos} pts</p>
            <div className={`w-16 h-20 ${bgColor} opacity-70 rounded-t-lg mt-2`} />
          </div>

          {/* 1º Lugar */}
          <div className="flex flex-col items-center -mt-4">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-2 shadow-lg`}>
                <Trophy className="w-10 h-10 text-yellow-300" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                <Star className="w-5 h-5 text-yellow-800" />
              </div>
            </div>
            <p className="text-sm font-bold text-center truncate max-w-[100px]">
              {top3[0]?.nome.split(' ')[0]}
            </p>
            <p className="text-xs text-gray-500 font-semibold">{top3[0]?.pontos} pts</p>
            <div className={`w-20 h-28 ${bgColor} rounded-t-lg mt-2`} />
          </div>

          {/* 3º Lugar */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-amber-700">3</span>
            </div>
            <p className="text-sm font-medium text-center truncate max-w-[80px]">
              {top3[2]?.nome.split(' ')[0]}
            </p>
            <p className="text-xs text-gray-500">{top3[2]?.pontos} pts</p>
            <div className={`w-16 h-16 ${bgColor} opacity-50 rounded-t-lg mt-2`} />
          </div>
        </div>
      )}

      {/* Lista restante */}
      <div className="space-y-2">
        {(top3.length < 3 ? ranking : restante).map(item => (
          <Card
            key={item.usuario_id}
            className={`flex items-center gap-4 p-4 ${
              item.usuario_id === usuarioAtualId
                ? componente === 'fisica'
                  ? 'bg-fisica-50 border-2 border-fisica-300'
                  : 'bg-matematica-50 border-2 border-matematica-300'
                : ''
            }`}
          >
            <div className="flex items-center justify-center w-8">
              {getPodiumIcon(item.posicao)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">
                  {item.nome}
                  {item.usuario_id === usuarioAtualId && (
                    <span className="ml-2 text-xs text-gray-500">(você)</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{item.nivel}</span>
                <span>•</span>
                <span>{item.taxa_acerto}% acerto</span>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-lg">{item.pontos}</p>
              <p className="text-xs text-gray-500">pontos</p>
            </div>

            {item.usuario_id === usuarioAtualId && (
              <Star className={`w-5 h-5 ${componente === 'fisica' ? 'text-fisica-500' : 'text-matematica-500'}`} />
            )}
          </Card>
        ))}
      </div>

      {ranking.length === 0 && (
        <Card className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum estudante no ranking ainda.</p>
          <p className="text-sm text-gray-400 mt-1">
            Comece a estudar para aparecer aqui!
          </p>
        </Card>
      )}
    </div>
  )
}
