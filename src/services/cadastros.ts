import pb from '@/lib/pocketbase/client'
import { isDemoMode, demoAPI } from '@/lib/demo-data'

export const getProfissionais = () =>
  isDemoMode() ? demoAPI.getProfissionais() : pb.collection('profissionais').getFullList()
export const saveProfissional = (id: string | null, data: any) =>
  isDemoMode()
    ? demoAPI.saveProfissional(id, data)
    : id
      ? pb.collection('profissionais').update(id, data)
      : pb.collection('profissionais').create(data)

export const getConvenios = () =>
  isDemoMode() ? demoAPI.getConvenios() : pb.collection('convenios').getFullList()
export const saveConvenio = (id: string | null, data: any) =>
  isDemoMode()
    ? demoAPI.saveConvenio(id, data)
    : id
      ? pb.collection('convenios').update(id, data)
      : pb.collection('convenios').create(data)

export const getTipos = () =>
  isDemoMode() ? demoAPI.getTipos() : pb.collection('tipos_atendimento').getFullList()
export const saveTipoAtendimento = (id: string | null, data: any) =>
  isDemoMode()
    ? demoAPI.saveTipoAtendimento(id, data)
    : id
      ? pb.collection('tipos_atendimento').update(id, data)
      : pb.collection('tipos_atendimento').create(data)

export const checkAgendamentoPrerequisites = async () => {
  if (isDemoMode()) return demoAPI.checkAgendamentoPrerequisites()
  const [profissionais, convenios, tipos] = await Promise.all([
    pb.collection('profissionais').getList(1, 1, { filter: 'ativo = true' }),
    pb.collection('convenios').getList(1, 1, { filter: 'ativo = true' }),
    pb.collection('tipos_atendimento').getList(1, 1, { filter: 'ativo = true' }),
  ])

  const missing: string[] = []
  if (profissionais.totalItems === 0) missing.push('Profissional')
  if (convenios.totalItems === 0) missing.push('Convênio')
  if (tipos.totalItems === 0) missing.push('Tipo de Atendimento')

  return missing
}
