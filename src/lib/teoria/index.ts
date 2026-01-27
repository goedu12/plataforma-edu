// ═══════════════════════════════════════════════════════════════════════════
// TEORIA - EXPORTAÇÕES
// ═══════════════════════════════════════════════════════════════════════════

export * from './fisica'
export * from './matematica'

import { FISICA_CONTEUDOS, getTopicosTeoria, getTopicoById } from './fisica'
import { MATEMATICA_CONTEUDOS, getTopicosTeoriaMatematica, getTopicoMatematicaById } from './matematica'
import type { Topico, ConteudoSerie } from './fisica'

export function getConteudoTeoria(componente: 'fisica' | 'matematica', serie: number, bimestre: number = 1): Topico[] {
  if (componente === 'fisica') {
    return getTopicosTeoria(serie, bimestre)
  }
  return getTopicosTeoriaMatematica(serie, bimestre)
}

export function getTopico(componente: 'fisica' | 'matematica', serie: number, topicoId: string, bimestre: number = 1): Topico | null {
  if (componente === 'fisica') {
    return getTopicoById(serie, topicoId, bimestre)
  }
  return getTopicoMatematicaById(serie, topicoId, bimestre)
}

export function getConteudoCompleto(componente: 'fisica' | 'matematica'): Record<number, ConteudoSerie> {
  return componente === 'fisica' ? FISICA_CONTEUDOS : MATEMATICA_CONTEUDOS
}
