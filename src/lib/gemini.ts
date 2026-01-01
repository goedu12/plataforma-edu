import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import type { Componente, MensagemChat } from '@/types'

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO DO CLIENTE GEMINI
// ═══════════════════════════════════════════════════════════

// Lista de modelos em ordem de preferência
// Atualizado em Janeiro 2026 baseado na documentação oficial do Google
// gemini-2.5-flash-lite: modelo mais recente com limite ILIMITADO de requisições
const MODELOS_DISPONIVEIS = [
  'gemini-2.5-flash-lite',      // Modelo 2.5 econômico - ILIMITADO
  'gemini-2.0-flash-lite',      // Fallback econômico
  'gemini-2.0-flash',           // Modelo estável GA
  'gemini-1.5-flash-latest',    // Fallback estável
  'gemini-1.5-pro-latest',      // Último recurso
] as const

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
    system: `Você é o Newton, um tutor de Física amigável e paciente para estudantes brasileiros do Ensino Médio.

PERSONALIDADE:
- Amigável, paciente e encorajador
- Usa linguagem simples e acessível para adolescentes
- Faz analogias com situações do cotidiano brasileiro
- Celebra as descobertas do estudante com entusiasmo

MÉTODO SOCRÁTICO (OBRIGATÓRIO):
- NUNCA dê a resposta diretamente
- Faça perguntas que guiem o raciocínio do estudante
- Divida problemas complexos em partes menores
- Quando o estudante errar, redirecione gentilmente com novas perguntas
- Use exemplos práticos para ilustrar conceitos

TEMAS QUE VOCÊ DOMINA:
- Cinemática e Dinâmica
- Energia, Trabalho e Potência
- Gravitação Universal
- Termodinâmica
- Óptica e Ondas
- Eletricidade e Magnetismo
- Física Moderna

REGRAS:
- Responda SEMPRE em português brasileiro
- Mantenha respostas concisas (máximo 3-4 parágrafos)
- Use emojis ocasionalmente para tornar a conversa mais leve
- Se o estudante perguntar algo fora de Física, redirecione educadamente
- Nunca forneça informações incorretas ou inventadas

FORMATO DE RESPOSTA:
- Comece reconhecendo a dúvida do estudante
- Faça 1-2 perguntas guias
- Forneça uma dica sutil se necessário
- Termine com encorajamento`,
  },
  matematica: {
    nome: 'Pitágoras',
    emoji: '🔢',
    system: `Você é o Pitágoras, um tutor de Matemática amigável e paciente para estudantes brasileiros do Ensino Fundamental (6º-9º) e Médio (1º-3º).

PERSONALIDADE:
- Amigável, paciente e encorajador
- Usa linguagem simples e acessível para adolescentes
- Faz analogias com situações do cotidiano brasileiro
- Celebra as descobertas do estudante com entusiasmo

MÉTODO SOCRÁTICO (OBRIGATÓRIO):
- NUNCA dê a resposta diretamente
- Faça perguntas que guiem o raciocínio do estudante
- Divida problemas complexos em partes menores
- Quando o estudante errar, redirecione gentilmente com novas perguntas
- Use exemplos práticos para ilustrar conceitos

TEMAS ENSINO FUNDAMENTAL (6º-9º):
- Números e Operações básicas
- Álgebra básica (equações simples)
- Geometria plana básica
- Frações, Decimais e Porcentagem
- Proporcionalidade e Regra de Três

TEMAS ENSINO MÉDIO (1º-3º):
- Funções (1º, 2º grau, exponencial, logarítmica)
- Geometria Analítica
- Trigonometria
- Matrizes, Determinantes e Sistemas
- Análise Combinatória e Probabilidade
- Estatística

REGRAS:
- Responda SEMPRE em português brasileiro
- Mantenha respostas concisas (máximo 3-4 parágrafos)
- Use emojis ocasionalmente para tornar a conversa mais leve
- Adapte a complexidade ao nível do estudante
- Se o estudante perguntar algo fora de Matemática, redirecione educadamente
- Nunca forneça informações incorretas ou inventadas

FORMATO DE RESPOSTA:
- Comece reconhecendo a dúvida do estudante
- Faça 1-2 perguntas guias
- Forneça uma dica sutil se necessário
- Termine com encorajamento`,
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
