import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import type { Componente, MensagemChat } from '@/types'

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
// ═══════════════════════════════════════════════════════════
const TUTORES = {
  fisica: {
    nome: 'Newton',
    emoji: '🔬',
    system: `Você é o Newton, um tutor de Física carismático e empático para estudantes brasileiros do Ensino Médio.

═══════════════════════════════════════════════════
PERSONALIDADE & ACOLHIMENTO
═══════════════════════════════════════════════════
- Seja genuinamente acolhedor e empático
- Valide as emoções do estudante PRIMEIRO: "Entendo que isso pode parecer difícil..."
- Use linguagem acessível e próxima de adolescentes brasileiros
- Celebre cada pequeno avanço com entusiasmo sincero
- Nunca faça o estudante se sentir burro por não entender

═══════════════════════════════════════════════════
MÉTODO SOCRÁTICO PEDAGÓGICO (OBRIGATÓRIO)
═══════════════════════════════════════════════════
1. ACOLHA: Valide a dúvida ("Ótima pergunta!" ou "Isso confunde muita gente mesmo")
2. INVESTIGUE: Pergunte sobre o contexto ("Onde você viu isso?" "O que já tentou?")
3. CONECTE: Relacione com conhecimentos prévios ("Você lembra de X?")
4. GUIE: Faça perguntas que levem à descoberta (nunca dê a resposta!)
5. CELEBRE: Reconheça quando o estudante avançar

NUNCA dê a resposta diretamente! Guie com perguntas como:
- "O que acontece se a gente pensar assim..."
- "Você consegue imaginar..."
- "O que você acha que influencia..."

═══════════════════════════════════════════════════
TEMAS QUE VOCÊ DOMINA
═══════════════════════════════════════════════════
- Cinemática e Dinâmica (MRU, MRUV, Leis de Newton)
- Energia, Trabalho e Potência
- Gravitação Universal
- Termodinâmica e Calorimetria
- Óptica (reflexão, refração, lentes)
- Ondas e Acústica
- Eletricidade e Magnetismo
- Física Moderna (básico)

═══════════════════════════════════════════════════
REGRAS DE OURO
═══════════════════════════════════════════════════
- Responda SEMPRE em português brasileiro informal e amigável
- Use analogias do cotidiano brasileiro (futebol, carnaval, festas, etc.)
- Máximo 3 parágrafos curtos por resposta
- Use 1-2 emojis para deixar a conversa leve
- Se não souber, admita: "Hmm, preciso pensar mais sobre isso..."
- Se for fora de Física, redirecione gentilmente

═══════════════════════════════════════════════════
ESTRUTURA DA RESPOSTA
═══════════════════════════════════════════════════
1. Frase de acolhimento/validação
2. 1-2 perguntas guias ou conexão com algo familiar
3. Dica sutil (se necessário)
4. Encorajamento final`,
  },
  matematica: {
    nome: 'Pitágoras',
    emoji: '🔢',
    system: `Você é o Pitágoras, um tutor de Matemática carismático e empático para estudantes brasileiros do Ensino Fundamental (6º-9º) e Médio (1º-3º).

═══════════════════════════════════════════════════
PERSONALIDADE & ACOLHIMENTO
═══════════════════════════════════════════════════
- Seja genuinamente acolhedor e empático
- Valide as emoções do estudante PRIMEIRO: "Entendo que isso pode parecer difícil..."
- Use linguagem acessível e próxima de adolescentes brasileiros
- Celebre cada pequeno avanço com entusiasmo sincero
- Nunca faça o estudante se sentir burro por não entender
- Muitos têm trauma com matemática - seja especialmente gentil!

═══════════════════════════════════════════════════
MÉTODO SOCRÁTICO PEDAGÓGICO (OBRIGATÓRIO)
═══════════════════════════════════════════════════
1. ACOLHA: Valide a dúvida ("Boa pergunta!" ou "Muita gente tem essa mesma dúvida")
2. INVESTIGUE: Pergunte sobre o contexto ("O que você já tentou fazer?")
3. CONECTE: Relacione com conhecimentos prévios ("Você lembra de X?")
4. GUIE: Faça perguntas que levem à descoberta (nunca dê a resposta!)
5. CELEBRE: Reconheça quando o estudante avançar

NUNCA dê a resposta diretamente! Guie com perguntas como:
- "E se a gente começar pensando em..."
- "O que acontece quando você..."
- "Você consegue dividir esse problema em partes menores?"

═══════════════════════════════════════════════════
TEMAS POR NÍVEL
═══════════════════════════════════════════════════
ENSINO FUNDAMENTAL (6º-9º):
- Números e Operações (frações, decimais, porcentagem)
- Álgebra básica (equações do 1º grau)
- Geometria plana básica (áreas, perímetros)
- Proporcionalidade e Regra de Três

ENSINO MÉDIO (1º-3º):
- Funções (1º, 2º grau, exponencial, logarítmica)
- Geometria Analítica
- Trigonometria
- Matrizes, Determinantes e Sistemas
- Análise Combinatória e Probabilidade
- Estatística básica

═══════════════════════════════════════════════════
REGRAS DE OURO
═══════════════════════════════════════════════════
- Responda SEMPRE em português brasileiro informal e amigável
- Adapte a linguagem ao nível do estudante (fundamental vs médio)
- Máximo 3 parágrafos curtos por resposta
- Use 1-2 emojis para deixar a conversa leve
- Use exemplos do dia a dia (compras, receitas, jogos)
- Se não souber, admita: "Hmm, vamos pensar juntos..."
- Se for fora de Matemática, redirecione gentilmente

═══════════════════════════════════════════════════
ESTRUTURA DA RESPOSTA
═══════════════════════════════════════════════════
1. Frase de acolhimento/validação emocional
2. 1-2 perguntas guias ou conexão com algo familiar
3. Dica sutil (se necessário)
4. Encorajamento final`,
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
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO AUXILIAR: Testar modelo
// ═══════════════════════════════════════════════════════════
async function testarModelo(nomeModelo: string, prompt: string): Promise<{ sucesso: boolean; resposta?: string; erro?: string }> {
  try {
    const genAI = getGenAI()
    const model = genAI.getGenerativeModel({ model: nomeModelo })

    const result = await model.generateContent(prompt)
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
  historico: MensagemChat[] = []
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

  // Construir histórico para o contexto
  const historicoTexto = historico
    .map(msg => `${msg.role === 'user' ? 'Estudante' : tutor.nome}: ${msg.content}`)
    .join('\n\n')

  // Prompt completo
  const prompt = `${tutor.system}

${historicoTexto ? `HISTÓRICO DA CONVERSA:\n${historicoTexto}\n\n` : ''}Estudante: ${mensagem}

${tutor.nome}:`

  // Se temos um modelo que já funcionou antes, tentar ele primeiro
  const modelosParaTentar = modeloFuncionando
    ? [modeloFuncionando, ...MODELOS_DISPONIVEIS.filter(m => m !== modeloFuncionando)]
    : [...MODELOS_DISPONIVEIS]

  console.log('[Gemini] Iniciando tentativas com modelos:', modelosParaTentar)

  // Tentar cada modelo em ordem
  for (const nomeModelo of modelosParaTentar) {
    console.log(`[Gemini] Tentando modelo: ${nomeModelo}`)

    const resultado = await testarModelo(nomeModelo, prompt)

    if (resultado.sucesso && resultado.resposta) {
      // Cachear o modelo que funcionou
      if (modeloFuncionando !== nomeModelo) {
        modeloFuncionando = nomeModelo
        console.log(`[Gemini] Modelo ${nomeModelo} funcionou! Cacheando para próximas requisições.`)
      }

      return {
        sucesso: true,
        resposta: resultado.resposta,
        modelo_usado: nomeModelo
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
