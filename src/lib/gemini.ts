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
// TIMEOUT PARA CHAMADAS GEMINI
// ═══════════════════════════════════════════════════════════
const GEMINI_TIMEOUT_MS = 30_000

function comTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[Timeout] ${label} excedeu ${ms / 1000}s`))
    }, ms)
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer))
  })
}

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO DO CLIENTE GEMINI
// ═══════════════════════════════════════════════════════════

// Gemma 3 27B - modelo gratuito via Google AI Studio com suporte multimodal
const MODELO_GEMINI = 'gemma-3-27b-it'

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
const PROMPT_BASE_PEDAGOGICO = `FORMATACAO DE FORMULAS E EQUACOES:
- Use notacao LaTeX para TODAS as formulas, equacoes e simbolos matematicos/cientificos
- Para formulas inline (dentro do texto), use cifrão simples: $E = mc^2$
- Para formulas em bloco (destaque), use cifrão duplo: $$F = m \\cdot a$$
- Exemplos: $v = v_0 + at$, $\\Delta s = v_0 t + \\frac{1}{2}at^2$, $\\vec{F} = m\\vec{a}$
- Use \\frac{}{} para fracoes, \\sqrt{} para raizes, \\vec{} para vetores
- Use \\int para integrais, \\sum para somatorios, \\lim para limites
- Use **negrito** para destacar conceitos importantes
- Use listas com - ou 1. para organizar passos

PRINCIPIOS PEDAGOGICOS (baseados em neurociencia):

1. CARGA COGNITIVA: Apresente uma ideia por vez. Respostas curtas e focadas.

2. RECUPERACAO ATIVA: Em vez de explicar tudo, faca perguntas que facam o estudante pensar.
   Exemplo: "O que voce ja tentou fazer?" ou "O que voce ja sabe sobre isso?"

3. ELABORACAO: Conecte novos conceitos com conhecimento previo.

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

RESOLUCAO DE QUESTOES E IMAGENS:
- Quando o estudante enviar uma IMAGEM de questao, prova ou exercicio: RESOLVA a questao completa
- Apresente a RESPOSTA CORRETA (gabarito) de forma clara e destacada
- Mostre a resolucao PASSO A PASSO com justificativa
- Se for questao de multipla escolha, indique a alternativa correta (ex: "Resposta: Letra B")
- Explique POR QUE as outras alternativas estao erradas, se relevante

PROIBIDO:
- "Vou te explicar de forma simples"
- Repetir nome do estudante varias vezes
- Frases motivacionais genericas
- Emojis
- Comecar com "Ola!" em respostas subsequentes

AO FINAL DE CADA RESPOSTA, sugira 2 a 3 perguntas de acompanhamento que o estudante poderia fazer, no formato:
[SUGESTOES]
- Texto da sugestao 1
- Texto da sugestao 2
- Texto da sugestao 3
[/SUGESTOES]`

const TUTORES: Record<string, { nome: string; emoji: string; system: string }> = {
  fisica: {
    nome: 'Newton',
    emoji: '',
    system: `Voce e Newton, tutor de Fisica para estudantes brasileiros do Ensino Medio.

Voce tambem pode ajudar com QUALQUER disciplina escolar (Matematica, Quimica, Biologia, Historia, Geografia, Portugues, Redacao, Ingles, Sociologia, Filosofia, Arte, Educacao Fisica e outras) quando o estudante perguntar. Adapte seu conhecimento a disciplina da pergunta.

${PROMPT_BASE_PEDAGOGICO}

TEMAS PRINCIPAIS: Cinematica, Dinamica, Energia, Termodinamica, Optica, Ondas, Eletricidade, Magnetismo
OUTROS TEMAS: Qualquer disciplina do Ensino Fundamental ou Medio`,
  },
  matematica: {
    nome: 'Pitagoras',
    emoji: '',
    system: `Voce e Pitagoras, tutor de Matematica para estudantes brasileiros do 6o ano ao 3o EM.

Voce tambem pode ajudar com QUALQUER disciplina escolar (Fisica, Quimica, Biologia, Historia, Geografia, Portugues, Redacao, Ingles, Sociologia, Filosofia, Arte, Educacao Fisica e outras) quando o estudante perguntar. Adapte seu conhecimento a disciplina da pergunta.

${PROMPT_BASE_PEDAGOGICO}

TEMAS PRINCIPAIS: Funcoes, Geometria, Algebra, Trigonometria, Estatistica, Probabilidade, Aritmetica
OUTROS TEMAS: Qualquer disciplina do Ensino Fundamental ou Medio`,
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
  imagemBase64?: string,
  systemInstruction?: string
): Promise<{ sucesso: boolean; resposta?: string; erro?: string }> {
  try {
    const genAI = getGenAI()
    const modelConfig: { model: string; systemInstruction?: string } = { model: nomeModelo }

    // Usar systemInstruction nativa da API para melhor separação de contexto
    if (systemInstruction) {
      modelConfig.systemInstruction = systemInstruction
    }

    const model = genAI.getGenerativeModel(modelConfig)

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

    const result = await comTimeout(
      model.generateContent(conteudo),
      GEMINI_TIMEOUT_MS,
      `Gemini ${nomeModelo}`
    )
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

  // Incluir preferências de estudo no contexto
  if (contexto.preferencias) {
    const pref = contexto.preferencias
    const prefParts: string[] = []
    if (pref.usarAnalogias) prefParts.push('use analogias com o dia-a-dia')
    if (pref.usarFormulas) prefParts.push('inclua formulas matematicas')
    if (!pref.usarFormulas) prefParts.push('evite formulas quando possivel, prefira explicacao conceitual')
    if (pref.usarExemplos) prefParts.push('de exemplos praticos')
    if (pref.preferePasso) prefParts.push('prefere resolucoes passo a passo')
    if (pref.nivelDetalhe === 'minimo') prefParts.push('respostas curtas e diretas')
    if (pref.nivelDetalhe === 'maximo') prefParts.push('respostas detalhadas e completas')
    if (pref.tomConversa === 'formal') prefParts.push('tom formal e academico')
    if (pref.tomConversa === 'descontraido') prefParts.push('tom descontraido e informal')
    if (prefParts.length > 0) {
      parteContexto.push(`Preferencias de estudo: ${prefParts.join(', ')}`)
    }
  }

  // Incluir ritmo/velocidade se disponível
  if (contexto.preferencias?.velocidade) {
    const vel = contexto.preferencias.velocidade
    if (vel === 'lento') parteContexto.push('Ritmo: devagar, explicar cada detalhe')
    if (vel === 'rapido') parteContexto.push('Ritmo: rapido, ir direto ao essencial')
  }

  const contextoEstudante = parteContexto.length > 0
    ? `\nCONTEXTO DO ESTUDANTE (use para adaptar sua resposta. Se o estudante perguntar sobre seu desempenho, acertos, progresso ou conquistas, pode mencionar esses dados diretamente de forma natural):\n${parteContexto.join('\n')}\n`
    : ''

  // ═══════════════════════════════════════════════════════════
  // PROMPT COMPLETO COM MODO ESPECÍFICO
  // ═══════════════════════════════════════════════════════════

  // Instrução especial se tiver imagem
  const instrucaoImagem = imagemBase64
    ? `\n\n[O estudante enviou uma IMAGEM junto com a mensagem. Analise a imagem cuidadosamente:
- Se for uma QUESTAO ou EXERCICIO: RESOLVA completamente, mostre o passo a passo e indique a RESPOSTA CORRETA (gabarito). Se for multipla escolha, diga qual letra e a correta.
- Se for um GRAFICO, TABELA ou DIAGRAMA: interprete e explique o conteudo.
- Se for qualquer outro conteudo educacional: ajude o estudante com base no que esta na imagem.
A imagem pode ser de QUALQUER disciplina escolar - adapte sua resposta ao conteudo.]\n`
    : ''

  // Separar system instruction (identidade + regras) do prompt do usuário
  const systemInstruction = `${tutor.system}
${contextoEstudante}
${promptModo ? `\n${promptModo}\n` : ''}`

  // Prompt do usuário contém apenas histórico + mensagem atual
  const prompt = `${instrucaoImagem}${historicoTexto ? `HISTORICO DA CONVERSA:\n${historicoTexto}\n\n` : ''}Estudante: ${mensagem}

${tutor.nome}:`

  // Se temos um modelo que já funcionou antes, tentar ele primeiro
  const modelosParaTentar = modeloFuncionando
    ? [modeloFuncionando, ...MODELOS_DISPONIVEIS.filter(m => m !== modeloFuncionando)]
    : [...MODELOS_DISPONIVEIS]

  console.log('[Gemini] Iniciando tentativas com modelos:', modelosParaTentar)

  // Tentar cada modelo em ordem
  for (const nomeModelo of modelosParaTentar) {
    console.log(`[Gemini] Tentando modelo: ${nomeModelo}${imagemBase64 ? ' (com imagem)' : ''}`)

    const resultado = await testarModelo(nomeModelo, prompt, imagemBase64, systemInstruction)

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

// ═══════════════════════════════════════════════════════════
// CURRÍCULO DE MATEMÁTICA - ENSINO FUNDAMENTAL (6º ao 9º ano)
// Baseado na BNCC e currículos estaduais brasileiros
// 4 alternativas (A, B, C, D) - diferente do EM que tem 5
// ═══════════════════════════════════════════════════════════
export const CURRICULO_MATEMATICA: Record<string, Record<number, { tema: string; subtema: string; bimestre: number }>> = {
  // ═══════════════════════════════════════════════════════════
  // 6º ANO DO ENSINO FUNDAMENTAL
  // ═══════════════════════════════════════════════════════════
  "6EF": {
    // 1º BIMESTRE - Números e Operações
    1: { tema: "Números Naturais", subtema: "Sistema de numeração decimal: leitura, escrita e comparação", bimestre: 1 },
    2: { tema: "Números Naturais", subtema: "Operações fundamentais: adição e subtração", bimestre: 1 },
    3: { tema: "Números Naturais", subtema: "Operações fundamentais: multiplicação e divisão", bimestre: 1 },
    4: { tema: "Números Naturais", subtema: "Propriedades das operações (comutativa, associativa, distributiva)", bimestre: 1 },
    5: { tema: "Números Naturais", subtema: "Múltiplos e divisores de um número natural", bimestre: 1 },
    6: { tema: "Números Naturais", subtema: "Critérios de divisibilidade por 2, 3, 4, 5, 6, 9 e 10", bimestre: 1 },
    7: { tema: "Números Naturais", subtema: "Números primos e compostos", bimestre: 1 },
    8: { tema: "Números Naturais", subtema: "Decomposição em fatores primos", bimestre: 1 },
    9: { tema: "Números Naturais", subtema: "Máximo Divisor Comum (MDC)", bimestre: 1 },
    10: { tema: "Números Naturais", subtema: "Mínimo Múltiplo Comum (MMC)", bimestre: 1 },

    // 2º BIMESTRE - Frações e Decimais
    11: { tema: "Frações", subtema: "Conceito de fração como parte de um todo", bimestre: 2 },
    12: { tema: "Frações", subtema: "Frações próprias, impróprias e números mistos", bimestre: 2 },
    13: { tema: "Frações", subtema: "Frações equivalentes e simplificação", bimestre: 2 },
    14: { tema: "Frações", subtema: "Comparação e ordenação de frações", bimestre: 2 },
    15: { tema: "Frações", subtema: "Adição e subtração de frações com mesmo denominador", bimestre: 2 },
    16: { tema: "Frações", subtema: "Adição e subtração de frações com denominadores diferentes", bimestre: 2 },
    17: { tema: "Frações", subtema: "Multiplicação de frações", bimestre: 2 },
    18: { tema: "Frações", subtema: "Divisão de frações", bimestre: 2 },
    19: { tema: "Números Decimais", subtema: "Representação e leitura de números decimais", bimestre: 2 },
    20: { tema: "Números Decimais", subtema: "Operações com números decimais", bimestre: 2 },

    // 3º BIMESTRE - Geometria e Medidas
    21: { tema: "Geometria Plana", subtema: "Ponto, reta e plano - conceitos básicos", bimestre: 3 },
    22: { tema: "Geometria Plana", subtema: "Posições relativas de retas (paralelas e concorrentes)", bimestre: 3 },
    23: { tema: "Geometria Plana", subtema: "Ângulos: conceito, classificação e medida", bimestre: 3 },
    24: { tema: "Geometria Plana", subtema: "Polígonos: conceito e classificação", bimestre: 3 },
    25: { tema: "Geometria Plana", subtema: "Triângulos: classificação quanto aos lados e ângulos", bimestre: 3 },
    26: { tema: "Geometria Plana", subtema: "Quadriláteros: paralelogramos, retângulos, quadrados", bimestre: 3 },
    27: { tema: "Grandezas e Medidas", subtema: "Perímetro de polígonos", bimestre: 3 },
    28: { tema: "Grandezas e Medidas", subtema: "Área de retângulos e quadrados", bimestre: 3 },
    29: { tema: "Grandezas e Medidas", subtema: "Área de triângulos", bimestre: 3 },
    30: { tema: "Grandezas e Medidas", subtema: "Unidades de medida de comprimento e conversões", bimestre: 3 },

    // 4º BIMESTRE - Álgebra e Estatística
    31: { tema: "Grandezas e Medidas", subtema: "Unidades de medida de área e volume", bimestre: 4 },
    32: { tema: "Grandezas e Medidas", subtema: "Unidades de medida de massa e capacidade", bimestre: 4 },
    33: { tema: "Álgebra", subtema: "Expressões numéricas com números naturais", bimestre: 4 },
    34: { tema: "Álgebra", subtema: "Potenciação de números naturais", bimestre: 4 },
    35: { tema: "Álgebra", subtema: "Raiz quadrada de números naturais", bimestre: 4 },
    36: { tema: "Álgebra", subtema: "Sequências numéricas e padrões", bimestre: 4 },
    37: { tema: "Estatística", subtema: "Leitura e interpretação de tabelas", bimestre: 4 },
    38: { tema: "Estatística", subtema: "Leitura e interpretação de gráficos de barras e colunas", bimestre: 4 },
    39: { tema: "Estatística", subtema: "Média aritmética simples", bimestre: 4 },
    40: { tema: "Estatística", subtema: "Moda e mediana - conceitos básicos", bimestre: 4 },
  },

  // ═══════════════════════════════════════════════════════════
  // 7º ANO DO ENSINO FUNDAMENTAL
  // ═══════════════════════════════════════════════════════════
  "7EF": {
    // 1º BIMESTRE - Números Inteiros
    1: { tema: "Números Inteiros", subtema: "Conjunto dos números inteiros (Z) e representação na reta", bimestre: 1 },
    2: { tema: "Números Inteiros", subtema: "Comparação e ordenação de números inteiros", bimestre: 1 },
    3: { tema: "Números Inteiros", subtema: "Módulo ou valor absoluto de um número inteiro", bimestre: 1 },
    4: { tema: "Números Inteiros", subtema: "Adição de números inteiros", bimestre: 1 },
    5: { tema: "Números Inteiros", subtema: "Subtração de números inteiros", bimestre: 1 },
    6: { tema: "Números Inteiros", subtema: "Multiplicação de números inteiros (regra de sinais)", bimestre: 1 },
    7: { tema: "Números Inteiros", subtema: "Divisão de números inteiros", bimestre: 1 },
    8: { tema: "Números Inteiros", subtema: "Potenciação com base inteira", bimestre: 1 },
    9: { tema: "Números Inteiros", subtema: "Expressões numéricas com números inteiros", bimestre: 1 },
    10: { tema: "Números Racionais", subtema: "Conjunto dos números racionais (Q) e representações", bimestre: 1 },

    // 2º BIMESTRE - Números Racionais e Proporção
    11: { tema: "Números Racionais", subtema: "Operações com números racionais na forma fracionária", bimestre: 2 },
    12: { tema: "Números Racionais", subtema: "Operações com números racionais na forma decimal", bimestre: 2 },
    13: { tema: "Números Racionais", subtema: "Potenciação com expoentes inteiros", bimestre: 2 },
    14: { tema: "Razão e Proporção", subtema: "Razão entre duas grandezas", bimestre: 2 },
    15: { tema: "Razão e Proporção", subtema: "Proporção e propriedade fundamental", bimestre: 2 },
    16: { tema: "Razão e Proporção", subtema: "Grandezas diretamente proporcionais", bimestre: 2 },
    17: { tema: "Razão e Proporção", subtema: "Grandezas inversamente proporcionais", bimestre: 2 },
    18: { tema: "Razão e Proporção", subtema: "Regra de três simples direta", bimestre: 2 },
    19: { tema: "Razão e Proporção", subtema: "Regra de três simples inversa", bimestre: 2 },
    20: { tema: "Porcentagem", subtema: "Conceito de porcentagem e cálculos básicos", bimestre: 2 },

    // 3º BIMESTRE - Álgebra e Geometria
    21: { tema: "Porcentagem", subtema: "Acréscimos e descontos percentuais", bimestre: 3 },
    22: { tema: "Álgebra", subtema: "Linguagem algébrica: variáveis e expressões", bimestre: 3 },
    23: { tema: "Álgebra", subtema: "Valor numérico de uma expressão algébrica", bimestre: 3 },
    24: { tema: "Álgebra", subtema: "Monômios: conceito e operações", bimestre: 3 },
    25: { tema: "Equações", subtema: "Equação do 1º grau: conceito e resolução", bimestre: 3 },
    26: { tema: "Equações", subtema: "Resolução de problemas com equações do 1º grau", bimestre: 3 },
    27: { tema: "Geometria Plana", subtema: "Ângulos: complementares, suplementares e opostos pelo vértice", bimestre: 3 },
    28: { tema: "Geometria Plana", subtema: "Soma dos ângulos internos de um triângulo", bimestre: 3 },
    29: { tema: "Geometria Plana", subtema: "Construções geométricas básicas com régua e compasso", bimestre: 3 },
    30: { tema: "Geometria Plana", subtema: "Polígonos regulares e soma dos ângulos internos", bimestre: 3 },

    // 4º BIMESTRE - Geometria e Estatística
    31: { tema: "Geometria Plana", subtema: "Área de paralelogramos e trapézios", bimestre: 4 },
    32: { tema: "Geometria Plana", subtema: "Área de losango", bimestre: 4 },
    33: { tema: "Geometria Plana", subtema: "Circunferência e círculo: conceitos básicos", bimestre: 4 },
    34: { tema: "Geometria Plana", subtema: "Comprimento da circunferência", bimestre: 4 },
    35: { tema: "Geometria Plana", subtema: "Área do círculo", bimestre: 4 },
    36: { tema: "Estatística", subtema: "Pesquisa estatística: população e amostra", bimestre: 4 },
    37: { tema: "Estatística", subtema: "Gráficos de setores (pizza)", bimestre: 4 },
    38: { tema: "Estatística", subtema: "Média aritmética ponderada", bimestre: 4 },
    39: { tema: "Probabilidade", subtema: "Experimentos aleatórios e espaço amostral", bimestre: 4 },
    40: { tema: "Probabilidade", subtema: "Cálculo de probabilidades simples", bimestre: 4 },
  },

  // ═══════════════════════════════════════════════════════════
  // 8º ANO DO ENSINO FUNDAMENTAL
  // ═══════════════════════════════════════════════════════════
  "8EF": {
    // 1º BIMESTRE - Conjuntos Numéricos e Álgebra
    1: { tema: "Conjuntos Numéricos", subtema: "Revisão: naturais, inteiros e racionais", bimestre: 1 },
    2: { tema: "Conjuntos Numéricos", subtema: "Números irracionais e raízes não exatas", bimestre: 1 },
    3: { tema: "Conjuntos Numéricos", subtema: "Conjunto dos números reais (R)", bimestre: 1 },
    4: { tema: "Conjuntos Numéricos", subtema: "Representação de reais na reta numérica", bimestre: 1 },
    5: { tema: "Potenciação", subtema: "Propriedades da potenciação", bimestre: 1 },
    6: { tema: "Potenciação", subtema: "Notação científica", bimestre: 1 },
    7: { tema: "Radicais", subtema: "Raiz quadrada e raiz cúbica", bimestre: 1 },
    8: { tema: "Radicais", subtema: "Simplificação de radicais", bimestre: 1 },
    9: { tema: "Radicais", subtema: "Operações com radicais: adição e subtração", bimestre: 1 },
    10: { tema: "Radicais", subtema: "Operações com radicais: multiplicação e divisão", bimestre: 1 },

    // 2º BIMESTRE - Álgebra
    11: { tema: "Polinômios", subtema: "Expressões algébricas e polinômios", bimestre: 2 },
    12: { tema: "Polinômios", subtema: "Adição e subtração de polinômios", bimestre: 2 },
    13: { tema: "Polinômios", subtema: "Multiplicação de polinômios", bimestre: 2 },
    14: { tema: "Produtos Notáveis", subtema: "Quadrado da soma e da diferença", bimestre: 2 },
    15: { tema: "Produtos Notáveis", subtema: "Produto da soma pela diferença", bimestre: 2 },
    16: { tema: "Fatoração", subtema: "Fator comum em evidência", bimestre: 2 },
    17: { tema: "Fatoração", subtema: "Fatoração por agrupamento", bimestre: 2 },
    18: { tema: "Fatoração", subtema: "Fatoração de trinômio quadrado perfeito", bimestre: 2 },
    19: { tema: "Fatoração", subtema: "Fatoração da diferença de dois quadrados", bimestre: 2 },
    20: { tema: "Frações Algébricas", subtema: "Simplificação de frações algébricas", bimestre: 2 },

    // 3º BIMESTRE - Equações e Sistemas
    21: { tema: "Equações do 1º Grau", subtema: "Equações do 1º grau com uma incógnita", bimestre: 3 },
    22: { tema: "Equações do 1º Grau", subtema: "Problemas envolvendo equações do 1º grau", bimestre: 3 },
    23: { tema: "Inequações", subtema: "Inequações do 1º grau", bimestre: 3 },
    24: { tema: "Sistemas de Equações", subtema: "Sistema de equações do 1º grau: conceito", bimestre: 3 },
    25: { tema: "Sistemas de Equações", subtema: "Resolução por substituição", bimestre: 3 },
    26: { tema: "Sistemas de Equações", subtema: "Resolução por adição (eliminação)", bimestre: 3 },
    27: { tema: "Sistemas de Equações", subtema: "Resolução gráfica de sistemas", bimestre: 3 },
    28: { tema: "Sistemas de Equações", subtema: "Problemas envolvendo sistemas de equações", bimestre: 3 },
    29: { tema: "Geometria Plana", subtema: "Teorema de Tales", bimestre: 3 },
    30: { tema: "Geometria Plana", subtema: "Aplicações do Teorema de Tales", bimestre: 3 },

    // 4º BIMESTRE - Geometria e Estatística
    31: { tema: "Geometria Plana", subtema: "Semelhança de triângulos: conceito", bimestre: 4 },
    32: { tema: "Geometria Plana", subtema: "Casos de semelhança de triângulos", bimestre: 4 },
    33: { tema: "Geometria Plana", subtema: "Relações métricas no triângulo retângulo", bimestre: 4 },
    34: { tema: "Geometria Plana", subtema: "Teorema de Pitágoras", bimestre: 4 },
    35: { tema: "Geometria Plana", subtema: "Aplicações do Teorema de Pitágoras", bimestre: 4 },
    36: { tema: "Geometria Espacial", subtema: "Prismas: conceito e elementos", bimestre: 4 },
    37: { tema: "Geometria Espacial", subtema: "Volume de prismas", bimestre: 4 },
    38: { tema: "Geometria Espacial", subtema: "Cilindros: conceito e volume", bimestre: 4 },
    39: { tema: "Estatística", subtema: "Medidas de tendência central: média, moda e mediana", bimestre: 4 },
    40: { tema: "Estatística", subtema: "Análise de gráficos e infográficos", bimestre: 4 },
  },

  // ═══════════════════════════════════════════════════════════
  // 9º ANO DO ENSINO FUNDAMENTAL
  // ═══════════════════════════════════════════════════════════
  "9EF": {
    // 1º BIMESTRE - Potências e Radicais
    1: { tema: "Potenciação", subtema: "Revisão de potenciação e propriedades", bimestre: 1 },
    2: { tema: "Potenciação", subtema: "Potências com expoentes negativos", bimestre: 1 },
    3: { tema: "Potenciação", subtema: "Notação científica e ordens de grandeza", bimestre: 1 },
    4: { tema: "Radiciação", subtema: "Propriedades dos radicais", bimestre: 1 },
    5: { tema: "Radiciação", subtema: "Racionalização de denominadores", bimestre: 1 },
    6: { tema: "Conjuntos Numéricos", subtema: "Intervalos reais e representação gráfica", bimestre: 1 },
    7: { tema: "Funções", subtema: "Conceito de função: domínio, contradomínio e imagem", bimestre: 1 },
    8: { tema: "Funções", subtema: "Representação de funções: tabelas e gráficos", bimestre: 1 },
    9: { tema: "Funções", subtema: "Função afim: conceito e gráfico", bimestre: 1 },
    10: { tema: "Funções", subtema: "Coeficiente angular e linear da função afim", bimestre: 1 },

    // 2º BIMESTRE - Funções e Equações
    11: { tema: "Funções", subtema: "Zero da função afim", bimestre: 2 },
    12: { tema: "Funções", subtema: "Função afim crescente e decrescente", bimestre: 2 },
    13: { tema: "Funções", subtema: "Problemas envolvendo função afim", bimestre: 2 },
    14: { tema: "Equação do 2º Grau", subtema: "Equação do 2º grau: conceito e forma geral", bimestre: 2 },
    15: { tema: "Equação do 2º Grau", subtema: "Equações do 2º grau incompletas", bimestre: 2 },
    16: { tema: "Equação do 2º Grau", subtema: "Fórmula de Bhaskara", bimestre: 2 },
    17: { tema: "Equação do 2º Grau", subtema: "Discriminante e natureza das raízes", bimestre: 2 },
    18: { tema: "Equação do 2º Grau", subtema: "Relações de Girard (soma e produto das raízes)", bimestre: 2 },
    19: { tema: "Equação do 2º Grau", subtema: "Problemas envolvendo equações do 2º grau", bimestre: 2 },
    20: { tema: "Função Quadrática", subtema: "Função quadrática: conceito e gráfico (parábola)", bimestre: 2 },

    // 3º BIMESTRE - Função Quadrática e Trigonometria
    21: { tema: "Função Quadrática", subtema: "Vértice da parábola", bimestre: 3 },
    22: { tema: "Função Quadrática", subtema: "Zeros da função quadrática", bimestre: 3 },
    23: { tema: "Função Quadrática", subtema: "Estudo do sinal da função quadrática", bimestre: 3 },
    24: { tema: "Função Quadrática", subtema: "Problemas de máximo e mínimo", bimestre: 3 },
    25: { tema: "Trigonometria", subtema: "Razões trigonométricas no triângulo retângulo", bimestre: 3 },
    26: { tema: "Trigonometria", subtema: "Seno de um ângulo agudo", bimestre: 3 },
    27: { tema: "Trigonometria", subtema: "Cosseno de um ângulo agudo", bimestre: 3 },
    28: { tema: "Trigonometria", subtema: "Tangente de um ângulo agudo", bimestre: 3 },
    29: { tema: "Trigonometria", subtema: "Ângulos notáveis (30°, 45°, 60°)", bimestre: 3 },
    30: { tema: "Trigonometria", subtema: "Aplicações da trigonometria em problemas", bimestre: 3 },

    // 4º BIMESTRE - Geometria e Estatística
    31: { tema: "Geometria Espacial", subtema: "Pirâmides: conceito e elementos", bimestre: 4 },
    32: { tema: "Geometria Espacial", subtema: "Volume de pirâmides", bimestre: 4 },
    33: { tema: "Geometria Espacial", subtema: "Cones: conceito e volume", bimestre: 4 },
    34: { tema: "Geometria Espacial", subtema: "Esferas: conceito e volume", bimestre: 4 },
    35: { tema: "Geometria Espacial", subtema: "Área da superfície de sólidos", bimestre: 4 },
    36: { tema: "Estatística", subtema: "Variáveis quantitativas e qualitativas", bimestre: 4 },
    37: { tema: "Estatística", subtema: "Amplitude e desvio médio", bimestre: 4 },
    38: { tema: "Probabilidade", subtema: "Probabilidade de eventos independentes", bimestre: 4 },
    39: { tema: "Probabilidade", subtema: "Probabilidade condicional (introdução)", bimestre: 4 },
    40: { tema: "Probabilidade", subtema: "Aplicações de probabilidade em situações-problema", bimestre: 4 },
  },

  // ═══════════════════════════════════════════════════════════
  // 1ª SÉRIE DO ENSINO MÉDIO - MATEMÁTICA
  // ═══════════════════════════════════════════════════════════
  "1EM": {
    // 1º BIMESTRE - Conjuntos e Funções
    1: { tema: "Conjuntos", subtema: "Noção de conjunto, pertinência e inclusão", bimestre: 1 },
    2: { tema: "Conjuntos", subtema: "Operações com conjuntos: união, interseção e diferença", bimestre: 1 },
    3: { tema: "Conjuntos", subtema: "Conjuntos numéricos: N, Z, Q, I e R", bimestre: 1 },
    4: { tema: "Conjuntos", subtema: "Intervalos reais e representação na reta", bimestre: 1 },
    5: { tema: "Funções", subtema: "Conceito de função, domínio, contradomínio e imagem", bimestre: 1 },
    6: { tema: "Funções", subtema: "Representação de funções: diagrama, tabela e gráfico", bimestre: 1 },
    7: { tema: "Funções", subtema: "Função par, ímpar e periódica", bimestre: 1 },
    8: { tema: "Funções", subtema: "Função composta", bimestre: 1 },
    9: { tema: "Funções", subtema: "Função inversa", bimestre: 1 },
    10: { tema: "Função Afim", subtema: "Definição e gráfico da função afim", bimestre: 1 },

    // 2º BIMESTRE - Função Afim e Quadrática
    11: { tema: "Função Afim", subtema: "Coeficiente angular e linear", bimestre: 2 },
    12: { tema: "Função Afim", subtema: "Zero da função afim e interpretação gráfica", bimestre: 2 },
    13: { tema: "Função Afim", subtema: "Inequações do 1º grau", bimestre: 2 },
    14: { tema: "Função Afim", subtema: "Problemas envolvendo função afim", bimestre: 2 },
    15: { tema: "Função Quadrática", subtema: "Definição e forma geral f(x) = ax² + bx + c", bimestre: 2 },
    16: { tema: "Função Quadrática", subtema: "Gráfico da função quadrática (parábola)", bimestre: 2 },
    17: { tema: "Função Quadrática", subtema: "Vértice e eixo de simetria da parábola", bimestre: 2 },
    18: { tema: "Função Quadrática", subtema: "Zeros da função quadrática", bimestre: 2 },
    19: { tema: "Função Quadrática", subtema: "Estudo do sinal da função quadrática", bimestre: 2 },
    20: { tema: "Função Quadrática", subtema: "Problemas de máximo e mínimo", bimestre: 2 },

    // 3º BIMESTRE - Função Exponencial e Logarítmica
    21: { tema: "Função Exponencial", subtema: "Potências com expoentes reais", bimestre: 3 },
    22: { tema: "Função Exponencial", subtema: "Definição e gráfico da função exponencial", bimestre: 3 },
    23: { tema: "Função Exponencial", subtema: "Crescimento e decrescimento exponencial", bimestre: 3 },
    24: { tema: "Função Exponencial", subtema: "Equações exponenciais", bimestre: 3 },
    25: { tema: "Função Exponencial", subtema: "Aplicações: juros compostos e crescimento populacional", bimestre: 3 },
    26: { tema: "Logaritmos", subtema: "Definição de logaritmo e propriedades básicas", bimestre: 3 },
    27: { tema: "Logaritmos", subtema: "Propriedades operatórias dos logaritmos", bimestre: 3 },
    28: { tema: "Logaritmos", subtema: "Mudança de base", bimestre: 3 },
    29: { tema: "Função Logarítmica", subtema: "Definição e gráfico da função logarítmica", bimestre: 3 },
    30: { tema: "Função Logarítmica", subtema: "Equações logarítmicas", bimestre: 3 },

    // 4º BIMESTRE - Sequências e Progressões
    31: { tema: "Sequências", subtema: "Conceito de sequência numérica e lei de formação", bimestre: 4 },
    32: { tema: "Progressão Aritmética", subtema: "Definição e termo geral da PA", bimestre: 4 },
    33: { tema: "Progressão Aritmética", subtema: "Soma dos termos de uma PA", bimestre: 4 },
    34: { tema: "Progressão Aritmética", subtema: "Interpolação aritmética", bimestre: 4 },
    35: { tema: "Progressão Geométrica", subtema: "Definição e termo geral da PG", bimestre: 4 },
    36: { tema: "Progressão Geométrica", subtema: "Soma dos termos de uma PG finita", bimestre: 4 },
    37: { tema: "Progressão Geométrica", subtema: "Soma dos termos de uma PG infinita", bimestre: 4 },
    38: { tema: "Progressão Geométrica", subtema: "Interpolação geométrica", bimestre: 4 },
    39: { tema: "Matemática Financeira", subtema: "Juros simples e compostos", bimestre: 4 },
    40: { tema: "Matemática Financeira", subtema: "Aplicações de PA e PG em problemas financeiros", bimestre: 4 },
  },

  // ═══════════════════════════════════════════════════════════
  // 2ª SÉRIE DO ENSINO MÉDIO - MATEMÁTICA
  // ═══════════════════════════════════════════════════════════
  "2EM": {
    // 1º BIMESTRE - Trigonometria
    1: { tema: "Trigonometria", subtema: "Arcos e ângulos: unidades de medida (grau e radiano)", bimestre: 1 },
    2: { tema: "Trigonometria", subtema: "Circunferência trigonométrica", bimestre: 1 },
    3: { tema: "Trigonometria", subtema: "Seno e cosseno na circunferência trigonométrica", bimestre: 1 },
    4: { tema: "Trigonometria", subtema: "Tangente na circunferência trigonométrica", bimestre: 1 },
    5: { tema: "Trigonometria", subtema: "Relações trigonométricas fundamentais", bimestre: 1 },
    6: { tema: "Trigonometria", subtema: "Redução ao primeiro quadrante", bimestre: 1 },
    7: { tema: "Trigonometria", subtema: "Função seno: gráfico e propriedades", bimestre: 1 },
    8: { tema: "Trigonometria", subtema: "Função cosseno: gráfico e propriedades", bimestre: 1 },
    9: { tema: "Trigonometria", subtema: "Função tangente: gráfico e propriedades", bimestre: 1 },
    10: { tema: "Trigonometria", subtema: "Equações trigonométricas básicas", bimestre: 1 },

    // 2º BIMESTRE - Trigonometria e Matrizes
    11: { tema: "Trigonometria", subtema: "Adição e subtração de arcos", bimestre: 2 },
    12: { tema: "Trigonometria", subtema: "Arco duplo e arco metade", bimestre: 2 },
    13: { tema: "Trigonometria", subtema: "Transformações trigonométricas", bimestre: 2 },
    14: { tema: "Trigonometria", subtema: "Lei dos senos", bimestre: 2 },
    15: { tema: "Trigonometria", subtema: "Lei dos cossenos", bimestre: 2 },
    16: { tema: "Matrizes", subtema: "Definição e tipos de matrizes", bimestre: 2 },
    17: { tema: "Matrizes", subtema: "Operações com matrizes: soma e multiplicação por escalar", bimestre: 2 },
    18: { tema: "Matrizes", subtema: "Multiplicação de matrizes", bimestre: 2 },
    19: { tema: "Matrizes", subtema: "Matriz transposta e matriz inversa", bimestre: 2 },
    20: { tema: "Determinantes", subtema: "Determinante de ordem 2 e 3", bimestre: 2 },

    // 3º BIMESTRE - Sistemas Lineares e Geometria Analítica
    21: { tema: "Determinantes", subtema: "Propriedades dos determinantes", bimestre: 3 },
    22: { tema: "Sistemas Lineares", subtema: "Sistemas lineares 2x2 e 3x3", bimestre: 3 },
    23: { tema: "Sistemas Lineares", subtema: "Regra de Cramer", bimestre: 3 },
    24: { tema: "Sistemas Lineares", subtema: "Discussão de sistemas lineares", bimestre: 3 },
    25: { tema: "Geometria Analítica", subtema: "Ponto e distância entre pontos", bimestre: 3 },
    26: { tema: "Geometria Analítica", subtema: "Ponto médio de um segmento", bimestre: 3 },
    27: { tema: "Geometria Analítica", subtema: "Condição de alinhamento de três pontos", bimestre: 3 },
    28: { tema: "Geometria Analítica", subtema: "Equação geral da reta", bimestre: 3 },
    29: { tema: "Geometria Analítica", subtema: "Equação reduzida da reta", bimestre: 3 },
    30: { tema: "Geometria Analítica", subtema: "Coeficiente angular e inclinação da reta", bimestre: 3 },

    // 4º BIMESTRE - Geometria Analítica
    31: { tema: "Geometria Analítica", subtema: "Posições relativas de duas retas", bimestre: 4 },
    32: { tema: "Geometria Analítica", subtema: "Distância de ponto a reta", bimestre: 4 },
    33: { tema: "Geometria Analítica", subtema: "Área de triângulo por coordenadas", bimestre: 4 },
    34: { tema: "Circunferência", subtema: "Equação da circunferência", bimestre: 4 },
    35: { tema: "Circunferência", subtema: "Posições relativas ponto-circunferência", bimestre: 4 },
    36: { tema: "Circunferência", subtema: "Posições relativas reta-circunferência", bimestre: 4 },
    37: { tema: "Cônicas", subtema: "Elipse: definição e equação", bimestre: 4 },
    38: { tema: "Cônicas", subtema: "Hipérbole: definição e equação", bimestre: 4 },
    39: { tema: "Cônicas", subtema: "Parábola: definição e equação", bimestre: 4 },
    40: { tema: "Cônicas", subtema: "Aplicações das cônicas", bimestre: 4 },
  },

  // ═══════════════════════════════════════════════════════════
  // 3ª SÉRIE DO ENSINO MÉDIO - MATEMÁTICA
  // ═══════════════════════════════════════════════════════════
  "3EM": {
    // 1º BIMESTRE - Análise Combinatória
    1: { tema: "Análise Combinatória", subtema: "Princípio fundamental da contagem", bimestre: 1 },
    2: { tema: "Análise Combinatória", subtema: "Fatorial de um número", bimestre: 1 },
    3: { tema: "Análise Combinatória", subtema: "Arranjos simples", bimestre: 1 },
    4: { tema: "Análise Combinatória", subtema: "Permutações simples", bimestre: 1 },
    5: { tema: "Análise Combinatória", subtema: "Permutações com repetição", bimestre: 1 },
    6: { tema: "Análise Combinatória", subtema: "Combinações simples", bimestre: 1 },
    7: { tema: "Análise Combinatória", subtema: "Propriedades das combinações", bimestre: 1 },
    8: { tema: "Probabilidade", subtema: "Espaço amostral e eventos", bimestre: 1 },
    9: { tema: "Probabilidade", subtema: "Probabilidade de um evento", bimestre: 1 },
    10: { tema: "Probabilidade", subtema: "Probabilidade da união e interseção de eventos", bimestre: 1 },

    // 2º BIMESTRE - Probabilidade e Estatística
    11: { tema: "Probabilidade", subtema: "Probabilidade condicional", bimestre: 2 },
    12: { tema: "Probabilidade", subtema: "Eventos independentes", bimestre: 2 },
    13: { tema: "Probabilidade", subtema: "Binômio de Newton e triângulo de Pascal", bimestre: 2 },
    14: { tema: "Probabilidade", subtema: "Distribuição binomial (introdução)", bimestre: 2 },
    15: { tema: "Estatística", subtema: "Conceitos básicos: população, amostra, variáveis", bimestre: 2 },
    16: { tema: "Estatística", subtema: "Tabelas de frequências", bimestre: 2 },
    17: { tema: "Estatística", subtema: "Gráficos estatísticos", bimestre: 2 },
    18: { tema: "Estatística", subtema: "Medidas de tendência central: média, moda e mediana", bimestre: 2 },
    19: { tema: "Estatística", subtema: "Medidas de dispersão: variância e desvio padrão", bimestre: 2 },
    20: { tema: "Estatística", subtema: "Análise e interpretação de dados", bimestre: 2 },

    // 3º BIMESTRE - Geometria Espacial
    21: { tema: "Geometria Espacial", subtema: "Posições relativas de retas e planos", bimestre: 3 },
    22: { tema: "Geometria Espacial", subtema: "Poliedros: conceito e classificação", bimestre: 3 },
    23: { tema: "Geometria Espacial", subtema: "Prismas: área e volume", bimestre: 3 },
    24: { tema: "Geometria Espacial", subtema: "Pirâmides: área e volume", bimestre: 3 },
    25: { tema: "Geometria Espacial", subtema: "Cilindros: área e volume", bimestre: 3 },
    26: { tema: "Geometria Espacial", subtema: "Cones: área e volume", bimestre: 3 },
    27: { tema: "Geometria Espacial", subtema: "Esferas: área e volume", bimestre: 3 },
    28: { tema: "Geometria Espacial", subtema: "Troncos de pirâmide e cone", bimestre: 3 },
    29: { tema: "Geometria Espacial", subtema: "Inscrição e circunscrição de sólidos", bimestre: 3 },
    30: { tema: "Geometria Espacial", subtema: "Problemas envolvendo sólidos geométricos", bimestre: 3 },

    // 4º BIMESTRE - Revisão ENEM e Números Complexos
    31: { tema: "Números Complexos", subtema: "Número imaginário e unidade imaginária", bimestre: 4 },
    32: { tema: "Números Complexos", subtema: "Forma algébrica dos números complexos", bimestre: 4 },
    33: { tema: "Números Complexos", subtema: "Operações com números complexos", bimestre: 4 },
    34: { tema: "Números Complexos", subtema: "Conjugado e módulo de um número complexo", bimestre: 4 },
    35: { tema: "Números Complexos", subtema: "Forma trigonométrica dos números complexos", bimestre: 4 },
    36: { tema: "Polinômios", subtema: "Definição e operações com polinômios", bimestre: 4 },
    37: { tema: "Polinômios", subtema: "Divisão de polinômios e Teorema do Resto", bimestre: 4 },
    38: { tema: "Equações Polinomiais", subtema: "Raízes de equações polinomiais", bimestre: 4 },
    39: { tema: "Equações Polinomiais", subtema: "Relações de Girard", bimestre: 4 },
    40: { tema: "Revisão ENEM", subtema: "Integração de conteúdos e resolução de problemas", bimestre: 4 },
  }
}

// Interface para questões geradas (5 alternativas - Ensino Médio)
export interface QuestaoGerada {
  tipo_questao: string
  contexto: string
  enunciado: string
  alternativas: { A: string; B: string; C: string; D: string; E: string }
  resposta_correta: string
  dica: string
  feedback: string
  tema?: string
  subtema?: string
}

// Interface para questões EF (4 alternativas - Ensino Fundamental)
export interface QuestaoGeradaEF {
  tipo_questao: string
  contexto: string
  enunciado: string
  alternativas: { A: string; B: string; C: string; D: string }
  resposta_correta: 'A' | 'B' | 'C' | 'D'
  dica: string
  feedback: string
  tema?: string
  subtema?: string
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

  const promptQuestoes = `Você é um professor de Física MUITO CUIDADOSO que cria questões para o Ensino Médio.

ATENÇÃO CRÍTICA: O GABARITO DEVE ESTAR 100% CORRETO!
- Antes de definir a resposta_correta, FAÇA O CÁLCULO COMPLETO
- VERIFIQUE se a alternativa marcada como correta realmente corresponde ao resultado
- Se usar fórmulas, MOSTRE A APLICAÇÃO no feedback
- Confira as unidades de medida

INFORMAÇÕES:
- Série: ${serieNumero}ª série (${serie})
- Bimestre: ${bimestre}º
- Tema: ${tema}
- Subtema: ${subtema}

ADEQUAÇÃO AO NÍVEL:
${serieNumero === '1' ? `1º ano: Cinemática, Dinâmica (Leis de Newton), Trabalho e Energia. Conceitos fundamentais.` : ''}
${serieNumero === '2' ? `2º ano: Termologia, Calorimetria, Óptica, Ondas. Fenômenos do dia a dia.` : ''}
${serieNumero === '3' ? `3º ano: Eletrostática, Eletrodinâmica, Eletromagnetismo. Preparação ENEM.` : ''}

EXEMPLO DE QUESTÃO CORRETA (cinemática):
{
  "enunciado": "Um carro parte do repouso e acelera a 2 m/s² durante 5 segundos. Qual a velocidade final?",
  "alternativas": {
    "A": "10 m/s",
    "B": "7 m/s",
    "C": "2,5 m/s",
    "D": "25 m/s",
    "E": "5 m/s"
  },
  "resposta_correta": "A",
  "feedback": "Usando v = v₀ + at: v = 0 + 2 × 5 = 10 m/s. A resposta é A."
}

EXEMPLO DE QUESTÃO CORRETA (termologia):
{
  "enunciado": "Qual a quantidade de calor necessária para aquecer 500g de água de 20°C para 80°C? (c = 1 cal/g°C)",
  "alternativas": {
    "A": "30.000 cal",
    "B": "40.000 cal",
    "C": "50.000 cal",
    "D": "60.000 cal",
    "E": "10.000 cal"
  },
  "resposta_correta": "A",
  "feedback": "Q = m × c × ΔT = 500 × 1 × (80-20) = 500 × 60 = 30.000 cal. Resposta A."
}

REGRAS:
1. Crie ${quantidade} questões DIFERENTES sobre ${tema}
2. 5 alternativas (A, B, C, D, E)
3. VERIFIQUE O GABARITO - faça o cálculo antes de definir
4. Feedback DEVE mostrar o cálculo/raciocínio completo
5. Alternativas erradas = erros comuns de alunos

TIPOS (varie):
- conceitual: entendimento do fenômeno
- calculo_direto: aplicar fórmula
- situacao_problema: contexto real
- analise_fenomeno: explicar o porquê

Retorne APENAS JSON válido:
{
  "questoes": [
    {
      "tipo_questao": "calculo_direto",
      "contexto": "transporte",
      "enunciado": "...",
      "alternativas": {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."},
      "resposta_correta": "X",
      "dica": "...",
      "feedback": "CÁLCULO: ... Portanto a resposta é X."
    }
  ]
}`

  // Tentar diferentes modelos - Gemma 3 27B principal (free tier)
  const modelosQuestoes = [
    'gemma-3-27b-it',
    'gemini-2.0-flash-lite',
  ]

  for (const modelo of modelosQuestoes) {
    try {
      console.log(`[Gemini] Gerando questões com ${modelo}...`)

      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: modelo })

      const result = await comTimeout(
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: promptQuestoes }] }],
          generationConfig: {
            temperature: 0.7, // Menor para gabaritos precisos
            topP: 0.9,
            maxOutputTokens: 8192
          }
        }),
        GEMINI_TIMEOUT_MS,
        `Gemini questões ${modelo}`
      )

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

// Interface para resposta do Gemini - Matemática EF (4 alternativas)
interface RespostaGeminiQuestoesEF {
  questoes: QuestaoGeradaEF[]
}

/**
 * Gera questões de Matemática do Ensino Fundamental usando a API do Gemini
 * Sistema sob demanda com 4 alternativas (A, B, C, D) - diferente do EM que tem 5
 */
export async function gerarQuestoesMatematicaEF(
  serie: string,
  semana: number,
  quantidade: number = 5
): Promise<QuestaoGeradaEF[]> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('[Gemini] GEMINI_API_KEY não configurada')
    throw new Error('API do Gemini não configurada')
  }

  // Buscar conteúdo do currículo para a série específica
  const curriculoSerie = CURRICULO_MATEMATICA[serie]
  if (!curriculoSerie) {
    throw new Error(`Série ${serie} não encontrada no currículo de Matemática`)
  }

  let conteudo = curriculoSerie[semana]
  if (!conteudo) {
    // Se a semana não existe, usa a última semana disponível
    const semanaFallback = Math.min(semana, 40)
    conteudo = curriculoSerie[semanaFallback] || curriculoSerie[1]
    console.log(`[Gemini] Semana ${semana} não encontrada para ${serie}, usando semana ${semanaFallback}`)
  }

  const { tema, subtema, bimestre } = conteudo
  const serieNumero = serie[0] // "6", "7", "8" ou "9"

  const promptQuestoes = `Você é um professor de Matemática especialista em criar questões para estudantes do Ensino Fundamental II de escolas públicas brasileiras.

INFORMAÇÕES DA SÉRIE E PERÍODO:
- Série: ${serieNumero}º ano do Ensino Fundamental (${serie})
- Bimestre: ${bimestre}º bimestre
- Semana: ${semana} de 40
- Tema principal: ${tema}
- Subtema específico: ${subtema}

IMPORTANTE - ADEQUAÇÃO AO NÍVEL:
${serieNumero === '6' ? `
- Alunos do 6º ano estão iniciando o Ensino Fundamental II
- Foque em conceitos básicos e concretos
- Use linguagem simples e acessível
- Evite abstrações excessivas
- Temas típicos: Números naturais, frações, geometria básica, medidas` : ''}
${serieNumero === '7' ? `
- Alunos do 7º ano estão consolidando bases matemáticas
- Introduza números negativos de forma gradual
- Conecte álgebra com situações práticas
- Temas típicos: Números inteiros, razão, proporção, equações do 1º grau` : ''}
${serieNumero === '8' ? `
- Alunos do 8º ano já trabalham com álgebra
- Pode exigir mais raciocínio abstrato
- Conecte com geometria e medidas
- Temas típicos: Polinômios, fatoração, sistemas de equações, Teorema de Pitágoras` : ''}
${serieNumero === '9' ? `
- Alunos do 9º ano estão se preparando para o Ensino Médio
- Introduza funções de forma gradual
- Trabalhe equação do 2º grau e trigonometria básica
- Temas típicos: Funções, equação do 2º grau, trigonometria, geometria espacial` : ''}

Crie ${quantidade} questões de Matemática sobre "${tema}" - "${subtema}".

REGRAS OBRIGATÓRIAS:
1. As questões devem ser EXCLUSIVAMENTE sobre o conteúdo do ${serieNumero}º ano
2. NÃO use conteúdos de outras séries
3. Use contextos do cotidiano de estudantes brasileiros de escola pública
4. IMPORTANTE: Cada questão deve ter APENAS 4 alternativas (A, B, C, D) - NÃO inclua a letra E
5. As alternativas erradas devem ser PLAUSÍVEIS (baseadas em erros comuns de alunos)
6. Inclua uma DICA que ajude sem revelar a resposta
7. Inclua um FEEDBACK explicativo completo
8. Use linguagem adequada para a faixa etária (11-14 anos)
9. SÍMBOLOS MATEMÁTICOS - Use os símbolos tradicionais que os alunos conhecem:
   - Use × ou · para multiplicação (NUNCA use *)
   - Use ÷ para divisão (NUNCA use /)
   - Use ² ³ ⁴ etc para potências (NUNCA use ^)
   - Use √ para raiz quadrada
   - Use ≠ para diferente, ≤ para menor ou igual, ≥ para maior ou igual
   - Frações podem ser escritas como ½, ⅓, ¼ ou como "1/2", "1/3" etc

TIPOS DE QUESTÃO (varie entre eles):
- conceitual: Compreensão sem cálculos
- calculo_direto: Aplicação direta de operação ou fórmula
- situacao_problema: Problema contextualizado do dia a dia
- analise_fenomeno: Entender um padrão ou propriedade matemática
- comparacao: Comparar valores, grandezas ou expressões

Retorne APENAS um JSON válido no formato (sem markdown, sem texto adicional):
{
  "questoes": [
    {
      "tipo_questao": "conceitual",
      "contexto": "Cotidiano - Escola",
      "enunciado": "Na merenda da escola...",
      "alternativas": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "resposta_correta": "A",
      "dica": "Lembre-se que...",
      "feedback": "A resposta correta é A porque..."
    }
  ]
}`

  // Tentar diferentes modelos - Gemma 3 27B principal (free tier)
  const modelosQuestoes = [
    'gemma-3-27b-it',
    'gemini-2.0-flash-lite',
  ]

  for (const modelo of modelosQuestoes) {
    try {
      console.log(`[Gemini] Gerando questões de Matemática EF com ${modelo}...`)

      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: modelo })

      const result = await comTimeout(
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: promptQuestoes }] }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        }),
        GEMINI_TIMEOUT_MS,
        `Gemini mat-EF ${modelo}`
      )

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

      const dados: RespostaGeminiQuestoesEF = JSON.parse(text.trim())

      if (dados.questoes && dados.questoes.length > 0) {
        // Validar que as questões têm apenas 4 alternativas
        const questoesValidadas = dados.questoes.map(q => {
          // Remover alternativa E se existir (caso a IA tenha ignorado a instrução)
          const { A, B, C, D } = q.alternativas as any
          return {
            ...q,
            alternativas: { A, B, C, D },
            resposta_correta: (['A', 'B', 'C', 'D'].includes(q.resposta_correta)
              ? q.resposta_correta
              : 'A') as 'A' | 'B' | 'C' | 'D'
          }
        })

        console.log(`[Gemini] ${questoesValidadas.length} questões de Matemática EF geradas com ${modelo}`)
        return questoesValidadas
      }
    } catch (error) {
      console.error(`[Gemini] Erro com ${modelo}:`, error)
      continue
    }
  }

  throw new Error('Falha ao gerar questões de Matemática EF com todos os modelos tentados')
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

/**
 * Salva questões de Matemática EF no banco de dados (cache)
 * Inclui campos novos: componente, nivel_ensino, num_alternativas
 */
export async function salvarQuestoesMatematicaEFNoCache(
  supabase: any,
  questoes: QuestaoGeradaEF[],
  serie: string,
  semana: number
): Promise<number> {
  const conteudo = CURRICULO_MATEMATICA[serie]?.[semana] || CURRICULO_MATEMATICA[serie]?.[1]
  const anoLetivo = new Date().getFullYear()
  let salvas = 0

  for (let i = 0; i < questoes.length; i++) {
    const q = questoes[i]

    // Preparar dados conforme schema do banco (com campos EF)
    const dados = {
      serie: serie,
      semana: semana,
      ano_letivo: anoLetivo,
      ordem: i + 1,
      tema: conteudo?.tema || 'Matemática',
      subtema: conteudo?.subtema || '',
      tipo_questao: mapearTipoQuestao(q.tipo_questao),
      contexto_cotidiano: mapearContextoCotidiano(q.contexto),
      enunciado: q.enunciado,
      alternativas: q.alternativas,  // Apenas A, B, C, D
      resposta_correta: q.resposta_correta,
      dica: q.dica,
      feedback: {
        explicacao_correta: q.feedback,
        erros_comuns: {},
        conexao_cotidiano: '',
        curiosidade: ''
      },
      dificuldade: 'medio',
      ativa: true,
      // Novos campos para EF
      componente: 'matematica',
      nivel_ensino: 'EF',
      num_alternativas: 4
    }

    const { error } = await supabase
      .from('questoes_trilha')
      .insert(dados)

    if (error) {
      console.error(`[Cache] Erro ao salvar questão de Matemática EF ${i + 1}:`, error.message || error)
    } else {
      salvas++
      console.log(`[Cache] Questão de Matemática EF ${i + 1} salva para ${serie} semana ${semana}`)
    }
  }

  return salvas
}

/**
 * Verifica se a série é do Ensino Fundamental
 */
export function isSerieEF(serie: string): boolean {
  return ['6EF', '7EF', '8EF', '9EF'].includes(serie)
}

/**
 * Verifica se a série é do Ensino Médio
 */
export function isSerieEM(serie: string): boolean {
  return ['1EM', '2EM', '3EM'].includes(serie)
}

/**
 * Retorna o componente correto baseado na série
 * EF: matematica, EM: fisica
 */
export function getComponentePorSerie(serie: string): 'fisica' | 'matematica' {
  return isSerieEF(serie) ? 'matematica' : 'fisica'
}

/**
 * Retorna o número de alternativas baseado na série
 * EF: 4 alternativas, EM: 5 alternativas
 */
export function getNumAlternativasPorSerie(serie: string): 4 | 5 {
  return isSerieEF(serie) ? 4 : 5
}

/**
 * Função unificada para gerar questões (detecta automaticamente EF ou EM)
 */
export async function gerarQuestoes(
  serie: string,
  semana: number,
  quantidade: number = 5
): Promise<QuestaoGerada[] | QuestaoGeradaEF[]> {
  if (isSerieEF(serie)) {
    return gerarQuestoesMatematicaEF(serie, semana, quantidade)
  }
  return gerarQuestoesComGemini(serie, semana, quantidade)
}

/**
 * Função unificada para salvar questões no cache (detecta automaticamente EF ou EM)
 */
export async function salvarQuestoes(
  supabase: any,
  questoes: QuestaoGerada[] | QuestaoGeradaEF[],
  serie: string,
  semana: number
): Promise<number> {
  if (isSerieEF(serie)) {
    return salvarQuestoesMatematicaEFNoCache(supabase, questoes as QuestaoGeradaEF[], serie, semana)
  }
  return salvarQuestoesNoCache(supabase, questoes as QuestaoGerada[], serie, semana)
}

/**
 * Gera questões únicas para um usuário específico (SEM CACHE)
 * Cada chamada gera novas questões diferentes
 * OTIMIZADO: usa modelo rápido com temperatura baixa para precisão
 *
 * @param componente - Opcional: 'matematica' ou 'fisica'. Se não informado, usa a lógica padrão (EF=mat, EM=fis)
 */
export async function gerarQuestoesParaUsuario(
  serie: string,
  semana: number,
  quantidade: number,
  usuarioId: string,
  trilhaId: string,
  componente?: 'matematica' | 'fisica'
): Promise<QuestaoGeradaEF[] | QuestaoGerada[]> {
  // Usar timestamp + userId + random como seed para MÁXIMA variação
  const seed = `${usuarioId}-${trilhaId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

  // Determinar o componente a usar
  // Se não foi especificado, usar lógica padrão: EF = matemática, EM = física
  const componenteEfetivo = componente || getComponentePorSerie(serie)

  console.log(`[Gemini] Gerando ${quantidade} questões de ${componenteEfetivo} para usuário ${usuarioId.slice(0, 8)}...`)

  if (isSerieEF(serie)) {
    // Ensino Fundamental - sempre 4 alternativas
    // EF só tem Matemática disponível
    return gerarQuestoesMatematicaEFUnicas(serie, semana, quantidade, seed)
  } else {
    // Ensino Médio - 5 alternativas
    // Pode ser Matemática OU Física dependendo do componente
    if (componenteEfetivo === 'matematica') {
      return gerarQuestoesMatematicaEMUnicas(serie, semana, quantidade, seed)
    } else {
      return gerarQuestoesFisicaEMUnicas(serie, semana, quantidade, seed)
    }
  }
}

/**
 * Gera questões de Física EM únicas (sem cache, sempre novas)
 * OTIMIZADO para velocidade
 */
async function gerarQuestoesFisicaEMUnicas(
  serie: string,
  semana: number,
  quantidade: number,
  seed: string
): Promise<QuestaoGerada[]> {
  const curriculoSerie = CURRICULO_FISICA[serie]
  if (!curriculoSerie) {
    throw new Error(`Série ${serie} não encontrada no currículo`)
  }

  let conteudo = curriculoSerie[semana]
  if (!conteudo) {
    const semanaFallback = Math.min(semana, 40)
    conteudo = curriculoSerie[semanaFallback] || curriculoSerie[1]
  }

  const { tema, subtema, bimestre } = conteudo
  const serieNumero = serie[0]

  const promptQuestoes = `Gere ${quantidade} questões de Física para ${serieNumero}º ano EM sobre "${tema} - ${subtema}".

SEED: ${seed}

REGRAS OBRIGATÓRIAS:
1. Enunciado COMPLETO com TODOS os valores numéricos e unidades
2. Incluir constantes quando necessário (g=10m/s², π=3,14)
3. 5 alternativas (A-E), apenas UMA correta
4. Fazer o CÁLCULO antes de definir resposta_correta
5. Feedback mostrando a resolução

EXEMPLO:
{"tipo_questao":"calculo_direto","contexto":"movimento","enunciado":"Um carro parte do repouso e acelera a 4 m/s² por 5s. Qual a velocidade final?","alternativas":{"A":"20 m/s","B":"9 m/s","C":"25 m/s","D":"1,25 m/s","E":"100 m/s"},"resposta_correta":"A","dica":"v = v₀ + at","feedback":"v = 0 + 4×5 = 20 m/s"}

Retorne JSON: {"questoes":[...]}`

  // OTIMIZADO: Execução PARALELA dos modelos - primeiro que responder ganha
  const modelos = ['gemma-3-27b-it', 'gemini-2.0-flash-lite']

  const tentarComModelo = async (modelo: string): Promise<QuestaoGerada[]> => {
    console.log(`[Gemini] Física EM iniciando ${modelo}...`)
    const genAI = getGenAI()
    const model = genAI.getGenerativeModel({ model: modelo })

    const result = await comTimeout(
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: promptQuestoes }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048
        }
      }),
      GEMINI_TIMEOUT_MS,
      `Gemini questões únicas`
    )

    let text = result.response.text()
    if (!text) throw new Error('Resposta vazia')

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const dados = JSON.parse(text)

    if (!dados.questoes?.length) throw new Error('Sem questões')

    const questoesValidadas = dados.questoes
      .filter((q: QuestaoGerada) =>
        q.enunciado &&
        q.enunciado.length >= 30 &&
        q.alternativas &&
        q.resposta_correta &&
        q.feedback &&
        ['A', 'B', 'C', 'D', 'E'].includes(q.resposta_correta.toUpperCase())
      )
      .map((q: QuestaoGerada) => ({
        ...q,
        resposta_correta: q.resposta_correta.toUpperCase(),
        tema: tema,
        subtema: subtema
      }))

    if (questoesValidadas.length === 0) throw new Error('Nenhuma válida')

    console.log(`[Gemini] ${questoesValidadas.length} questões Física via ${modelo}`)
    return questoesValidadas
  }

  try {
    // Promise.any retorna o primeiro que resolver com sucesso
    return await Promise.any(modelos.map(m => tentarComModelo(m)))
  } catch (error) {
    console.error('[Gemini] Todos os modelos falharam:', error)
    throw new Error('Falha ao gerar questões de Física')
  }
}

/**
 * Gera questões de Matemática EM únicas (sem cache, sempre novas)
 * OTIMIZADO para velocidade - 5 alternativas como Física
 */
async function gerarQuestoesMatematicaEMUnicas(
  serie: string,
  semana: number,
  quantidade: number,
  seed: string
): Promise<QuestaoGerada[]> {
  const curriculoSerie = CURRICULO_MATEMATICA[serie]
  if (!curriculoSerie) {
    throw new Error(`Série ${serie} não encontrada no currículo de Matemática`)
  }

  let conteudo = curriculoSerie[semana]
  if (!conteudo) {
    const semanaFallback = Math.min(semana, 40)
    conteudo = curriculoSerie[semanaFallback] || curriculoSerie[1]
  }

  const { tema, subtema, bimestre } = conteudo
  const serieNumero = serie[0]

  const promptQuestoes = `Gere ${quantidade} questões de Matemática para ${serieNumero}º ano do Ensino Médio sobre "${tema} - ${subtema}".

SEED: ${seed}

REGRAS OBRIGATÓRIAS:
1. Enunciado COMPLETO com TODOS os valores numéricos necessários
2. Símbolos: × (mult), ÷ (div), ² ³ ⁴ (potência), √ (raiz), π, log, sen, cos, tg - NUNCA use * / ^
3. 5 alternativas (A-E), apenas UMA correta
4. Fazer o CÁLCULO COMPLETO antes de definir resposta_correta
5. Feedback mostrando a resolução passo a passo
6. Nível adequado ao ${serieNumero}º ano EM

CONTEXTO DO CONTEÚDO:
${serieNumero === '1' ? '1º ano EM: Funções (afim, quadrática, exponencial, logarítmica), Sequências, PA e PG' : ''}
${serieNumero === '2' ? '2º ano EM: Trigonometria, Matrizes, Determinantes, Sistemas Lineares, Geometria Analítica' : ''}
${serieNumero === '3' ? '3º ano EM: Análise Combinatória, Probabilidade, Estatística, Geometria Espacial, Números Complexos' : ''}

EXEMPLO:
{"tipo_questao":"calculo_direto","contexto":"funções","enunciado":"Dada a função f(x) = 2x² - 8x + 6, qual é o valor mínimo dessa função?","alternativas":{"A":"-2","B":"2","C":"-6","D":"6","E":"0"},"resposta_correta":"A","dica":"O valor mínimo de uma parábola com a > 0 ocorre no vértice","feedback":"yᵥ = -Δ/4a = -(64-48)/8 = -16/8 = -2"}

Retorne JSON: {"questoes":[...]}`

  // OTIMIZADO: Execução PARALELA dos modelos - primeiro que responder ganha
  const modelos = ['gemma-3-27b-it', 'gemini-2.0-flash-lite']

  const tentarComModelo = async (modelo: string): Promise<QuestaoGerada[]> => {
    console.log(`[Gemini] Matemática EM iniciando ${modelo}...`)
    const genAI = getGenAI()
    const model = genAI.getGenerativeModel({ model: modelo })

    const result = await comTimeout(
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: promptQuestoes }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048
        }
      }),
      GEMINI_TIMEOUT_MS,
      `Gemini questões únicas`
    )

    let text = result.response.text()
    if (!text) throw new Error('Resposta vazia')

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const dados = JSON.parse(text)

    if (!dados.questoes?.length) throw new Error('Sem questões')

    const questoesValidadas = dados.questoes
      .filter((q: QuestaoGerada) =>
        q.enunciado &&
        q.enunciado.length >= 30 &&
        q.alternativas &&
        q.resposta_correta &&
        q.feedback &&
        ['A', 'B', 'C', 'D', 'E'].includes(q.resposta_correta.toUpperCase())
      )
      .map((q: QuestaoGerada) => ({
        ...q,
        resposta_correta: q.resposta_correta.toUpperCase(),
        tema: tema,
        subtema: subtema
      }))

    if (questoesValidadas.length === 0) throw new Error('Nenhuma válida')

    console.log(`[Gemini] ${questoesValidadas.length} questões Matemática EM via ${modelo}`)
    return questoesValidadas
  }

  try {
    // Promise.any retorna o primeiro que resolver com sucesso
    return await Promise.any(modelos.map(m => tentarComModelo(m)))
  } catch (error) {
    console.error('[Gemini] Todos os modelos falharam:', error)
    throw new Error('Falha ao gerar questões de Matemática EM')
  }
}

/**
 * Gera questões de Matemática EF únicas (sem cache, sempre novas)
 */
async function gerarQuestoesMatematicaEFUnicas(
  serie: string,
  semana: number,
  quantidade: number,
  seed: string
): Promise<QuestaoGeradaEF[]> {
  const conteudo = CURRICULO_MATEMATICA[serie]?.[semana]

  if (!conteudo) {
    // Se não tem conteúdo específico, usar um tema genérico baseado na série
    const temasGenericos: Record<string, { tema: string; subtema: string }> = {
      '6EF': { tema: 'Números e Operações', subtema: 'Operações com números naturais' },
      '7EF': { tema: 'Álgebra', subtema: 'Expressões algébricas' },
      '8EF': { tema: 'Geometria', subtema: 'Figuras geométricas' },
      '9EF': { tema: 'Funções', subtema: 'Introdução às funções' }
    }
    const temaGenerico = temasGenericos[serie] || temasGenericos['6EF']
    return gerarQuestoesMatematicaEFComTema(serie, temaGenerico.tema, temaGenerico.subtema, quantidade, seed)
  }

  return gerarQuestoesMatematicaEFComTema(serie, conteudo.tema, conteudo.subtema, quantidade, seed)
}

/**
 * Gera questões de Matemática EF com tema específico
 */
async function gerarQuestoesMatematicaEFComTema(
  serie: string,
  tema: string,
  subtema: string,
  quantidade: number,
  seed: string
): Promise<QuestaoGeradaEF[]> {
  const serieNumero = serie[0]

  const promptQuestoes = `Gere ${quantidade} questões de Matemática para ${serieNumero}º ano EF sobre "${tema} - ${subtema}".

SEED: ${seed}

REGRAS OBRIGATÓRIAS:
1. Enunciado COMPLETO com TODOS os valores numéricos
2. Símbolos: × (mult), ÷ (div), ² ³ (potência), √ (raiz) - NUNCA use * / ^
3. 4 alternativas (A-D), apenas UMA correta
4. Fazer o CÁLCULO antes de definir resposta_correta
5. Feedback mostrando a resolução passo a passo

EXEMPLO:
{"tipo_questao":"calculo_direto","contexto":"potências","enunciado":"Qual é o resultado de 2⁴ × 2²?","alternativas":{"A":"64","B":"32","C":"16","D":"8"},"resposta_correta":"A","dica":"Some os expoentes","feedback":"2⁴ × 2² = 2⁶ = 64"}

Retorne JSON: {"questoes":[...]}`

  // OTIMIZADO: Execução PARALELA dos modelos - primeiro que responder ganha
  const modelos = ['gemma-3-27b-it', 'gemini-2.0-flash-lite']

  const tentarComModelo = async (modelo: string): Promise<QuestaoGeradaEF[]> => {
    console.log(`[Gemini] Matemática EF iniciando ${modelo}...`)
    const genAI = getGenAI()
    const model = genAI.getGenerativeModel({ model: modelo })

    const result = await comTimeout(
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: promptQuestoes }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048
        }
      }),
      GEMINI_TIMEOUT_MS,
      `Gemini questões únicas`
    )

    let text = result.response.text()
    if (!text) throw new Error('Resposta vazia')

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const dados = JSON.parse(text)

    if (!dados.questoes?.length) throw new Error('Sem questões')

    const questoesValidadas = dados.questoes
      .filter((q: QuestaoGeradaEF) =>
        q.enunciado &&
        q.enunciado.length >= 20 &&
        q.alternativas &&
        q.resposta_correta &&
        q.feedback &&
        ['A', 'B', 'C', 'D'].includes(q.resposta_correta.toUpperCase())
      )
      .map((q: QuestaoGeradaEF) => ({
        ...q,
        resposta_correta: q.resposta_correta.toUpperCase(),
        tema: tema,
        subtema: subtema
      }))

    if (questoesValidadas.length === 0) throw new Error('Nenhuma válida')

    console.log(`[Gemini] ${questoesValidadas.length} questões Matemática via ${modelo}`)
    return questoesValidadas
  }

  try {
    // Promise.any retorna o primeiro que resolver com sucesso
    return await Promise.any(modelos.map(m => tentarComModelo(m)))
  } catch (error) {
    console.error('[Gemini] Todos os modelos falharam:', error)
    throw new Error('Falha ao gerar questões de Matemática')
  }
}
