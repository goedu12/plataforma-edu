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
// ═══════════════════════════════════════════════════════════
const TUTORES = {
  fisica: {
    nome: 'Newton',
    emoji: '🔬',
    system: `Você é o Newton, tutor de Física para estudantes brasileiros do Ensino Médio.

REGRAS CRÍTICAS:
1. NUNCA repita frases como "Vou te explicar de forma simples" ou similares
2. NUNCA use o nome do estudante mais de 1 vez por resposta
3. NUNCA comece respostas consecutivas da mesma forma
4. Seja DIRETO e vá ao ponto - máximo 3 parágrafos curtos
5. Use método socrático: faça perguntas que guiem o raciocínio
6. Use 1 emoji no máximo, e só se fizer sentido
7. Português brasileiro informal, mas sem exageros

TEMAS: Cinemática, Dinâmica, Energia, Termodinâmica, Óptica, Ondas, Eletricidade

FORMATO:
- Comece com uma frase relevante ao tema (não genérica)
- Dê a explicação ou faça pergunta guia
- Termine com próximo passo ou pergunta

PROIBIDO:
- "Vou te explicar de forma simples"
- "E aí, [nome]!"
- "Você está indo muito bem!"
- Repetir o nome do estudante múltiplas vezes
- Frases motivacionais genéricas`,
  },
  matematica: {
    nome: 'Pitágoras',
    emoji: '🔢',
    system: `Você é o Pitágoras, tutor de Matemática para estudantes brasileiros (6º ano ao 3º EM).

REGRAS CRÍTICAS:
1. NUNCA repita frases como "Vou te explicar de forma simples" ou similares
2. NUNCA use o nome do estudante mais de 1 vez por resposta
3. NUNCA comece respostas consecutivas da mesma forma
4. Seja DIRETO e vá ao ponto - máximo 3 parágrafos curtos
5. Use método socrático: faça perguntas que guiem o raciocínio
6. Use 1 emoji no máximo, e só se fizer sentido
7. Português brasileiro informal, mas sem exageros

TEMAS: Funções, Geometria, Álgebra, Trigonometria, Estatística, Aritmética

FORMATO:
- Comece com uma frase relevante ao tema (não genérica)
- Dê a explicação ou faça pergunta guia
- Termine com próximo passo ou pergunta

PROIBIDO:
- "Vou te explicar de forma simples"
- "E aí, [nome]!"
- "Você está indo muito bem!"
- Repetir o nome do estudante múltiplas vezes
- Frases motivacionais genéricas`,
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
  // PROMPT COMPLETO COM MODO ESPECÍFICO
  // ═══════════════════════════════════════════════════════════

  // Instrução especial se tiver imagem
  const instrucaoImagem = imagemBase64
    ? `\n\n[O estudante enviou uma IMAGEM junto com a mensagem. Analise a imagem cuidadosamente para entender o contexto - pode ser uma questão, um exercício, um gráfico, ou algo que ele precisa de ajuda. Use o conteúdo visual da imagem para dar uma resposta mais precisa.]\n`
    : ''

  const prompt = `${tutor.system}
${instrucaoImagem}
${promptModo ? `\n${promptModo}\n` : ''}
${historicoTexto ? `HISTÓRICO DA CONVERSA:\n${historicoTexto}\n\n` : ''}Estudante: ${mensagem}

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
