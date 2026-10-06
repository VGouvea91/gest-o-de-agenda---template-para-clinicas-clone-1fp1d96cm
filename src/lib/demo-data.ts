import { startOfWeek, addDays, setHours, setMinutes } from 'date-fns'

const createId = () => Math.random().toString(36).substring(2, 15)

const initialProfissionais = [
  {
    id: 'p1',
    nome: 'Dr. Arnaldo Silva',
    especialidade: 'Cardiologia',
    registro: 'CRM 12345',
    duracaoConsultaMin: 30,
    ativo: true,
    foto: '',
  },
  {
    id: 'p2',
    nome: 'Dra. Maria Santos',
    especialidade: 'Pediatria',
    registro: 'CRM 67890',
    duracaoConsultaMin: 20,
    ativo: true,
    foto: '',
  },
  {
    id: 'p3',
    nome: 'Dr. João Paulo',
    especialidade: 'Ortopedia',
    registro: 'CRM 54321',
    duracaoConsultaMin: 30,
    ativo: true,
    foto: '',
  },
]

const initialConvenios = [
  { id: 'c1', nome: 'Unimed', prazoPagamentoDias: 30, valorBaseConsulta: 150, ativo: true },
  { id: 'c2', nome: 'Bradesco Saúde', prazoPagamentoDias: 45, valorBaseConsulta: 180, ativo: true },
  { id: 'c3', nome: 'SulAmérica', prazoPagamentoDias: 30, valorBaseConsulta: 160, ativo: true },
  { id: 'c4', nome: 'Particular', prazoPagamentoDias: 0, valorBaseConsulta: 250, ativo: true },
]

const initialTiposAtendimento = [
  {
    id: 't1',
    nome: 'Consulta de Rotina',
    categoria: 'primary',
    icone: 'stethoscope',
    duracaoMin: 30,
    precoBase: 200,
    ativo: true,
  },
  {
    id: 't2',
    nome: 'Retorno',
    categoria: 'info',
    icone: 'rotate-ccw',
    duracaoMin: 15,
    precoBase: 0,
    ativo: true,
  },
  {
    id: 't3',
    nome: 'Exame',
    categoria: 'warm',
    icone: 'activity',
    duracaoMin: 45,
    precoBase: 300,
    ativo: true,
  },
  {
    id: 't4',
    nome: 'Emergência',
    categoria: 'mint',
    icone: 'alert-circle',
    duracaoMin: 20,
    precoBase: 400,
    ativo: true,
  },
]

const initialPacientes = Array.from({ length: 10 }).map((_, i) => ({
  id: `pac${i}`,
  nome: [
    'Ana Beatriz',
    'Carlos Eduardo',
    'Fernando Costa',
    'Mariana Lima',
    'Roberto Alves',
    'Juliana Silva',
    'Ricardo Gomes',
    'Camila Rocha',
    'Lucas Martins',
    'Beatriz Souza',
  ][i],
  cpf: `111.222.333-0${i}`,
  telefone: `(11) 98888-000${i}`,
  email: `paciente${i}@email.com`,
  convenio: ['c1', 'c2', 'c3', 'c4', ''][i % 5],
  ativo: true,
  created: new Date().toISOString(),
}))

const initialAgendamentos = () => {
  const base = startOfWeek(new Date(), { weekStartsOn: 0 })
  const ags = []
  const statuses = ['aguardando', 'confirmado', 'realizado', 'faltou', 'cancelado']

  for (let i = 1; i <= 5; i++) {
    for (let j = 0; j < 5; j++) {
      let date = addDays(base, i)
      date = setHours(date, 9 + j)
      date = setMinutes(date, 0)

      ags.push({
        id: `ag${i}${j}`,
        paciente: initialPacientes[(i + j) % 10].id,
        profissional: initialProfissionais[j % 3].id,
        tipo: initialTiposAtendimento[j % 4].id,
        dataHora: date.toISOString(),
        duracaoMin: 30,
        status: statuses[(i + j) % statuses.length],
        convenio: initialConvenios[j % 4].id,
        observacoes: 'Paciente relata sintomas leves.',
      })
    }
  }
  return ags
}

export const isDemoMode = () => sessionStorage.getItem('demo-mode') === 'true'

export const enterDemoMode = () => {
  sessionStorage.setItem('demo-mode', 'true')
  if (!sessionStorage.getItem('demo-data')) {
    resetDemoData()
  }
}

export const exitDemoMode = () => {
  sessionStorage.removeItem('demo-mode')
}

export const resetDemoData = () => {
  const data = {
    profissionais: [...initialProfissionais],
    convenios: [...initialConvenios],
    tipos_atendimento: [...initialTiposAtendimento],
    pacientes: [...initialPacientes],
    agendamentos: initialAgendamentos(),
  }
  sessionStorage.setItem('demo-data', JSON.stringify(data))
  emitChange('*')
}

const getStore = () => {
  const str = sessionStorage.getItem('demo-data')
  if (!str) {
    resetDemoData()
    return JSON.parse(sessionStorage.getItem('demo-data')!)
  }
  return JSON.parse(str)
}

const saveStore = (store: any) => {
  sessionStorage.setItem('demo-data', JSON.stringify(store))
}

const listeners: Record<string, (() => void)[]> = {}
export const emitChange = (collection: string) => {
  if (listeners[collection]) listeners[collection].forEach((cb) => cb())
  if (listeners['*']) listeners['*'].forEach((cb) => cb())
}
export const subscribeDemo = (collection: string, cb: () => void) => {
  if (!listeners[collection]) listeners[collection] = []
  listeners[collection].push(cb)
  return () => {
    listeners[collection] = listeners[collection].filter((l) => l !== cb)
  }
}

const expandAgendamento = (ag: any, store: any) => ({
  ...ag,
  expand: {
    paciente: store.pacientes.find((p: any) => p.id === ag.paciente),
    profissional: store.profissionais.find((p: any) => p.id === ag.profissional),
    tipo: store.tipos_atendimento.find((t: any) => t.id === ag.tipo),
    convenio: store.convenios.find((c: any) => c.id === ag.convenio),
  },
})

const expandPaciente = (pac: any, store: any) => ({
  ...pac,
  expand: {
    convenio: store.convenios.find((c: any) => c.id === pac.convenio),
  },
})

export const demoAPI = {
  getAgendamentosHoje: async () => {
    const store = getStore()
    const today = new Date()
    const dateStr = today.toISOString().substring(0, 10)
    const ags = store.agendamentos.filter((a: any) => a.dataHora.startsWith(dateStr))
    return ags
      .map((a: any) => expandAgendamento(a, store))
      .sort((a: any, b: any) => a.dataHora.localeCompare(b.dataHora))
  },
  getAgendamentosByDateRange: async (start: Date, end: Date) => {
    const store = getStore()
    const startStr = start.toISOString()
    const endStr = end.toISOString()
    const ags = store.agendamentos.filter(
      (a: any) => a.dataHora >= startStr && a.dataHora <= endStr,
    )
    return ags
      .map((a: any) => expandAgendamento(a, store))
      .sort((a: any, b: any) => a.dataHora.localeCompare(b.dataHora))
  },
  updateAgendamentoStatus: async (id: string, status: string) => {
    const store = getStore()
    const idx = store.agendamentos.findIndex((a: any) => a.id === id)
    if (idx > -1) store.agendamentos[idx].status = status
    saveStore(store)
    emitChange('agendamentos')
    return expandAgendamento(store.agendamentos[idx], store)
  },
  createAgendamento: async (data: any) => {
    const store = getStore()
    const newAg = { ...data, id: createId(), status: data.status || 'aguardando' }
    store.agendamentos.push(newAg)
    saveStore(store)
    emitChange('agendamentos')
    return expandAgendamento(newAg, store)
  },
  updateAgendamento: async (id: string, data: any) => {
    const store = getStore()
    const idx = store.agendamentos.findIndex((a: any) => a.id === id)
    if (idx > -1) {
      store.agendamentos[idx] = { ...store.agendamentos[idx], ...data }
      saveStore(store)
      emitChange('agendamentos')
      return expandAgendamento(store.agendamentos[idx], store)
    }
    throw new Error('Not found')
  },
  getAgendamentosPaciente: async (pacienteId: string) => {
    const store = getStore()
    const ags = store.agendamentos.filter((a: any) => a.paciente === pacienteId)
    return ags
      .map((a: any) => expandAgendamento(a, store))
      .sort((a: any, b: any) => b.dataHora.localeCompare(a.dataHora))
  },

  getProfissionais: async () => getStore().profissionais,
  saveProfissional: async (id: string | null, data: any) => {
    const store = getStore()
    if (id) {
      const idx = store.profissionais.findIndex((p: any) => p.id === id)
      if (idx > -1) store.profissionais[idx] = { ...store.profissionais[idx], ...data }
    } else {
      store.profissionais.push({ ...data, id: createId() })
    }
    saveStore(store)
    emitChange('profissionais')
    return data
  },
  getConvenios: async () => getStore().convenios,
  saveConvenio: async (id: string | null, data: any) => {
    const store = getStore()
    if (id) {
      const idx = store.convenios.findIndex((p: any) => p.id === id)
      if (idx > -1) store.convenios[idx] = { ...store.convenios[idx], ...data }
    } else {
      store.convenios.push({ ...data, id: createId() })
    }
    saveStore(store)
    emitChange('convenios')
    return data
  },
  getTipos: async () => getStore().tipos_atendimento,
  saveTipoAtendimento: async (id: string | null, data: any) => {
    const store = getStore()
    if (id) {
      const idx = store.tipos_atendimento.findIndex((p: any) => p.id === id)
      if (idx > -1) store.tipos_atendimento[idx] = { ...store.tipos_atendimento[idx], ...data }
    } else {
      store.tipos_atendimento.push({ ...data, id: createId() })
    }
    saveStore(store)
    emitChange('tipos_atendimento')
    return data
  },
  checkAgendamentoPrerequisites: async () => {
    const store = getStore()
    const missing = []
    if (store.profissionais.filter((p: any) => p.ativo).length === 0) missing.push('Profissional')
    if (store.convenios.filter((p: any) => p.ativo).length === 0) missing.push('Convênio')
    if (store.tipos_atendimento.filter((p: any) => p.ativo).length === 0)
      missing.push('Tipo de Atendimento')
    return missing
  },
  getPacientes: async (page = 1, filterQuery = '', showInactive = false, convenio = 'todos') => {
    const store = getStore()
    let pacs = store.pacientes
    if (!showInactive) pacs = pacs.filter((p: any) => p.ativo !== false)
    if (convenio && convenio !== 'todos') {
      if (convenio === 'none') pacs = pacs.filter((p: any) => !p.convenio)
      else pacs = pacs.filter((p: any) => p.convenio === convenio)
    }
    if (filterQuery) {
      const q = filterQuery.toLowerCase()
      pacs = pacs.filter(
        (p: any) => p.nome.toLowerCase().includes(q) || (p.cpf && p.cpf.includes(q)),
      )
    }
    pacs = pacs
      .map((p: any) => expandPaciente(p, store))
      .sort((a: any, b: any) => b.created.localeCompare(a.created))
    const perPage = 50
    const totalItems = pacs.length
    const items = pacs.slice((page - 1) * perPage, page * perPage)
    return { items, totalItems, page, perPage, totalPages: Math.ceil(totalItems / perPage) }
  },
  searchPacientes: async (query: string) => {
    const store = getStore()
    let pacs = store.pacientes.filter((p: any) => p.ativo !== false)
    if (query) {
      const q = query.toLowerCase()
      pacs = pacs.filter(
        (p: any) => p.nome.toLowerCase().includes(q) || (p.cpf && p.cpf.includes(q)),
      )
    }
    const items = pacs
      .map((p: any) => expandPaciente(p, store))
      .sort((a: any, b: any) => b.created.localeCompare(a.created))
      .slice(0, 10)
    return { items, totalItems: items.length, page: 1, perPage: 10, totalPages: 1 }
  },
  createPaciente: async (data: any) => {
    const store = getStore()
    const newPac = { ...data, id: createId(), created: new Date().toISOString() }
    store.pacientes.push(newPac)
    saveStore(store)
    emitChange('pacientes')
    return expandPaciente(newPac, store)
  },
  updatePaciente: async (id: string, data: any) => {
    const store = getStore()
    const idx = store.pacientes.findIndex((p: any) => p.id === id)
    if (idx > -1) {
      store.pacientes[idx] = { ...store.pacientes[idx], ...data }
      saveStore(store)
      emitChange('pacientes')
      return expandPaciente(store.pacientes[idx], store)
    }
    throw new Error('Not found')
  },
}
