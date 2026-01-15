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

// Currículo de Física organizado por série e semana
export const CURRICULO_FISICA: Record<string, Record<number, { tema: string; subtema: string }>> = {
  "1EM": {
    1: { tema: "Cinemática", subtema: "Conceitos de movimento, referencial, velocidade média" },
    2: { tema: "Cinemática", subtema: "MRU - Movimento Retilíneo Uniforme" },
    3: { tema: "Cinemática", subtema: "MRUV - Movimento com aceleração" },
    4: { tema: "Cinemática", subtema: "Queda livre e lançamento vertical" },
    5: { tema: "Dinâmica", subtema: "Leis de Newton - Primeira Lei (Inércia)" },
    6: { tema: "Dinâmica", subtema: "Leis de Newton - Segunda Lei (F=ma)" },
    7: { tema: "Dinâmica", subtema: "Leis de Newton - Terceira Lei (Ação e Reação)" },
    8: { tema: "Dinâmica", subtema: "Força de atrito" },
    9: { tema: "Trabalho e Energia", subtema: "Trabalho de uma força" },
    10: { tema: "Trabalho e Energia", subtema: "Energia cinética e potencial" },
  },
  "2EM": {
    1: { tema: "Termologia", subtema: "Temperatura, escalas termométricas, equilíbrio térmico" },
    2: { tema: "Termologia", subtema: "Calor sensível e latente" },
    3: { tema: "Termologia", subtema: "Propagação de calor" },
    4: { tema: "Termodinâmica", subtema: "Trabalho e energia em sistemas térmicos" },
    5: { tema: "Óptica", subtema: "Reflexão da luz e espelhos planos" },
    6: { tema: "Óptica", subtema: "Espelhos esféricos" },
    7: { tema: "Óptica", subtema: "Refração da luz" },
    8: { tema: "Ondas", subtema: "Características das ondas" },
    9: { tema: "Ondas", subtema: "Ondas sonoras e acústica" },
    10: { tema: "Hidrostática", subtema: "Pressão e densidade" },
  },
  "3EM": {
    1: { tema: "Eletrostática", subtema: "Cargas elétricas, eletrização" },
    2: { tema: "Eletrostática", subtema: "Lei de Coulomb, campo elétrico" },
    3: { tema: "Eletrodinâmica", subtema: "Corrente elétrica, resistência" },
    4: { tema: "Eletrodinâmica", subtema: "Circuitos elétricos simples" },
    5: { tema: "Eletrodinâmica", subtema: "Potência elétrica e consumo" },
    6: { tema: "Magnetismo", subtema: "Campo magnético e ímãs" },
    7: { tema: "Eletromagnetismo", subtema: "Força magnética e corrente elétrica" },
    8: { tema: "Eletromagnetismo", subtema: "Indução eletromagnética" },
    9: { tema: "Física Moderna", subtema: "Introdução à física quântica" },
    10: { tema: "Física Moderna", subtema: "Relatividade especial básica" },
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

  // Buscar conteúdo do currículo
  let conteudo = CURRICULO_FISICA[serie]?.[semana]
  if (!conteudo) {
    // Se não tem conteúdo específico, usa semana 1
    conteudo = CURRICULO_FISICA[serie]?.[1]
    if (!conteudo) {
      throw new Error(`Série ${serie} não encontrada no currículo`)
    }
    console.log(`[Gemini] Semana ${semana} não encontrada, usando conteúdo da semana 1`)
  }

  const { tema, subtema } = conteudo

  const promptQuestoes = `Você é um professor de Física especialista em criar questões para estudantes do Ensino Médio de escolas públicas brasileiras.

Crie ${quantidade} questões de Física sobre o tema "${tema}" - "${subtema}" para a ${serie[0]}ª série do Ensino Médio.

REGRAS OBRIGATÓRIAS:
1. Use contextos do cotidiano de estudantes brasileiros de escola pública (ônibus escolar, conta de luz, celular carregando, etc)
2. Cada questão deve ter 5 alternativas (A, B, C, D, E)
3. As alternativas erradas devem ser PLAUSÍVEIS (baseadas em erros comuns dos alunos)
4. Inclua uma DICA que ajude sem revelar a resposta
5. Inclua um FEEDBACK explicativo para quando o aluno responder

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
 */
export async function verificarCacheQuestoes(
  supabase: any,
  serie: string,
  semana: number,
  trilhaId: string = 'passar_ano'
): Promise<number> {
  const { count, error } = await supabase
    .from('questoes_trilha')
    .select('*', { count: 'exact', head: true })
    .eq('trilha_id', trilhaId)
    .eq('serie', serie)
    .eq('semana', semana)

  if (error) {
    console.error('[Cache] Erro ao verificar cache:', error)
    return 0
  }

  return count || 0
}

/**
 * Salva questões geradas no banco de dados (cache)
 */
export async function salvarQuestoesNoCache(
  supabase: any,
  questoes: QuestaoGerada[],
  serie: string,
  semana: number,
  trilhaId: string = 'passar_ano'
): Promise<number> {
  const conteudo = CURRICULO_FISICA[serie]?.[semana] || CURRICULO_FISICA[serie]?.[1]
  let salvas = 0

  for (let i = 0; i < questoes.length; i++) {
    const q = questoes[i]
    const questaoId = `auto-${serie.toLowerCase()}-s${semana}-q${i + 1}-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const { error } = await supabase
      .from('questoes_trilha')
      .insert({
        id: questaoId,
        trilha_id: trilhaId,
        serie: serie,
        semana: semana,
        ordem: i + 1,
        tema: conteudo?.tema || 'Física',
        subtema: conteudo?.subtema || '',
        tipo_questao: q.tipo_questao,
        dificuldade: 'medio',
        contexto: q.contexto,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        resposta_correta: q.resposta_correta,
        dica: q.dica,
        feedback: q.feedback
      })

    if (error) {
      console.error(`[Cache] Erro ao salvar questão ${i + 1}:`, error)
    } else {
      salvas++
      console.log(`[Cache] Questão ${i + 1} salva: ${questaoId}`)
    }
  }

  return salvas
}
