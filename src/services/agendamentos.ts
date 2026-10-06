import pb from '@/lib/pocketbase/client'
import { isDemoMode, demoAPI } from '@/lib/demo-data'

export const getAgendamentosHoje = () => {
  if (isDemoMode()) return demoAPI.getAgendamentosHoje()

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  return pb.collection('agendamentos').getFullList({
    filter: `dataHora >= "${start.toISOString().replace('T', ' ')}" && dataHora <= "${end.toISOString().replace('T', ' ')}"`,
    sort: 'dataHora',
    expand: 'paciente,profissional,tipo,convenio',
  })
}

export const getAgendamentosByDateRange = (start: Date, end: Date) => {
  if (isDemoMode()) return demoAPI.getAgendamentosByDateRange(start, end)

  // Extract just the date and time parts to match PocketBase's standard UTC format
  const startStr = start.toISOString().replace('T', ' ').substring(0, 19)
  const endStr = end.toISOString().replace('T', ' ').substring(0, 19)

  return pb.collection('agendamentos').getFullList({
    filter: `dataHora >= "${startStr}" && dataHora <= "${endStr}"`,
    sort: 'dataHora',
    expand: 'paciente,profissional,tipo,convenio',
  })
}

export const updateAgendamentoStatus = (id: string, status: string) => {
  if (isDemoMode()) return demoAPI.updateAgendamentoStatus(id, status)
  return pb.collection('agendamentos').update(id, { status })
}

export const createAgendamento = (data: any) => {
  if (isDemoMode()) return demoAPI.createAgendamento(data)
  return pb.collection('agendamentos').create(data)
}

export const updateAgendamento = (id: string, data: any) => {
  if (isDemoMode()) return demoAPI.updateAgendamento(id, data)
  return pb.collection('agendamentos').update(id, data)
}

export const getAgendamentosPaciente = (pacienteId: string) => {
  if (isDemoMode()) return demoAPI.getAgendamentosPaciente(pacienteId)
  return pb.collection('agendamentos').getFullList({
    filter: `paciente = "${pacienteId}"`,
    sort: '-dataHora',
    expand: 'tipo,profissional',
  })
}
