import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para uso no navegador (client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente com service role para operações administrativas (server-side)
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
  }
  return createClient(supabaseUrl, serviceKey)
}

// Tipos para as tabelas do Supabase
export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          senha_hash: string
          nome: string
          turma: string
          ano: number
          nivel: 'EF' | 'EM'
          componentes: string[]
          fis_pontos: number
          fis_questoes_total: number
          fis_questoes_corretas: number
          fis_sequencia_dias: number
          fis_nivel: string
          fis_uso_ia_hoje: number
          fis_data_uso_ia: string | null
          fis_ultimo_estudo: string | null
          mat_pontos: number
          mat_questoes_total: number
          mat_questoes_corretas: number
          mat_sequencia_dias: number
          mat_nivel: string
          mat_uso_ia_hoje: number
          mat_data_uso_ia: string | null
          mat_ultimo_estudo: string | null
          tipo: 'estudante' | 'professor'
          ativo: boolean
          senha_alterada: boolean
          ultimo_acesso: string | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['usuarios']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>
      }
      questoes: {
        Row: {
          id: string
          componente: 'fisica' | 'matematica'
          ano: number
          tema: string
          subtema: string | null
          dificuldade: 'facil' | 'medio' | 'dificil'
          enunciado: string
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          resposta_correta: 'A' | 'B' | 'C' | 'D'
          explicacao: string
          dica: string | null
          status: 'ativa' | 'inativa'
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['questoes']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['questoes']['Insert']>
      }
      respostas: {
        Row: {
          id: string
          usuario_id: string
          questao_id: string
          componente: 'fisica' | 'matematica'
          resposta_dada: 'A' | 'B' | 'C' | 'D'
          correta: boolean
          tempo_segundos: number
          usou_dica: boolean
          pontos_ganhos: number
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['respostas']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['respostas']['Insert']>
      }
      conquistas: {
        Row: {
          id: string
          codigo: string
          nome: string
          descricao: string
          icone: string
          componente: 'fisica' | 'matematica' | null
          requisito_tipo: 'pontos' | 'questoes' | 'sequencia' | 'acertos'
          requisito_valor: number
        }
        Insert: Omit<Database['public']['Tables']['conquistas']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['conquistas']['Insert']>
      }
      conquistas_usuarios: {
        Row: {
          id: string
          usuario_id: string
          conquista_id: string
          componente: 'fisica' | 'matematica'
          desbloqueada_em: string
        }
        Insert: Omit<Database['public']['Tables']['conquistas_usuarios']['Row'], 'id' | 'desbloqueada_em'>
        Update: Partial<Database['public']['Tables']['conquistas_usuarios']['Insert']>
      }
    }
  }
}
