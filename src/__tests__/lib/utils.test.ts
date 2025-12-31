import {
  normalizarTexto,
  gerarEmailEstudante,
  formatarTempo,
  formatarPontos,
  formatarPorcentagem,
  validarEmail,
  ehHoje,
  ehOntem,
} from '@/lib/utils'

describe('Utils - normalizarTexto', () => {
  it('converts to lowercase', () => {
    expect(normalizarTexto('MARIA')).toBe('maria')
  })

  it('removes accents', () => {
    expect(normalizarTexto('José María')).toBe('josemaria')
  })

  it('removes spaces', () => {
    expect(normalizarTexto('Maria Silva')).toBe('mariasilva')
  })

  it('removes special characters', () => {
    expect(normalizarTexto("D'Silva-Costa")).toBe('dsilvacosta')
  })

  it('handles empty string', () => {
    expect(normalizarTexto('')).toBe('')
  })
})

describe('Utils - gerarEmailEstudante', () => {
  it('generates correct email format', () => {
    expect(gerarEmailEstudante('Maria Silva', '1A')).toBe('mariasilva@1a')
  })

  it('handles accented names', () => {
    expect(gerarEmailEstudante('José María', '2B')).toBe('josemaria@2b')
  })

  it('normalizes turma to lowercase', () => {
    expect(gerarEmailEstudante('João', '3C')).toBe('joao@3c')
  })
})

describe('Utils - formatarTempo', () => {
  it('formats seconds correctly', () => {
    expect(formatarTempo(65)).toBe('1:05')
  })

  it('formats minutes correctly', () => {
    expect(formatarTempo(120)).toBe('2:00')
  })

  it('handles zero', () => {
    expect(formatarTempo(0)).toBe('0:00')
  })

  it('pads seconds with zero', () => {
    expect(formatarTempo(5)).toBe('0:05')
  })
})

describe('Utils - formatarPontos', () => {
  it('formats small numbers', () => {
    expect(formatarPontos(100)).toBe('100')
  })

  it('formats large numbers with separator', () => {
    expect(formatarPontos(1000)).toContain('1')
  })
})

describe('Utils - formatarPorcentagem', () => {
  it('formats percentage', () => {
    expect(formatarPorcentagem(75)).toBe('75%')
  })

  it('rounds decimal values', () => {
    expect(formatarPorcentagem(75.6)).toBe('76%')
  })
})

describe('Utils - validarEmail', () => {
  it('validates correct email format', () => {
    expect(validarEmail('mariasilva@1a')).toBe(true)
  })

  it('rejects email with spaces', () => {
    expect(validarEmail('maria silva@1a')).toBe(false)
  })

  it('rejects email without @', () => {
    expect(validarEmail('mariasilva1a')).toBe(false)
  })

  it('rejects email with invalid turma', () => {
    expect(validarEmail('maria@abc')).toBe(false)
  })
})

describe('Utils - ehHoje', () => {
  it('returns true for today', () => {
    expect(ehHoje(new Date())).toBe(true)
  })

  it('returns false for yesterday', () => {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    expect(ehHoje(ontem)).toBe(false)
  })

  it('handles null', () => {
    expect(ehHoje(null)).toBe(false)
  })
})

describe('Utils - ehOntem', () => {
  it('returns true for yesterday', () => {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    expect(ehOntem(ontem)).toBe(true)
  })

  it('returns false for today', () => {
    expect(ehOntem(new Date())).toBe(false)
  })

  it('handles null', () => {
    expect(ehOntem(null)).toBe(false)
  })
})
