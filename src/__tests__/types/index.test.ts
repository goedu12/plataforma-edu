import {
  obterNivelPorPontos,
  calcularTaxaAcerto,
  extrairAnoTurma,
  NIVEIS_JOGADOR,
  PONTUACAO,
} from '@/types'

describe('Types - obterNivelPorPontos', () => {
  it('returns Iniciante for 0 points', () => {
    const nivel = obterNivelPorPontos(0)
    expect(nivel.nome).toBe('Iniciante')
    expect(nivel.emoji).toBe('🌱')
  })

  it('returns Curioso for 100 points', () => {
    const nivel = obterNivelPorPontos(100)
    expect(nivel.nome).toBe('Curioso')
  })

  it('returns Aprendiz for 300 points', () => {
    const nivel = obterNivelPorPontos(300)
    expect(nivel.nome).toBe('Aprendiz')
  })

  it('returns Estudioso for 600 points', () => {
    const nivel = obterNivelPorPontos(600)
    expect(nivel.nome).toBe('Estudioso')
  })

  it('returns Dedicado for 1000 points', () => {
    const nivel = obterNivelPorPontos(1000)
    expect(nivel.nome).toBe('Dedicado')
  })

  it('returns Gênio for 6000+ points', () => {
    const nivel = obterNivelPorPontos(6000)
    expect(nivel.nome).toBe('Gênio')
    expect(nivel.emoji).toBe('🧠')
  })

  it('returns correct level at boundaries', () => {
    expect(obterNivelPorPontos(99).nome).toBe('Iniciante')
    expect(obterNivelPorPontos(100).nome).toBe('Curioso')
    expect(obterNivelPorPontos(299).nome).toBe('Curioso')
    expect(obterNivelPorPontos(300).nome).toBe('Aprendiz')
  })
})

describe('Types - calcularTaxaAcerto', () => {
  it('calculates correct percentage', () => {
    expect(calcularTaxaAcerto(75, 100)).toBe(75)
  })

  it('returns 0 for 0 total', () => {
    expect(calcularTaxaAcerto(0, 0)).toBe(0)
  })

  it('rounds to integer', () => {
    expect(calcularTaxaAcerto(1, 3)).toBe(33)
  })

  it('handles 100% correctly', () => {
    expect(calcularTaxaAcerto(10, 10)).toBe(100)
  })
})

describe('Types - extrairAnoTurma', () => {
  it('extracts year and level for Ensino Médio', () => {
    const result = extrairAnoTurma('1A')
    expect(result.ano).toBe(1)
    expect(result.nivel).toBe('EM')
  })

  it('extracts year and level for Ensino Fundamental', () => {
    const result = extrairAnoTurma('7B')
    expect(result.ano).toBe(7)
    expect(result.nivel).toBe('EF')
  })

  it('handles lowercase turma', () => {
    const result = extrairAnoTurma('9c')
    expect(result.ano).toBe(9)
    expect(result.nivel).toBe('EF')
  })

  it('throws for invalid turma', () => {
    expect(() => extrairAnoTurma('5A')).toThrow()
  })

  it('throws for invalid format', () => {
    expect(() => extrairAnoTurma('ABC')).toThrow()
  })
})

describe('Types - NIVEIS_JOGADOR', () => {
  it('has 9 levels', () => {
    expect(NIVEIS_JOGADOR).toHaveLength(9)
  })

  it('levels are in ascending order', () => {
    for (let i = 1; i < NIVEIS_JOGADOR.length; i++) {
      expect(NIVEIS_JOGADOR[i].pontos_min).toBeGreaterThan(
        NIVEIS_JOGADOR[i - 1].pontos_min
      )
    }
  })
})

describe('Types - PONTUACAO', () => {
  it('has correct values', () => {
    expect(PONTUACAO.RESPOSTA_CORRETA).toBe(10)
    expect(PONTUACAO.RESPOSTA_COM_DICA).toBe(5)
    expect(PONTUACAO.RESPOSTA_INCORRETA).toBe(0)
    expect(PONTUACAO.BONUS_VELOCIDADE).toBe(2)
    expect(PONTUACAO.BONUS_SEQUENCIA_7_DIAS).toBe(50)
    expect(PONTUACAO.LIMITE_IA_DIARIO).toBe(15)
  })
})
