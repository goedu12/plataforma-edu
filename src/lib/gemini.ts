import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai'
import type { Componente, MensagemChat } from '@/types'
import {
  type ModoIA,
  type ContextoEstudante,
  detectarModo,
  detectarTopico,
  obterPromptModo,
  obterDescricaoModo
} from './ia-modos'

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO DO CLIENTE GEMINI
// ═══════════════════════════════════════════════════════════

// Usando APENAS gemini-2.0-flash-lite conforme solicitado
// Modelo econômico e rápido, ideal para alta escala
const MODELO_GEMINI = 'gemini-2.0-flash-lite'

// Mantido para compatibilidade
const MODELOS_DISPONIVEIS = [MODELO_GEMINI] as const

// Cache do modelo que funcionou para reutilização
let modeloFuncionando: string | null = null

// Inicializar cliente Gemini (lazy - só quando precisar)
let _genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada')
    }
    _genAI = new GoogleGenerativeAI(apiKey)
  }
  return _genAI
}

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÕES DOS TUTORES
// Baseado em neurociência educacional e pedagogia moderna
// ═══════════════════════════════════════════════════════════
const TUTORES = {
  fisica: {
    nome: 'Newton',
    emoji: '',
    system: `Voce e Newton, tutor de Fisica para estudantes brasileiros do Ensino Medio.

PRINCIPIOS PEDAGOGICOS (baseados em neurociencia):

1. CARGA COGNITIVA: Apresente uma ideia por vez. Respostas curtas e focadas.

2. RECUPERACAO ATIVA: Em vez de explicar tudo, faca perguntas que facam o estudante pensar.
   Exemplo: "Antes de eu explicar, me diz: o que voce ja sabe sobre isso?"

3. ELABORACAO: Conecte novos conceitos com o que o estudante ja conhece.
   Exemplo: "Isso funciona parecido com [algo familiar]..."

4. SCAFFOLDING: De suporte proporcional a dificuldade. Guie mais quem sabe menos.

5. FEEDBACK ESPECIFICO: Nunca diga apenas "errado". Explique onde esta o problema.

ESTILO DE COMUNICACAO:

- Fale como um professor experiente: direto, claro, sem rodeios
- Trate o estudante como inteligente, apenas ainda aprendendo
- Linguagem simples, nunca simplista ou infantilizada
- Evite expressoes vazias como "muito bem!", "otima pergunta!", "vamos la!"
- NAO use emojis
- Maximo 2-3 paragrafos, exceto em resolucoes passo a passo

ESTRUTURA:

1. Responda diretamente o que foi perguntado
2. Se necessario, faca UMA pergunta para verificar entendimento
3. Mantenha o dialogo aberto naturalmente

TEMAS: Cinematica, Dinamica, Energia, Termodinamica, Optica, Ondas, Eletricidade, Magnetismo

PROIBIDO:
- "Vou te explicar de forma simples"
- Repetir nome do estudante varias vezes
- Frases motivacionais genericas
- Emojis
- Comecar com "Ola!" em respostas subsequentes`,
  },
  matematica: {
    nome: 'Pitagoras',
    emoji: '',
    system: `Voce e Pitagoras, tutor de Matematica para estudantes brasileiros do 6o ano ao 3o EM.

PRINCIPIOS PEDAGOGICOS (baseados em neurociencia):

1. CARGA COGNITIVA: Apresente uma ideia por vez. Respostas curtas e focadas.

2. RECUPERACAO ATIVA: Em vez de explicar tudo, faca perguntas que facam o estudante pensar.
   Exemplo: "O que voce ja tentou fazer?"

3. ELABORACAO: Conecte novos conceitos com conhecimento previo.
   Exemplo: "Lembra de [conceito anterior]? A logica e parecida..."

4. SCAFFOLDING: De suporte proporcional a dificuldade. Guie mais quem sabe menos.

5. FEEDBACK ESPECIFICO: Nunca diga apenas "errado". Explique onde esta o problema.

ESTILO DE COMUNICACAO:

- Fale como um professor experiente: direto, claro, sem rodeios
- Trate o estudante como inteligente, apenas ainda aprendendo
- Linguagem simples, nunca simplista ou infantilizada
- Evite expressoes vazias como "muito bem!", "otima pergunta!", "vamos la!"
- NAO use emojis
- Maximo 2-3 paragrafos, exceto em resolucoes passo a passo

ESTRUTURA:

1. Responda diretamente o que foi perguntado
2. Se necessario, faca UMA pergunta para verificar entendimento
3. Mantenha o dialogo aberto naturalmente

TEMAS: Funcoes, Geometria, Algebra, Trigonometria, Estatistica, Probabilidade, Aritmetica

PROIBIDO:
- "Vou te explicar de forma simples"
- Repetir nome do estudante varias vezes
- Frases motivacionais genericas
- Emojis
- Comecar com "Ola!" em respostas subsequentes`,
  },
}

// ═══════════════════════════════════════════════════════════
// INTERFACE DE RESPOSTA
// ═══════════════════════════════════════════════════════════
export interface ChatResponse {
  sucesso: boolean
  resposta?: string
  erro?: string
  modelo_usado?: string
  modo?: ModoIA
  topico?: string
}

// Re-exportar tipos e funções de modos
export {
  type ModoIA,
  type ContextoEstudante,
  detectarModo,
  detectarTopico,
  obterPromptModo,
  obterDescricaoModo
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO AUXILIAR: Testar modelo (com suporte a imagem)
// ═══════════════════════════════════════════════════════════
async function testarModelo(
  nomeModelo: string,
  prompt: string,
  imagemBase64?: string
): Promise<{ sucesso: boolean; resposta?: string; erro?: string }> {
  try {
    const genAI = getGenAI()
    const model = genAI.getGenerativeModel({ model: nomeModelo })

    // Construir conteúdo multimodal se tiver imagem
    let conteudo: string | Part[]

    if (imagemBase64) {
      // Multimodal: texto + imagem
      conteudo = [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imagemBase64
          }
        }
      ]
    } else {
      // Apenas texto
      conteudo = prompt
    }

    const result = await model.generateContent(conteudo)
    const response = result.response
    const texto = response.text()

    if (!texto) {
      return { sucesso: false, erro: 'Resposta vazia' }
    }

    return { sucesso: true, resposta: texto.trim() }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Gemini] Modelo ${nomeModelo} falhou:`, errorMessage)
    return { sucesso: false, erro: errorMessage }
  }
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL: Chat com Tutor (com fallback automático)
// ═══════════════════════════════════════════════════════════
export async function chatComTutor(
  componente: Componente,
  mensagem: string,
  historico: MensagemChat[] = [],
  contexto: ContextoEstudante = {},
  imagemBase64?: string
): Promise<ChatResponse> {
  // Validar componente
  const tutor = TUTORES[componente]
  if (!tutor) {
    return { sucesso: false, erro: 'Componente inválido' }
  }

  // Verificar API key
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[Gemini] GEMINI_API_KEY não configurada')
    return {
      sucesso: false,
      erro: 'O tutor IA não está configurado. Entre em contato com seu professor.'
    }
  }

  // Verificar se é placeholder
  if (apiKey === 'placeholder_gemini_key' || apiKey.startsWith('placeholder') || apiKey.length < 20) {
    console.error('[Gemini] API key parece ser um placeholder')
    return {
      sucesso: false,
      erro: 'O tutor IA ainda não está disponível. Entre em contato com seu professor.'
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DETECTAR MODO E TÓPICO AUTOMATICAMENTE
  // ═══════════════════════════════════════════════════════════
  const modoDetectado = detectarModo(mensagem, contexto)
  const topicoDetectado = detectarTopico(mensagem)
  const promptModo = obterPromptModo(modoDetectado)

  console.log(`[Gemini] Modo detectado: ${modoDetectado}, Tópico: ${topicoDetectado}`)

  // Construir histórico para o contexto
  const historicoTexto = historico
    .map(msg => `${msg.role === 'user' ? 'Estudante' : tutor.nome}: ${msg.content}`)
    .join('\n\n')

  // ═══════════════════════════════════════════════════════════
  // CONSTRUIR CONTEXTO PERSONALIZADO DO ESTUDANTE
  // ═══════════════════════════════════════════════════════════
  const parteContexto: string[] = []

  if (contexto.serie) {
    parteContexto.push(`Serie: ${contexto.serie}o ano do Ensino Medio`)
  }

  if (contexto.percentualAcertos !== undefined && contexto.questoesRespondidas) {
    parteContexto.push(`Desempenho recente: ${contexto.percentualAcertos}% de acertos em ${contexto.questoesRespondidas} questoes`)
  }

  if (contexto.temasComDificuldade && contexto.temasComDificuldade.length > 0) {
    parteContexto.push(`Temas com dificuldade: ${contexto.temasComDificuldade.join(', ')}`)
  }

  if (contexto.notaBimestre !== undefined && contexto.metaBimestre) {
    const progresso = Math.round((contexto.notaBimestre / contexto.metaBimestre) * 100)
    parteContexto.push(`Progresso no bimestre: ${contexto.notaBimestre}/${contexto.metaBimestre} pontos (${progresso}%)`)
  }

  if (contexto.sequenciaDias && contexto.sequenciaDias > 1) {
    parteContexto.push(`Sequencia de estudo: ${contexto.sequenciaDias} dias consecutivos`)
  }

  if (contexto.conquistaRecente) {
    parteContexto.push(`Conquista recente: "${contexto.conquistaRecente}"`)
  }

  const contextoEstudante = parteContexto.length > 0
    ? `\nCONTEXTO DO ESTUDANTE (use para adaptar sua resposta. Se o estudante perguntar sobre seu desempenho, acertos, progresso ou conquistas, pode mencionar esses dados diretamente de forma natural):\n${parteContexto.join('\n')}\n`
    : ''

  // ═══════════════════════════════════════════════════════════
  // PROMPT COMPLETO COM MODO ESPECÍFICO
  // ═══════════════════════════════════════════════════════════

  // Instrução especial se tiver imagem
  const instrucaoImagem = imagemBase64
    ? `\n\n[O estudante enviou uma IMAGEM junto com a mensagem. Analise a imagem cuidadosamente para entender o contexto - pode ser uma questão, um exercício, um gráfico, ou algo que ele precisa de ajuda. Use o conteúdo visual da imagem para dar uma resposta mais precisa.]\n`
    : ''

  const prompt = `${tutor.system}
${contextoEstudante}${instrucaoImagem}
${promptModo ? `\n${promptModo}\n` : ''}
${historicoTexto ? `HISTORICO DA CONVERSA:\n${historicoTexto}\n\n` : ''}Estudante: ${mensagem}

${tutor.nome}:`

  // Se temos um modelo que já funcionou antes, tentar ele primeiro
  const modelosParaTentar = modeloFuncionando
    ? [modeloFuncionando, ...MODELOS_DISPONIVEIS.filter(m => m !== modeloFuncionando)]
    : [...MODELOS_DISPONIVEIS]

  console.log('[Gemini] Iniciando tentativas com modelos:', modelosParaTentar)

  // Tentar cada modelo em ordem
  for (const nomeModelo of modelosParaTentar) {
    console.log(`[Gemini] Tentando modelo: ${nomeModelo}${imagemBase64 ? ' (com imagem)' : ''}`)

    const resultado = await testarModelo(nomeModelo, prompt, imagemBase64)

    if (resultado.sucesso && resultado.resposta) {
      // Cachear o modelo que funcionou
      if (modeloFuncionando !== nomeModelo) {
        modeloFuncionando = nomeModelo
        console.log(`[Gemini] Modelo ${nomeModelo} funcionou! Cacheando para próximas requisições.`)
      }

      return {
        sucesso: true,
        resposta: resultado.resposta,
        modelo_usado: nomeModelo,
        modo: modoDetectado,
        topico: topicoDetectado
      }
    }

    // Se o erro for de API key inválida, não adianta tentar outros modelos
    if (resultado.erro?.includes('API key') || resultado.erro?.includes('API_KEY')) {
      console.error('[Gemini] Erro de API key detectado, abortando tentativas')
      return {
        sucesso: false,
        erro: 'Chave da API inválida. Entre em contato com seu professor.'
      }
    }

    // Se for erro de quota/limite, também parar
    if (resultado.erro?.includes('quota') || resultado.erro?.includes('limit') || resultado.erro?.includes('429')) {
      console.error('[Gemini] Limite de quota atingido')
      return {
        sucesso: false,
        erro: 'Limite de uso da IA atingido. Tente novamente mais tarde.'
      }
    }
  }

  // Se nenhum modelo funcionou
  console.error('[Gemini] Todos os modelos falharam')
  return {
    sucesso: false,
    erro: 'O tutor está temporariamente indisponível. Por favor, tente novamente em alguns minutos.'
  }
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO: Verificar conectividade com a API
// ═══════════════════════════════════════════════════════════
export async function verificarConectividadeGemini(): Promise<{ ok: boolean; modelo?: string; erro?: string }> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey || apiKey.startsWith('placeholder')) {
    return { ok: false, erro: 'API key não configurada' }
  }

  // Tentar um prompt simples para verificar conectividade
  for (const modelo of MODELOS_DISPONIVEIS) {
    try {
      const resultado = await testarModelo(modelo, 'Responda apenas: OK')
      if (resultado.sucesso) {
        modeloFuncionando = modelo
        return { ok: true, modelo }
      }
    } catch {
      continue
    }
  }

  return { ok: false, erro: 'Nenhum modelo disponível' }
}

// ═══════════════════════════════════════════════════════════
// FUNÇÕES DE INFORMAÇÃO DOS TUTORES
// ═══════════════════════════════════════════════════════════
export function obterInfoTutor(componente: Componente) {
  return TUTORES[componente]
}

export function obterNomeTutor(componente: Componente): string {
  return TUTORES[componente]?.nome || 'Tutor'
}

export function obterEmojiTutor(componente: Componente): string {
  return TUTORES[componente]?.emoji || '🤖'
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO: Obter modelo atualmente em uso
// ═══════════════════════════════════════════════════════════
export function obterModeloAtual(): string | null {
  return modeloFuncionando
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO: Listar modelos disponíveis
// ═══════════════════════════════════════════════════════════
export function listarModelosDisponiveis(): readonly string[] {
  return MODELOS_DISPONIVEIS
}

// ═══════════════════════════════════════════════════════════
// GERAÇÃO DE QUESTÕES PARA TRILHAS
// Sistema de geração sob demanda com cache no banco de dados
// ═══════════════════════════════════════════════════════════

// Currículo de Física organizado por série e semana (40 semanas = 4 bimestres)
// Baseado na BNCC e currículos estaduais brasileiros
export const CURRICULO_FISICA: Record<string, Record<number, { tema: string; subtema: string; bimestre: number }>> = {
  // ═══════════════════════════════════════════════════════════
  // 1ª SÉRIE DO ENSINO MÉDIO
  // ═══════════════════════════════════════════════════════════
  "1EM": {
    // 1º BIMESTRE - Cinemática
    1: { tema: "Cinemática", subtema: "Conceitos de movimento, referencial, posição e deslocamento", bimestre: 1 },
    2: { tema: "Cinemática", subtema: "Velocidade média e instantânea", bimestre: 1 },
    3: { tema: "Cinemática", subtema: "MRU - Movimento Retilíneo Uniforme, função horária", bimestre: 1 },
    4: { tema: "Cinemática", subtema: "Gráficos do MRU (posição x tempo, velocidade x tempo)", bimestre: 1 },
    5: { tema: "Cinemática", subtema: "Aceleração média e instantânea", bimestre: 1 },
    6: { tema: "Cinemática", subtema: "MRUV - Movimento uniformemente variado", bimestre: 1 },
    7: { tema: "Cinemática", subtema: "Funções horárias do MRUV", bimestre: 1 },
    8: { tema: "Cinemática", subtema: "Gráficos do MRUV", bimestre: 1 },
    9: { tema: "Cinemática", subtema: "Queda livre", bimestre: 1 },
    10: { tema: "Cinemática", subtema: "Lançamento vertical para cima e para baixo", bimestre: 1 },

    // 2º BIMESTRE - Vetores e Dinâmica
    11: { tema: "Vetores", subtema: "Grandezas escalares e vetoriais", bimestre: 2 },
    12: { tema: "Vetores", subtema: "Soma e subtração de vetores", bimestre: 2 },
    13: { tema: "Cinemática Vetorial", subtema: "Lançamento horizontal", bimestre: 2 },
    14: { tema: "Cinemática Vetorial", subtema: "Lançamento oblíquo", bimestre: 2 },
    15: { tema: "Dinâmica", subtema: "Conceito de força, tipos de força", bimestre: 2 },
    16: { tema: "Dinâmica", subtema: "Primeira Lei de Newton - Inércia", bimestre: 2 },
    17: { tema: "Dinâmica", subtema: "Segunda Lei de Newton - F = m.a", bimestre: 2 },
    18: { tema: "Dinâmica", subtema: "Terceira Lei de Newton - Ação e Reação", bimestre: 2 },
    19: { tema: "Dinâmica", subtema: "Força Peso e Normal", bimestre: 2 },
    20: { tema: "Dinâmica", subtema: "Força de Atrito estático e cinético", bimestre: 2 },

    // 3º BIMESTRE - Trabalho e Energia
    21: { tema: "Dinâmica", subtema: "Força elástica e Lei de Hooke", bimestre: 3 },
    22: { tema: "Dinâmica", subtema: "Aplicações das Leis de Newton - Plano inclinado", bimestre: 3 },
    23: { tema: "Dinâmica", subtema: "Força resultante e equilíbrio", bimestre: 3 },
    24: { tema: "Trabalho", subtema: "Conceito de trabalho de uma força", bimestre: 3 },
    25: { tema: "Trabalho", subtema: "Trabalho positivo, negativo e nulo", bimestre: 3 },
    26: { tema: "Energia", subtema: "Energia cinética e Teorema da Energia Cinética", bimestre: 3 },
    27: { tema: "Energia", subtema: "Energia potencial gravitacional", bimestre: 3 },
    28: { tema: "Energia", subtema: "Energia potencial elástica", bimestre: 3 },
    29: { tema: "Energia", subtema: "Conservação da energia mecânica", bimestre: 3 },
    30: { tema: "Energia", subtema: "Potência e rendimento", bimestre: 3 },

    // 4º BIMESTRE - Quantidade de Movimento e Gravitação
    31: { tema: "Impulso e Quantidade de Movimento", subtema: "Impulso de uma força", bimestre: 4 },
    32: { tema: "Impulso e Quantidade de Movimento", subtema: "Quantidade de movimento (momento linear)", bimestre: 4 },
    33: { tema: "Impulso e Quantidade de Movimento", subtema: "Conservação da quantidade de movimento", bimestre: 4 },
    34: { tema: "Colisões", subtema: "Colisões elásticas e inelásticas", bimestre: 4 },
    35: { tema: "Gravitação", subtema: "Lei da Gravitação Universal", bimestre: 4 },
    36: { tema: "Gravitação", subtema: "Campo gravitacional e aceleração da gravidade", bimestre: 4 },
    37: { tema: "Gravitação", subtema: "Movimento de satélites", bimestre: 4 },
    38: { tema: "Estática", subtema: "Equilíbrio de um ponto material", bimestre: 4 },
    39: { tema: "Estática", subtema: "Momento de uma força (torque)", bimestre: 4 },
    40: { tema: "Estática", subtema: "Equilíbrio de corpo extenso", bimestre: 4 },
  },

  // ═══════════════════════════════════════════════════════════
  // 2ª SÉRIE DO ENSINO MÉDIO
  // ═══════════════════════════════════════════════════════════
  "2EM": {
    // 1º BIMESTRE - Termologia
    1: { tema: "Termologia", subtema: "Temperatura e escalas termométricas (Celsius, Fahrenheit, Kelvin)", bimestre: 1 },
    2: { tema: "Termologia", subtema: "Conversão entre escalas termométricas", bimestre: 1 },
    3: { tema: "Termologia", subtema: "Dilatação térmica linear", bimestre: 1 },
    4: { tema: "Termologia", subtema: "Dilatação térmica superficial e volumétrica", bimestre: 1 },
    5: { tema: "Calorimetria", subtema: "Conceito de calor e equilíbrio térmico", bimestre: 1 },
    6: { tema: "Calorimetria", subtema: "Calor sensível e capacidade térmica", bimestre: 1 },
    7: { tema: "Calorimetria", subtema: "Calor específico e calorímetro", bimestre: 1 },
    8: { tema: "Calorimetria", subtema: "Calor latente e mudanças de fase", bimestre: 1 },
    9: { tema: "Calorimetria", subtema: "Diagrama de fases", bimestre: 1 },
    10: { tema: "Propagação de Calor", subtema: "Condução, convecção e irradiação", bimestre: 1 },

    // 2º BIMESTRE - Termodinâmica e Gases
    11: { tema: "Gases", subtema: "Teoria cinética dos gases", bimestre: 2 },
    12: { tema: "Gases", subtema: "Transformações isotérmicas", bimestre: 2 },
    13: { tema: "Gases", subtema: "Transformações isobáricas", bimestre: 2 },
    14: { tema: "Gases", subtema: "Transformações isocóricas (isovolumétricas)", bimestre: 2 },
    15: { tema: "Gases", subtema: "Equação geral dos gases perfeitos", bimestre: 2 },
    16: { tema: "Termodinâmica", subtema: "Energia interna de um gás", bimestre: 2 },
    17: { tema: "Termodinâmica", subtema: "Trabalho em transformações gasosas", bimestre: 2 },
    18: { tema: "Termodinâmica", subtema: "Primeira Lei da Termodinâmica", bimestre: 2 },
    19: { tema: "Termodinâmica", subtema: "Segunda Lei da Termodinâmica", bimestre: 2 },
    20: { tema: "Termodinâmica", subtema: "Máquinas térmicas e rendimento", bimestre: 2 },

    // 3º BIMESTRE - Óptica
    21: { tema: "Óptica Geométrica", subtema: "Luz: fontes, propagação retilínea, velocidade", bimestre: 3 },
    22: { tema: "Óptica Geométrica", subtema: "Sombra, penumbra e eclipses", bimestre: 3 },
    23: { tema: "Óptica Geométrica", subtema: "Reflexão da luz - Leis da reflexão", bimestre: 3 },
    24: { tema: "Óptica Geométrica", subtema: "Espelhos planos e imagens", bimestre: 3 },
    25: { tema: "Óptica Geométrica", subtema: "Espelhos esféricos côncavos e convexos", bimestre: 3 },
    26: { tema: "Óptica Geométrica", subtema: "Equação dos espelhos esféricos", bimestre: 3 },
    27: { tema: "Óptica Geométrica", subtema: "Refração da luz - Índice de refração", bimestre: 3 },
    28: { tema: "Óptica Geométrica", subtema: "Leis de Snell-Descartes", bimestre: 3 },
    29: { tema: "Óptica Geométrica", subtema: "Reflexão total e ângulo crítico", bimestre: 3 },
    30: { tema: "Óptica Geométrica", subtema: "Lentes esféricas - Tipos e imagens", bimestre: 3 },

    // 4º BIMESTRE - Ondas
    31: { tema: "Óptica Geométrica", subtema: "Equação das lentes e vergência (dioptrias)", bimestre: 4 },
    32: { tema: "Óptica Geométrica", subtema: "Instrumentos ópticos (lupa, microscópio, olho humano)", bimestre: 4 },
    33: { tema: "Ondas", subtema: "Conceito de onda, tipos de ondas", bimestre: 4 },
    34: { tema: "Ondas", subtema: "Grandezas das ondas (período, frequência, comprimento)", bimestre: 4 },
    35: { tema: "Ondas", subtema: "Velocidade de propagação das ondas", bimestre: 4 },
    36: { tema: "Ondas", subtema: "Fenômenos ondulatórios: reflexão e refração", bimestre: 4 },
    37: { tema: "Ondas", subtema: "Fenômenos ondulatórios: difração e interferência", bimestre: 4 },
    38: { tema: "Ondas Sonoras", subtema: "Som: produção, propagação e velocidade", bimestre: 4 },
    39: { tema: "Ondas Sonoras", subtema: "Qualidades do som: altura, intensidade e timbre", bimestre: 4 },
    40: { tema: "Ondas Sonoras", subtema: "Efeito Doppler e aplicações", bimestre: 4 },
  },

  // ═══════════════════════════════════════════════════════════
  // 3ª SÉRIE DO ENSINO MÉDIO
  // ═══════════════════════════════════════════════════════════
  "3EM": {
    // 1º BIMESTRE - Eletrostática
    1: { tema: "Eletrostática", subtema: "Carga elétrica e estrutura atômica", bimestre: 1 },
    2: { tema: "Eletrostática", subtema: "Processos de eletrização (atrito, contato, indução)", bimestre: 1 },
    3: { tema: "Eletrostática", subtema: "Condutores e isolantes elétricos", bimestre: 1 },
    4: { tema: "Eletrostática", subtema: "Lei de Coulomb", bimestre: 1 },
    5: { tema: "Eletrostática", subtema: "Campo elétrico - Conceito e linhas de força", bimestre: 1 },
    6: { tema: "Eletrostática", subtema: "Campo elétrico de cargas pontuais", bimestre: 1 },
    7: { tema: "Eletrostática", subtema: "Potencial elétrico", bimestre: 1 },
    8: { tema: "Eletrostática", subtema: "Diferença de potencial (ddp) e trabalho elétrico", bimestre: 1 },
    9: { tema: "Eletrostática", subtema: "Superfícies equipotenciais", bimestre: 1 },
    10: { tema: "Eletrostática", subtema: "Capacitores e capacitância", bimestre: 1 },

    // 2º BIMESTRE - Eletrodinâmica
    11: { tema: "Eletrodinâmica", subtema: "Corrente elétrica e intensidade", bimestre: 2 },
    12: { tema: "Eletrodinâmica", subtema: "Resistência elétrica e Lei de Ohm", bimestre: 2 },
    13: { tema: "Eletrodinâmica", subtema: "Resistores: associação em série", bimestre: 2 },
    14: { tema: "Eletrodinâmica", subtema: "Resistores: associação em paralelo", bimestre: 2 },
    15: { tema: "Eletrodinâmica", subtema: "Associação mista de resistores", bimestre: 2 },
    16: { tema: "Eletrodinâmica", subtema: "Potência elétrica", bimestre: 2 },
    17: { tema: "Eletrodinâmica", subtema: "Energia elétrica e consumo (kWh)", bimestre: 2 },
    18: { tema: "Eletrodinâmica", subtema: "Geradores elétricos e força eletromotriz", bimestre: 2 },
    19: { tema: "Eletrodinâmica", subtema: "Receptores elétricos e força contraeletromotriz", bimestre: 2 },
    20: { tema: "Eletrodinâmica", subtema: "Leis de Kirchhoff", bimestre: 2 },

    // 3º BIMESTRE - Magnetismo e Eletromagnetismo
    21: { tema: "Magnetismo", subtema: "Ímãs e campo magnético", bimestre: 3 },
    22: { tema: "Magnetismo", subtema: "Campo magnético terrestre", bimestre: 3 },
    23: { tema: "Eletromagnetismo", subtema: "Experiência de Oersted - corrente e campo magnético", bimestre: 3 },
    24: { tema: "Eletromagnetismo", subtema: "Campo magnético de fios retilíneos", bimestre: 3 },
    25: { tema: "Eletromagnetismo", subtema: "Campo magnético de espiras e solenoides", bimestre: 3 },
    26: { tema: "Eletromagnetismo", subtema: "Força magnética sobre cargas em movimento", bimestre: 3 },
    27: { tema: "Eletromagnetismo", subtema: "Força magnética sobre condutores", bimestre: 3 },
    28: { tema: "Eletromagnetismo", subtema: "Indução eletromagnética - Lei de Faraday", bimestre: 3 },
    29: { tema: "Eletromagnetismo", subtema: "Lei de Lenz", bimestre: 3 },
    30: { tema: "Eletromagnetismo", subtema: "Transformadores e transmissão de energia", bimestre: 3 },

    // 4º BIMESTRE - Física Moderna
    31: { tema: "Ondas Eletromagnéticas", subtema: "Espectro eletromagnético", bimestre: 4 },
    32: { tema: "Ondas Eletromagnéticas", subtema: "Ondas de rádio, micro-ondas e infravermelho", bimestre: 4 },
    33: { tema: "Ondas Eletromagnéticas", subtema: "Luz visível, ultravioleta, raios X e gama", bimestre: 4 },
    34: { tema: "Física Moderna", subtema: "Radiação de corpo negro e quantização", bimestre: 4 },
    35: { tema: "Física Moderna", subtema: "Efeito fotoelétrico", bimestre: 4 },
    36: { tema: "Física Moderna", subtema: "Modelo atômico de Bohr", bimestre: 4 },
    37: { tema: "Física Moderna", subtema: "Dualidade onda-partícula", bimestre: 4 },
    38: { tema: "Física Moderna", subtema: "Relatividade especial - dilatação temporal", bimestre: 4 },
    39: { tema: "Física Moderna", subtema: "Relatividade especial - contração do espaço, E=mc²", bimestre: 4 },
    40: { tema: "Física Nuclear", subtema: "Radioatividade e reações nucleares", bimestre: 4 },
  }
}

export interface QuestaoGerada {
  tipo_questao: string
  contexto: string
  enunciado: string
  alternativas: { A: string; B: string; C: string; D: string; E: string }
  resposta_correta: string
  dica: string
  feedback: string
}

interface RespostaGeminiQuestoes {
  questoes: QuestaoGerada[]
}

/**
 * Gera questões de física usando a API do Gemini
 * Sistema sob demanda com fallback para múltiplos modelos
 */
export async function gerarQuestoesComGemini(
  serie: string,
  semana: number,
  quantidade: number = 5
): Promise<QuestaoGerada[]> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('[Gemini] GEMINI_API_KEY não configurada')
    throw new Error('API do Gemini não configurada')
  }

  // Buscar conteúdo do currículo para a série específica
  const curriculoSerie = CURRICULO_FISICA[serie]
  if (!curriculoSerie) {
    throw new Error(`Série ${serie} não encontrada no currículo`)
  }

  let conteudo = curriculoSerie[semana]
  if (!conteudo) {
    // Se a semana não existe, usa a última semana disponível
    const semanaFallback = Math.min(semana, 40)
    conteudo = curriculoSerie[semanaFallback] || curriculoSerie[1]
    console.log(`[Gemini] Semana ${semana} não encontrada para ${serie}, usando semana ${semanaFallback}`)
  }

  const { tema, subtema, bimestre } = conteudo
  const serieNumero = serie[0] // "1", "2" ou "3"

  const promptQuestoes = `Você é um professor de Física especialista em criar questões para estudantes do Ensino Médio de escolas públicas brasileiras.

INFORMAÇÕES DA SÉRIE E PERÍODO:
- Série: ${serieNumero}ª série do Ensino Médio (${serie})
- Bimestre: ${bimestre}º bimestre
- Semana: ${semana} de 40
- Tema principal: ${tema}
- Subtema específico: ${subtema}

IMPORTANTE - ADEQUAÇÃO AO NÍVEL:
${serieNumero === '1' ? `
- Alunos do 1º ano estão iniciando a Física do Ensino Médio
- Foque em conceitos fundamentais e aplicações simples
- Evite cálculos muito complexos
- Use muitas analogias com o cotidiano
- Temas típicos: Cinemática, Dinâmica (Leis de Newton), Trabalho e Energia` : ''}
${serieNumero === '2' ? `
- Alunos do 2º ano já têm base de mecânica
- Pode exigir mais cálculos e análises
- Conecte com fenômenos do dia a dia (calor, luz, som)
- Temas típicos: Termologia, Calorimetria, Óptica, Ondas` : ''}
${serieNumero === '3' ? `
- Alunos do 3º ano estão se preparando para ENEM e vestibulares
- Pode usar questões mais elaboradas
- Conecte com tecnologia moderna (eletricidade, magnetismo)
- Temas típicos: Eletrostática, Eletrodinâmica, Eletromagnetismo, Física Moderna` : ''}

Crie ${quantidade} questões de Física sobre "${tema}" - "${subtema}".

REGRAS OBRIGATÓRIAS:
1. As questões devem ser EXCLUSIVAMENTE sobre o conteúdo do ${serieNumero}º ano
2. NÃO use conteúdos de outras séries
3. Use contextos do cotidiano de estudantes brasileiros de escola pública
4. Cada questão deve ter 5 alternativas (A, B, C, D, E)
5. As alternativas erradas devem ser PLAUSÍVEIS (baseadas em erros comuns)
6. Inclua uma DICA que ajude sem revelar a resposta
7. Inclua um FEEDBACK explicativo completo

TIPOS DE QUESTÃO (varie entre eles):
- conceitual: Compreensão sem cálculos
- calculo_direto: Aplicação de fórmula
- situacao_problema: Problema contextualizado
- analise_fenomeno: Explicar por que algo acontece
- comparacao: Comparar situações ou grandezas

Retorne APENAS um JSON válido no formato (sem markdown, sem texto adicional):
{
  "questoes": [
    {
      "tipo_questao": "conceitual",
      "contexto": "Cotidiano - Transporte",
      "enunciado": "Um ônibus escolar...",
      "alternativas": {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."},
      "resposta_correta": "A",
      "dica": "Lembre-se que...",
      "feedback": "A resposta correta é A porque..."
    }
  ]
}`

  // Tentar diferentes modelos
  const modelosQuestoes = [
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ]

  for (const modelo of modelosQuestoes) {
    try {
      console.log(`[Gemini] Gerando questões com ${modelo}...`)

      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: modelo })

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: promptQuestoes }] }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      })

      let text = result.response.text()

      if (!text) {
        console.error(`[Gemini] Resposta vazia de ${modelo}`)
        continue
      }

      // Limpar markdown se presente
      if (text.startsWith('```')) {
        const parts = text.split('```')
        text = parts[1] || parts[0]
        if (text.startsWith('json')) {
          text = text.substring(4)
        }
      }

      const dados: RespostaGeminiQuestoes = JSON.parse(text.trim())

      if (dados.questoes && dados.questoes.length > 0) {
        console.log(`[Gemini] ${dados.questoes.length} questões geradas com ${modelo}`)
        return dados.questoes
      }
    } catch (error) {
      console.error(`[Gemini] Erro com ${modelo}:`, error)
      continue
    }
  }

  throw new Error('Falha ao gerar questões com todos os modelos tentados')
}

/**
 * Verifica se há questões em cache (no banco) para a série/semana
 * Questões são organizadas por serie/semana/ano_letivo, não por trilha_id
 */
export async function verificarCacheQuestoes(
  supabase: any,
  serie: string,
  semana: number,
  _trilhaId: string = 'passar_ano' // Não usado - questões são por serie/semana
): Promise<number> {
  const anoLetivo = new Date().getFullYear()

  const { count, error } = await supabase
    .from('questoes_trilha')
    .select('*', { count: 'exact', head: true })
    .eq('serie', serie)
    .eq('semana', semana)
    .eq('ano_letivo', anoLetivo)
    .eq('ativa', true)

  if (error) {
    console.error('[Cache] Erro ao verificar cache:', error.message || error)
    return 0
  }

  return count || 0
}

// Mapeia contexto do Gemini para valores válidos do banco
function mapearContextoCotidiano(contexto: string): string {
  const lower = contexto.toLowerCase()
  if (lower.includes('transporte') || lower.includes('ônibus') || lower.includes('carro')) return 'transporte'
  if (lower.includes('casa') || lower.includes('família') || lower.includes('lar')) return 'casa_familia'
  if (lower.includes('escola') || lower.includes('sala') || lower.includes('aula')) return 'escola'
  if (lower.includes('rua') || lower.includes('bairro') || lower.includes('cidade')) return 'rua_bairro'
  if (lower.includes('corpo') || lower.includes('saúde') || lower.includes('saude')) return 'corpo_saude'
  if (lower.includes('celular') || lower.includes('tecnologia') || lower.includes('lazer') || lower.includes('jogo')) return 'lazer_tecnologia'
  if (lower.includes('trabalho') || lower.includes('profiss')) return 'trabalho_profissoes'
  return 'todos'
}

// Mapeia tipo de questão para valores válidos do banco
function mapearTipoQuestao(tipo: string): string {
  const tiposValidos = ['conceitual', 'calculo_direto', 'interpretacao_grafico', 'situacao_problema', 'analise_fenomeno', 'comparacao', 'olimpiada']
  const tipoLower = tipo.toLowerCase().replace(/_/g, '_')
  if (tiposValidos.includes(tipoLower)) return tipoLower
  if (tipo.includes('calculo') || tipo.includes('cálculo')) return 'calculo_direto'
  if (tipo.includes('situacao') || tipo.includes('situação') || tipo.includes('problema')) return 'situacao_problema'
  if (tipo.includes('analise') || tipo.includes('análise') || tipo.includes('fenomeno') || tipo.includes('fenômeno')) return 'analise_fenomeno'
  if (tipo.includes('comparacao') || tipo.includes('comparação')) return 'comparacao'
  return 'conceitual'
}

/**
 * Salva questões geradas no banco de dados (cache)
 * Schema: id é BIGSERIAL (auto-gerado), usa contexto_cotidiano, ano_letivo é obrigatório
 */
export async function salvarQuestoesNoCache(
  supabase: any,
  questoes: QuestaoGerada[],
  serie: string,
  semana: number,
  _trilhaId: string = 'passar_ano' // Não usado - questões são por serie/semana
): Promise<number> {
  const conteudo = CURRICULO_FISICA[serie]?.[semana] || CURRICULO_FISICA[serie]?.[1]
  const anoLetivo = new Date().getFullYear()
  let salvas = 0

  for (let i = 0; i < questoes.length; i++) {
    const q = questoes[i]

    // Preparar dados conforme schema do banco
    const dados = {
      serie: serie,
      semana: semana,
      ano_letivo: anoLetivo,
      ordem: i + 1,
      tema: conteudo?.tema || 'Física',
      subtema: conteudo?.subtema || '',
      tipo_questao: mapearTipoQuestao(q.tipo_questao),
      contexto_cotidiano: mapearContextoCotidiano(q.contexto),
      enunciado: q.enunciado,
      alternativas: q.alternativas,
      resposta_correta: q.resposta_correta,
      dica: q.dica,
      feedback: {
        explicacao_correta: q.feedback,
        erros_comuns: {},
        conexao_cotidiano: '',
        curiosidade: ''
      },
      dificuldade: 'medio',
      ativa: true
    }

    const { error } = await supabase
      .from('questoes_trilha')
      .insert(dados)

    if (error) {
      console.error(`[Cache] Erro ao salvar questão ${i + 1}:`, error.message || error)
    } else {
      salvas++
      console.log(`[Cache] Questão ${i + 1} salva para ${serie} semana ${semana}`)
    }
  }

  return salvas
}
