import { createClient } from '@supabase/supabase-js'

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Criar cliente apenas se as variáveis estiverem definidas
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

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
          role: 'admin' | 'professor' | 'secretario'
          igreja_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          senha: string
          role: 'admin' | 'professor' | 'secretario'
          igreja_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          senha?: string
          role?: 'admin' | 'professor' | 'secretario'
          igreja_id?: string
          updated_at?: string
        }
      }
      igrejas: {
        Row: {
          id: string
          nome: string
          endereco: string
          telefone?: string
          email?: string
          pastor?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          endereco: string
          telefone?: string
          email?: string
          pastor?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          endereco?: string
          telefone?: string
          email?: string
          pastor?: string
          updated_at?: string
        }
      }
      salas: {
        Row: {
          id: string
          nome: string
          descricao?: string
          igreja_id: string
          capacidade?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string
          igreja_id: string
          capacidade?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string
          igreja_id?: string
          capacidade?: number
          updated_at?: string
        }
      }
      professores: {
        Row: {
          id: string
          nome: string
          email?: string
          telefone?: string
          igreja_id: string
          sala_id?: string
          user_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email?: string
          telefone?: string
          igreja_id: string
          sala_id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          telefone?: string
          igreja_id?: string
          sala_id?: string
          user_id?: string
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
          igreja_id: string
          sala_id: string
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
          igreja_id: string
          sala_id: string
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
          igreja_id?: string
          sala_id?: string
          ativo?: boolean
          updated_at?: string
        }
      }
      chamadas: {
        Row: {
          id: string
          data: string
          licao: string
          professor_id: string
          sala_id: string
          igreja_id: string
          observacoes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          licao: string
          professor_id: string
          sala_id: string
          igreja_id: string
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          licao?: string
          professor_id?: string
          sala_id?: string
          igreja_id?: string
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
          observacoes?: string
          created_at: string
        }
        Insert: {
          id?: string
          chamada_id: string
          aluno_id: string
          presente: boolean
          observacoes?: string
          created_at?: string
        }
        Update: {
          id?: string
          chamada_id?: string
          aluno_id?: string
          presente?: boolean
          observacoes?: string
        }
      }
      avisos: {
        Row: {
          id: string
          titulo: string
          conteudo: string
          autor_id: string
          igreja_id: string
          sala_id?: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          conteudo: string
          autor_id: string
          igreja_id: string
          sala_id?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          conteudo?: string
          autor_id?: string
          igreja_id?: string
          sala_id?: string
          ativo?: boolean
          updated_at?: string
        }
      }
    }
  }
}