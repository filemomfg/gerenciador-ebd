// Tipos para o sistema EBD

export type UserRole = 'admin' | 'admin_igreja' | 'professor' | 'aluno'

export interface User {
  id: string
  nome: string
  email: string
  senha: string // Adicionado campo senha
  role: UserRole
  igreja_id?: string
  sala_id?: string // Para professores - sala específica que leciona
  ativo?: boolean
  created_at: string
  updated_at: string
}

export interface Igreja {
  id: string
  nome: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  telefone?: string
  email?: string
  logo_url?: string // Campo para logo da igreja
  configuracoes: IgrejaConfiguracoes
  admin_id: string
  created_at: string
  updated_at: string
}

export interface IgrejaConfiguracoes {
  contabiliza_capitulos: boolean
  contabiliza_atividades: boolean
  contabiliza_visitantes: boolean
  dias_chamada: string[]
  meta_capitulos_semana?: number
}

export interface Sala {
  id: string
  nome: string
  faixa_etaria?: string
  descricao?: string
  igreja_id: string
  professor_id?: string // Professor principal (compatibilidade)
  professores_ids?: string[] // Múltiplos professores por sala
  ativa: boolean
  created_at: string
  updated_at: string
}

export interface Professor {
  id: string
  nome: string
  email?: string
  senha?: string // Adicionado campo senha
  telefone?: string
  data_nascimento: string // Agora obrigatório
  endereco?: string
  igreja_id: string
  sala_id: string // Sala específica que leciona
  user_id?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Aluno {
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

export interface Chamada {
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

export interface PresencaAluno {
  id: string
  chamada_id: string
  aluno_id: string
  presente: boolean
  justificativa?: string
  capitulos_lidos?: number
  fez_atividade?: boolean
  created_at: string
}

export interface Aviso {
  id: string
  titulo: string
  conteudo: string
  tipo: 'geral' | 'sala' | 'igreja'
  igreja_id: string
  sala_id?: string
  ativo: boolean
  data_inicio: string
  data_fim?: string
  created_at: string
  updated_at: string
}

export interface RelatorioSala {
  sala: Sala
  professor: Professor
  total_alunos: number
  presentes: number
  faltas: number
  visitantes: number
  total_presente_na_sala: number // presentes + visitantes
  percentual_presenca: number
  capitulos_total?: number
  atividades_feitas?: number
}

export interface RelatorioDashboard {
  igreja: Igreja
  total_salas: number
  total_alunos: number
  total_professores: number
  presenca_geral: number
  visitantes_total: number
  total_presente_na_igreja: number // soma de todas as salas
  salas: RelatorioSala[]
  evolucao_semanal: {
    data: string
    presentes: number
    visitantes: number
  }[]
}

// Interface para cadastro de usuários
export interface CadastroUsuario {
  nome: string
  email: string
  password: string
  role: UserRole
  igreja_id?: string
  sala_id?: string
}

// Interface para login
export interface LoginCredentials {
  email: string
  password: string
}