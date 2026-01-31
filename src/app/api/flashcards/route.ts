export const dynamic = 'force-dynamic'

/**
 * API de FlashCards
 * GET /api/flashcards - Buscar questões e temas
 */

import { NextRequest, NextResponse } from 'next/server'
import { buscarFlashCards, obterTemasDisponiveis, obterEstatisticasComponente } from '@/data/flashcards'
import type { Componente } from '@/types'
import type { AnoEscolar, TipoFlashCard, DificuldadeFlashCard } from '@/types/flashcards'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const action = searchParams.get('action') || 'questoes'
    const componente = searchParams.get('componente') as Componente

    // Validar componente
    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    // Ação: buscar temas disponíveis
    if (action === 'temas') {
      const ano = searchParams.get('ano') as AnoEscolar | null
      const temas = obterTemasDisponiveis(componente, ano || undefined)

      return NextResponse.json({
        sucesso: true,
        temas,
        total: temas.length,
      })
    }

    // Ação: buscar estatísticas
    if (action === 'estatisticas') {
      const estatisticas = obterEstatisticasComponente(componente)

      return NextResponse.json({
        sucesso: true,
        estatisticas,
      })
    }

    // Ação padrão: buscar questões
    const ano = searchParams.get('ano') as AnoEscolar | null
    const tema = searchParams.get('tema')
    const tipo = searchParams.get('tipo') as TipoFlashCard | null
    const dificuldade = searchParams.get('dificuldade') as DificuldadeFlashCard | null
    const limite = parseInt(searchParams.get('limite') || '10', 10)
    const excluirIdsParam = searchParams.get('excluirIds')
    const excluirIds = excluirIdsParam ? excluirIdsParam.split(',') : undefined

    const questoes = buscarFlashCards({
      componente,
      ano: ano || undefined,
      tema: tema || undefined,
      tipo: tipo || undefined,
      dificuldade: dificuldade || undefined,
      limite,
      excluirIds,
    })

    if (questoes.length === 0) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Nenhuma questão encontrada para os filtros selecionados',
        questoes: [],
      })
    }

    return NextResponse.json({
      sucesso: true,
      questoes,
      total: questoes.length,
    })
  } catch (error) {
    console.error('Erro na API de FlashCards:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
