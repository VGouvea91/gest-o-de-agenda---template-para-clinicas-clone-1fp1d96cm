import pb from '@/lib/pocketbase/client'
import { isDemoMode, demoAPI } from '@/lib/demo-data'

export const getPacientes = (
  page = 1,
  filterQuery = '',
  showInactive = false,
  convenio = 'todos',
) => {
  if (isDemoMode()) return demoAPI.getPacientes(page, filterQuery, showInactive, convenio)

  const conditions = []
  if (!showInactive) conditions.push('ativo != false')
  if (convenio && convenio !== 'todos') {
    if (convenio === 'none') conditions.push('convenio = ""')
    else conditions.push(`convenio = "${convenio}"`)
  }
  if (filterQuery) conditions.push(`(nome ~ "${filterQuery}" || cpf ~ "${filterQuery}")`)

  const filterStr = conditions.join(' && ')

  return pb.collection('pacientes').getList(page, 50, {
    filter: filterStr,
    sort: '-created',
    expand: 'convenio',
  })
}

export const searchPacientes = (query: string) => {
  if (isDemoMode()) return demoAPI.searchPacientes(query)

  const filter = query
    ? `(nome ~ "${query}" || cpf ~ "${query}") && ativo != false`
    : 'ativo != false'
  return pb.collection('pacientes').getList(1, 10, {
    filter,
    sort: '-created',
  })
}

export const createPaciente = (data: any) => {
  if (isDemoMode()) return demoAPI.createPaciente(data)
  return pb.collection('pacientes').create(data)
}

export const updatePaciente = (id: string, data: any) => {
  if (isDemoMode()) return demoAPI.updatePaciente(id, data)
  return pb.collection('pacientes').update(id, data)
}
