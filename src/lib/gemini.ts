import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Componente, MensagemChat } from '@/types'

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
// FUNÇÃO DE CHAT COM TUTOR
// ═══════════════════════════════════════════════════════════
export interface ChatResponse {
  sucesso: boolean
  resposta?: string
  erro?: string
}

export async function chatComTutor(
  componente: Componente,
  mensagem: string,
  historico: MensagemChat[] = []
): Promise<ChatResponse> {
  try {
    const tutor = TUTORES[componente]
    if (!tutor) {
      return { sucesso: false, erro: 'Componente inválido' }
    }

    // Verificar se a API key está configurada
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'placeholder_gemini_key' || apiKey.startsWith('placeholder')) {
      console.error('GEMINI_API_KEY não configurada ou é placeholder')
      return {
        sucesso: false,
        erro: 'O tutor IA ainda não está disponível. Entre em contato com seu professor.'
      }
    }

    // Inicializar cliente com a API key (dentro da função para garantir que env var está disponível)
    const genAI = new GoogleGenerativeAI(apiKey)

    // Criar modelo - usando Gemini 2.0 Flash (modelo estável)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    })

    // Construir histórico para o contexto
    const historicoTexto = historico
      .map(msg => `${msg.role === 'user' ? 'Estudante' : tutor.nome}: ${msg.content}`)
      .join('\n\n')

    // Prompt completo
    const prompt = `${tutor.system}

${historicoTexto ? `HISTÓRICO DA CONVERSA:\n${historicoTexto}\n\n` : ''}Estudante: ${mensagem}

${tutor.nome}:`

    console.log('Chamando Gemini API com modelo gemini-2.0-flash...')

    // Gerar resposta
    const result = await model.generateContent(prompt)
    const response = result.response
    const texto = response.text()

    if (!texto) {
      console.error('Gemini retornou resposta vazia')
      return { sucesso: false, erro: 'Resposta vazia do tutor' }
    }

    console.log('Resposta recebida do Gemini com sucesso')
    return { sucesso: true, resposta: texto.trim() }
  } catch (error: unknown) {
    console.error('Erro no chat com tutor:', error)

    // Tratamento de erros específicos
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('API key')) {
      return {
        sucesso: false,
        erro: 'Chave da API inválida. Entre em contato com o administrador.',
      }
    }

    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return {
        sucesso: false,
        erro: 'Limite de uso da IA atingido. Tente novamente mais tarde.',
      }
    }

    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return {
        sucesso: false,
        erro: 'Modelo de IA não disponível. Tente novamente mais tarde.',
      }
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        sucesso: false,
        erro: 'Erro de conexão. Verifique sua internet e tente novamente.',
      }
    }

    return {
      sucesso: false,
      erro: 'Erro ao comunicar com o tutor. Tente novamente.',
    }
  }
}

// ═══════════════════════════════════════════════════════════
// INFORMAÇÕES DOS TUTORES
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
