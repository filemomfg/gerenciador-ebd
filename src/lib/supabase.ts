import { createClient } from '@supabase/supabase-js'

// Configuração com fallback para evitar erros de build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nome: string
          email: string
          senha: string
          role: 'admin' | 'admin_igreja' | 'professor' | 'aluno'
          igreja_id?: string
          sala_id?: string
          ativo?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          senha: string
          role: 'admin' | 'admin_igreja' | 'professor' | 'aluno'
          igreja_id?: string
          sala_id?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          senha?: string
          role?: 'admin' | 'admin_igreja' | 'professor' | 'aluno'
          igreja_id?: string
          sala_id?: string
          ativo?: boolean
          updated_at?: string
        }
      }
      igrejas: {
        Row: {
          id: string
          nome: string
          endereco: string
          cidade: string
          estado: string
          cep: string
          telefone?: string
          email?: string
          logo_url?: string
          configuracoes: any
          admin_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          endereco: string
          cidade: string
          estado: string
          cep: string
          telefone?: string
          email?: string
          logo_url?: string
          configuracoes: any
          admin_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          endereco?: string
          cidade?: string
          estado?: string
          cep?: string
          telefone?: string
          email?: string
          logo_url?: string
          configuracoes?: any
          admin_id?: string
          updated_at?: string
        }
      }
      salas: {
        Row: {
          id: string
          nome: string
          faixa_etaria?: string
          descricao?: string
          igreja_id: string
          professor_id?: string
          professores_ids?: string[]
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          faixa_etaria?: string
          descricao?: string
          igreja_id: string
          professor_id?: string
          professores_ids?: string[]
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          faixa_etaria?: string
          descricao?: string
          igreja_id?: string
          professor_id?: string
          professores_ids?: string[]
          ativa?: boolean
          updated_at?: string
        }
      }
      professores: {
        Row: {
          id: string
          nome: string
          email?: string
          senha?: string
          telefone?: string
          data_nascimento: string
          endereco?: string
          igreja_id: string
          sala_id: string
          user_id?: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email?: string
          senha?: string
          telefone?: string
          data_nascimento: string
          endereco?: string
          igreja_id: string
          sala_id: string
          user_id?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          senha?: string
          telefone?: string
          data_nascimento?: string
          endereco?: string
          igreja_id?: string
          sala_id?: string
          user_id?: string
          ativo?: boolean
          updated_at?: string
        }
      }
      alunos: {
        Row: {
          id: string
          nome: string
          data_nascimento?: string
          telefone?: string
          endereco?: string
          responsavel?: string
          telefone_responsavel?: string
          sala_id: string
          igreja_id: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          data_nascimento?: string
          telefone?: string
          endereco?: string
          responsavel?: string
          telefone_responsavel?: string
          sala_id: string
          igreja_id: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          data_nascimento?: string
          telefone?: string
          endereco?: string
          responsavel?: string
          telefone_responsavel?: string
          sala_id?: string
          igreja_id?: string
          ativo?: boolean
          updated_at?: string
        }
      }
      chamadas: {
        Row: {
          id: string
          data: string
          sala_id: string
          professor_id: string
          igreja_id: string
          total_presentes: number
          total_visitantes: number
          observacoes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          sala_id: string
          professor_id: string
          igreja_id: string
          total_presentes: number
          total_visitantes: number
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          sala_id?: string
          professor_id?: string
          igreja_id?: string
          total_presentes?: number
          total_visitantes?: number
          observacoes?: string
          updated_at?: string
        }
      }
      presencas: {
        Row: {
          id: string
          chamada_id: string
          aluno_id: string
          presente: boolean
          justificativa?: string
          capitulos_lidos?: number
          fez_atividade?: boolean
          created_at: string
        }
        Insert: {
          id?: string
          chamada_id: string
          aluno_id: string
          presente: boolean
          justificativa?: string
          capitulos_lidos?: number
          fez_atividade?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          chamada_id?: string
          aluno_id?: string
          presente?: boolean
          justificativa?: string
          capitulos_lidos?: number
          fez_atividade?: boolean
        }
      }
      avisos: {
        Row: {
          id: string
          titulo: string
          conteudo: string
          tipo: 'geral' | 'sala' | 'professor' | 'igreja'
          igreja_id: string
          sala_id?: string
          professor_id?: string
          ativo: boolean
          data_inicio: string
          data_fim?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          conteudo: string
          tipo: 'geral' | 'sala' | 'professor' | 'igreja'
          igreja_id: string
          sala_id?: string
          professor_id?: string
          ativo?: boolean
          data_inicio: string
          data_fim?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          conteudo?: string
          tipo?: 'geral' | 'sala' | 'professor' | 'igreja'
          igreja_id?: string
          sala_id?: string
          professor_id?: string
          ativo?: boolean
          data_inicio?: string
          data_fim?: string
          updated_at?: string
        }
      }
    }
  }
}