import { User, Igreja, Sala, Professor, Aluno, Chamada, PresencaAluno, Aviso } from './types'
import { supabase } from './supabase'

// Função para gerar ID único
const generateId = () => crypto.randomUUID()

// Função para verificar se Supabase está configurado
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

// Fallback para localStorage quando Supabase não estiver configurado
let localUsers: User[] = [
  {
    id: 'filemom-admin',
    nome: 'Filemom Figueiredo',
    email: 'filemom@ebd.com',
    senha: '123456',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

let localIgrejas: Igreja[] = []
let localSalas: Sala[] = []
let localProfessores: Professor[] = []
let localAlunos: Aluno[] = []
let localChamadas: Chamada[] = []
let localPresencas: PresencaAluno[] = []
let localAvisos: Aviso[] = []

// Função para persistir dados no localStorage (fallback)
const persistLocalData = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('users', JSON.stringify(localUsers))
    localStorage.setItem('igrejas', JSON.stringify(localIgrejas))
    localStorage.setItem('salas', JSON.stringify(localSalas))
    localStorage.setItem('professores', JSON.stringify(localProfessores))
    localStorage.setItem('alunos', JSON.stringify(localAlunos))
    localStorage.setItem('chamadas', JSON.stringify(localChamadas))
    localStorage.setItem('presencas', JSON.stringify(localPresencas))
    localStorage.setItem('avisos', JSON.stringify(localAvisos))
  } catch (error) {
    console.warn('Erro ao salvar dados no localStorage:', error)
  }
}

// Função para carregar dados do localStorage (fallback)
const loadLocalData = () => {
  if (typeof window === 'undefined') return
  
  try {
    const savedUsers = localStorage.getItem('users')
    const savedIgrejas = localStorage.getItem('igrejas')
    const savedSalas = localStorage.getItem('salas')
    const savedProfessores = localStorage.getItem('professores')
    const savedAlunos = localStorage.getItem('alunos')
    const savedChamadas = localStorage.getItem('chamadas')
    const savedPresencas = localStorage.getItem('presencas')
    const savedAvisos = localStorage.getItem('avisos')

    if (savedUsers) {
      const usersFromStorage = JSON.parse(savedUsers)
      const adminPrincipal = localUsers.find(u => u.id === 'filemom-admin')
      const customUsers = usersFromStorage.filter((u: User) => u.id !== 'filemom-admin')
      localUsers = [adminPrincipal!, ...customUsers]
    }
    if (savedIgrejas) localIgrejas = JSON.parse(savedIgrejas)
    if (savedSalas) localSalas = JSON.parse(savedSalas)
    if (savedProfessores) localProfessores = JSON.parse(savedProfessores)
    if (savedAlunos) localAlunos = JSON.parse(savedAlunos)
    if (savedChamadas) localChamadas = JSON.parse(savedChamadas)
    if (savedPresencas) localPresencas = JSON.parse(savedPresencas)
    if (savedAvisos) localAvisos = JSON.parse(savedAvisos)
  } catch (error) {
    console.warn('Erro ao carregar dados do localStorage:', error)
  }
}

// Carregar dados locais na inicialização
if (typeof window !== 'undefined') {
  loadLocalData()
}

// Funções de API com Supabase + fallback localStorage
export const api = {
  // Autenticação
  login: async (email: string, password: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('Tentando login com:', email, password)
    
    if (isSupabaseConfigured()) {
      try {
        // Buscar no Supabase
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('senha', password)
          .single()
        
        if (error) {
          console.log('Erro no Supabase, usando fallback local:', error)
        } else if (users) {
          console.log('Login bem-sucedido via Supabase')
          return users as User
        }
      } catch (error) {
        console.log('Erro na conexão Supabase, usando fallback local:', error)
      }
    }
    
    // Fallback para localStorage
    const adminPrincipal = {
      id: 'filemom-admin',
      nome: 'Filemom Figueiredo',
      email: 'filemom@ebd.com',
      senha: '123456',
      role: 'admin' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (email === 'filemom@ebd.com' && password === '123456') {
      console.log('Login do admin principal bem-sucedido (local)')
      return adminPrincipal
    }
    
    let allUsers = localUsers
    if (typeof window !== 'undefined') {
      const usersStorage = localStorage.getItem('users')
      if (usersStorage) {
        try {
          allUsers = JSON.parse(usersStorage)
        } catch (error) {
          console.error('Erro ao parsear usuários do localStorage:', error)
        }
      }
    }
    
    const user = allUsers.find((u: User) => u.email === email && u.senha === password)
    console.log('Usuário encontrado (local):', user)
    return user || null
  },

  // Usuários
  getUsers: async (): Promise<User[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          return data as User[]
        }
      } catch (error) {
        console.log('Erro no Supabase, usando dados locais:', error)
      }
    }
    
    return localUsers
  },

  createUser: async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
    const newUser: User = {
      ...userData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single()
        
        if (!error && data) {
          return data as User
        }
      } catch (error) {
        console.log('Erro no Supabase, salvando localmente:', error)
      }
    }
    
    // Fallback local
    localUsers.push(newUser)
    persistLocalData()
    return newUser
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User | null> => {
    const updatedData = { ...userData, updated_at: new Date().toISOString() }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update(updatedData)
          .eq('id', id)
          .select()
          .single()
        
        if (!error && data) {
          return data as User
        }
      } catch (error) {
        console.log('Erro no Supabase, atualizando localmente:', error)
      }
    }
    
    // Fallback local
    const index = localUsers.findIndex(u => u.id === id)
    if (index === -1) return null
    localUsers[index] = { ...localUsers[index], ...updatedData }
    persistLocalData()
    return localUsers[index]
  },

  deleteUser: async (id: string): Promise<boolean> => {
    if (id === 'filemom-admin') return false

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id)
        
        if (!error) {
          return true
        }
      } catch (error) {
        console.log('Erro no Supabase, deletando localmente:', error)
      }
    }
    
    // Fallback local
    const index = localUsers.findIndex(u => u.id === id)
    if (index === -1) return false
    localUsers.splice(index, 1)
    persistLocalData()
    return true
  },

  // Igrejas
  getIgrejas: async (): Promise<Igreja[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('igrejas')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          return data as Igreja[]
        }
      } catch (error) {
        console.log('Erro no Supabase, usando dados locais:', error)
      }
    }
    
    return localIgrejas
  },

  getIgrejaById: async (id: string): Promise<Igreja | null> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('igrejas')
          .select('*')
          .eq('id', id)
          .single()
        
        if (!error && data) {
          return data as Igreja
        }
      } catch (error) {
        console.log('Erro no Supabase, usando dados locais:', error)
      }
    }
    
    return localIgrejas.find(i => i.id === id) || null
  },

  createIgreja: async (igrejaData: Omit<Igreja, 'id' | 'created_at' | 'updated_at'>): Promise<Igreja> => {
    const newIgreja: Igreja = {
      ...igrejaData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('igrejas')
          .insert([newIgreja])
          .select()
          .single()
        
        if (!error && data) {
          return data as Igreja
        }
      } catch (error) {
        console.log('Erro no Supabase, salvando localmente:', error)
      }
    }
    
    localIgrejas.push(newIgreja)
    persistLocalData()
    return newIgreja
  },

  updateIgreja: async (id: string, igrejaData: Partial<Igreja>): Promise<Igreja | null> => {
    const updatedData = { ...igrejaData, updated_at: new Date().toISOString() }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('igrejas')
          .update(updatedData)
          .eq('id', id)
          .select()
          .single()
        
        if (!error && data) {
          return data as Igreja
        }
      } catch (error) {
        console.log('Erro no Supabase, atualizando localmente:', error)
      }
    }
    
    const index = localIgrejas.findIndex(i => i.id === id)
    if (index === -1) return null
    localIgrejas[index] = { ...localIgrejas[index], ...updatedData }
    persistLocalData()
    return localIgrejas[index]
  },

  deleteIgreja: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('igrejas')
          .delete()
          .eq('id', id)
        
        if (!error) {
          return true
        }
      } catch (error) {
        console.log('Erro no Supabase, deletando localmente:', error)
      }
    }
    
    const index = localIgrejas.findIndex(i => i.id === id)
    if (index === -1) return false
    
    // Remover dados relacionados localmente
    localSalas = localSalas.filter(s => s.igreja_id !== id)
    localProfessores = localProfessores.filter(p => p.igreja_id !== id)
    localAlunos = localAlunos.filter(a => a.igreja_id !== id)
    localChamadas = localChamadas.filter(c => c.igreja_id !== id)
    localAvisos = localAvisos.filter(a => a.igreja_id !== id)
    localUsers = localUsers.filter(u => u.igreja_id !== id || u.id === 'filemom-admin')
    
    localIgrejas.splice(index, 1)
    persistLocalData()
    return true
  },

  // Salas
  getSalas: async (igrejaId?: string): Promise<Sala[]> => {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('salas').select('*')
        if (igrejaId) {
          query = query.eq('igreja_id', igrejaId)
        }
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (!error && data) {
          return data as Sala[]
        }
      } catch (error) {
        console.log('Erro no Supabase, usando dados locais:', error)
      }
    }
    
    return igrejaId ? localSalas.filter(s => s.igreja_id === igrejaId) : localSalas
  },

  getSalaById: async (id: string): Promise<Sala | null> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('salas')
          .select('*')
          .eq('id', id)
          .single()
        
        if (!error && data) {
          return data as Sala
        }
      } catch (error) {
        console.log('Erro no Supabase, usando dados locais:', error)
      }
    }
    
    return localSalas.find(s => s.id === id) || null
  },

  createSala: async (salaData: Omit<Sala, 'id' | 'created_at' | 'updated_at'>): Promise<Sala> => {
    const newSala: Sala = {
      ...salaData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('salas')
          .insert([newSala])
          .select()
          .single()
        
        if (!error && data) {
          return data as Sala
        }
      } catch (error) {
        console.log('Erro no Supabase, salvando localmente:', error)
      }
    }
    
    localSalas.push(newSala)
    persistLocalData()
    return newSala
  },

  updateSala: async (id: string, salaData: Partial<Sala>): Promise<Sala | null> => {
    const updatedData = { ...salaData, updated_at: new Date().toISOString() }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('salas')
          .update(updatedData)
          .eq('id', id)
          .select()
          .single()
        
        if (!error && data) {
          return data as Sala
        }
      } catch (error) {
        console.log('Erro no Supabase, atualizando localmente:', error)
      }
    }
    
    const index = localSalas.findIndex(s => s.id === id)
    if (index === -1) return null
    localSalas[index] = { ...localSalas[index], ...updatedData }
    persistLocalData()
    return localSalas[index]
  },

  deleteSala: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('salas')
          .delete()
          .eq('id', id)
        
        if (!error) {
          return true
        }
      } catch (error) {
        console.log('Erro no Supabase, deletando localmente:', error)
      }
    }
    
    const index = localSalas.findIndex(s => s.id === id)
    if (index === -1) return false
    
    // Remover dados relacionados
    localAlunos = localAlunos.filter(a => a.sala_id !== id)
    localProfessores = localProfessores.filter(p => p.sala_id !== id)
    localChamadas = localChamadas.filter(c => c.sala_id !== id)
    
    localSalas.splice(index, 1)
    persistLocalData()
    return true
  },

  // Professores
  getProfessores: async (igrejaId?: string): Promise<Professor[]> => {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('professores').select('*')
        if (igrejaId) {
          query = query.eq('igreja_id', igrejaId)
        }
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (!error && data) {
          return data as Professor[]
        }
      } catch (error) {
        console.log('Erro no Supabase, usando dados locais:', error)
      }
    }
    
    return igrejaId ? localProfessores.filter(p => p.igreja_id === igrejaId) : localProfessores
  },

  createProfessor: async (professorData: Omit<Professor, 'id' | 'created_at' | 'updated_at'>): Promise<Professor> => {
    const newProfessor: Professor = {
      ...professorData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('professores')
          .insert([newProfessor])
          .select()
          .single()
        
        if (!error && data) {
          return data as Professor
        }
      } catch (error) {
        console.log('Erro no Supabase, salvando localmente:', error)
      }
    }
    
    localProfessores.push(newProfessor)
    persistLocalData()
    return newProfessor
  },

  updateProfessor: async (id: string, professorData: Partial<Professor>): Promise<Professor | null> => {
    const updatedData = { ...professorData, updated_at: new Date().toISOString() }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('professores')
          .update(updatedData)
          .eq('id', id)
          .select()
          .single()
        
        if (!error && data) {
          return data as Professor
        }
      } catch (error) {
        console.log('Erro no Supabase, atualizando localmente:', error)
      }
    }
    
    const index = localProfessores.findIndex(p => p.id === id)
    if (index === -1) return null
    localProfessores[index] = { ...localProfessores[index], ...updatedData }
    persistLocalData()
    return localProfessores[index]
  },

  deleteProfessor: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('professores')
          .delete()
          .eq('id', id)
        
        if (!error) {
          return true
        }
      } catch (error) {
        console.log('Erro no Supabase, deletando localmente:', error)
      }
    }
    
    const index = localProfessores.findIndex(p => p.id === id)
    if (index === -1) return false
    
    const professor = localProfessores[index]
    if (professor.user_id) {
      localUsers = localUsers.filter(u => u.id !== professor.user_id)
    }
    
    localProfessores.splice(index, 1)
    persistLocalData()
    return true
  },

  // Alunos
  getAlunos: async (salaId?: string, igrejaId?: string): Promise<Aluno[]> => {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('alunos').select('*').eq('ativo', true)
        if (salaId) query = query.eq('sala_id', salaId)
        if (igrejaId) query = query.eq('igreja_id', igrejaId)
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (!error && data) {
          return data as Aluno[]
        }
      } catch (error) {
        console.log('Erro no Supabase, usando dados locais:', error)
      }
    }
    
    let filteredAlunos = localAlunos.filter(a => a.ativo !== false)
    if (salaId) filteredAlunos = filteredAlunos.filter(a => a.sala_id === salaId)
    if (igrejaId) filteredAlunos = filteredAlunos.filter(a => a.igreja_id === igrejaId)
    return filteredAlunos
  },

  createAluno: async (alunoData: Omit<Aluno, 'id' | 'created_at' | 'updated_at'>): Promise<Aluno> => {
    const newAluno: Aluno = {
      ...alunoData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('alunos')
          .insert([newAluno])
          .select()
          .single()
        
        if (!error && data) {
          return data as Aluno
        }
      } catch (error) {
        console.log('Erro no Supabase, salvando localmente:', error)
      }
    }
    
    localAlunos.push(newAluno)
    persistLocalData()
    return newAluno
  },

  updateAluno: async (id: string, alunoData: Partial<Aluno>): Promise<Aluno | null> => {
    const updatedData = { ...alunoData, updated_at: new Date().toISOString() }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('alunos')
          .update(updatedData)
          .eq('id', id)
          .select()
          .single()
        
        if (!error && data) {
          return data as Aluno
        }
      } catch (error) {
        console.log('Erro no Supabase, atualizando localmente:', error)
      }
    }
    
    const index = localAlunos.findIndex(a => a.id === id)
    if (index === -1) return null
    localAlunos[index] = { ...localAlunos[index], ...updatedData }
    persistLocalData()
    return localAlunos[index]
  },

  deleteAluno: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('alunos')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', id)
        
        if (!error) {
          return true
        }
      } catch (error) {
        console.log('Erro no Supabase, atualizando localmente:', error)
      }
    }
    
    const index = localAlunos.findIndex(a => a.id === id)
    if (index === -1) return false
    
    localPresencas = localPresencas.filter(p => p.aluno_id !== id)
    localAlunos[index] = { ...localAlunos[index], ativo: false, updated_at: new Date().toISOString() }
    persistLocalData()
    return true
  },

  // Chamadas
  getChamadas: async (salaId?: string, igrejaId?: string): Promise<Chamada[]> => {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('chamadas').select('*')
        if (salaId) query = query.eq('sala_id', salaId)
        if (igrejaId) query = query.eq('igreja_id', igrejaId)
        
        const { data, error } = await query.order('data', { ascending: false })
        
        if (!error && data) {
          return data as Chamada[]
        }
      } catch (error) {
        console.log('Erro no Supabase, usando dados locais:', error)
      }
    }
    
    let filteredChamadas = localChamadas
    if (salaId) filteredChamadas = filteredChamadas.filter(c => c.sala_id === salaId)
    if (igrejaId) filteredChamadas = filteredChamadas.filter(c => c.igreja_id === igrejaId)
    return filteredChamadas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  },

  createChamada: async (chamadaData: Omit<Chamada, 'id' | 'created_at' | 'updated_at'>): Promise<Chamada> => {
    const newChamada: Chamada = {
      ...chamadaData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('chamadas')
          .insert([newChamada])
          .select()
          .single()
        
        if (!error && data) {
          return data as Chamada
        }
      } catch (error) {
        console.log('Erro no Supabase, salvando localmente:', error)
      }
    }
    
    localChamadas.push(newChamada)
    persistLocalData()
    return newChamada
  },

  // Presenças
  getPresencas: async (chamadaId: string): Promise<PresencaAluno[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('presencas')
          .select('*')
          .eq('chamada_id', chamadaId)
        
        if (!error && data) {
          return data as PresencaAluno[]
        }
      } catch (error) {
        console.log('Erro no Supabase, usando dados locais:', error)
      }
    }
    
    return localPresencas.filter(p => p.chamada_id === chamadaId)
  },

  createPresenca: async (presencaData: Omit<PresencaAluno, 'id' | 'created_at'>): Promise<PresencaAluno> => {
    const newPresenca: PresencaAluno = {
      ...presencaData,
      id: generateId(),
      created_at: new Date().toISOString()
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('presencas')
          .insert([newPresenca])
          .select()
          .single()
        
        if (!error && data) {
          return data as PresencaAluno
        }
      } catch (error) {
        console.log('Erro no Supabase, salvando localmente:', error)
      }
    }
    
    localPresencas.push(newPresenca)
    persistLocalData()
    return newPresenca
  },

  createPresencaAluno: async (presencaData: Omit<PresencaAluno, 'id' | 'created_at'>): Promise<PresencaAluno> => {
    return api.createPresenca(presencaData)
  },

  // Avisos
  getAvisos: async (igrejaId?: string, salaId?: string): Promise<Aviso[]> => {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('avisos').select('*').eq('ativo', true)
        if (igrejaId) query = query.eq('igreja_id', igrejaId)
        if (salaId) query = query.eq('sala_id', salaId)
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (!error && data) {
          return data as Aviso[]
        }
      } catch (error) {
        console.log('Erro no Supabase, usando dados locais:', error)
      }
    }
    
    let filteredAvisos = localAvisos.filter(a => a.ativo)
    if (igrejaId) filteredAvisos = filteredAvisos.filter(a => a.igreja_id === igrejaId)
    if (salaId) filteredAvisos = filteredAvisos.filter(a => !a.sala_id || a.sala_id === salaId)
    return filteredAvisos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  createAviso: async (avisoData: Omit<Aviso, 'id' | 'created_at' | 'updated_at'>): Promise<Aviso> => {
    const newAviso: Aviso = {
      ...avisoData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('avisos')
          .insert([newAviso])
          .select()
          .single()
        
        if (!error && data) {
          return data as Aviso
        }
      } catch (error) {
        console.log('Erro no Supabase, salvando localmente:', error)
      }
    }
    
    localAvisos.push(newAviso)
    persistLocalData()
    return newAviso
  }
}