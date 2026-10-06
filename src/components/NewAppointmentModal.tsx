import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useModals } from '@/contexts/ModalContext'
import {
  Search,
  UserPlus,
  Clock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useCadastros } from '@/contexts/CadastrosContext'
import { searchPacientes, createPaciente } from '@/services/pacientes'
import {
  createAgendamento,
  updateAgendamento,
  getAgendamentosByDateRange,
} from '@/services/agendamentos'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const WORK_START_H = 8
const WORK_END_H = 19

const formatCPF = (v: string) => {
  let val = v.replace(/\D/g, '')
  if (val.length > 11) val = val.slice(0, 11)
  return val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const formatPhone = (v: string) => {
  let val = v.replace(/\D/g, '')
  if (val.length > 11) val = val.slice(0, 11)
  if (val.length <= 10) return val.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return val.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

const unformat = (v: string) => v.replace(/\D/g, '')

export function NewAppointmentModal() {
  const {
    isNewAppointmentOpen,
    setNewAppointmentOpen,
    preSelectedPatient,
    setPreSelectedPatient,
    preSelectedDate,
    editingAppointment,
  } = useModals()
  const { profissionais, tipos, convenios } = useCadastros()
  const activeProfissionais = profissionais.filter((p) => p.ativo)
  const activeTipos = tipos.filter((t) => t.ativo)
  const activeConvenios = convenios.filter((c) => c.ativo)

  const isEditing = !!editingAppointment

  const [step, setStep] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [selectedProf, setSelectedProf] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [ocupacao, setOcupacao] = useState<any[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [pacientesResult, setPacientesResult] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showCreatePatient, setShowCreatePatient] = useState(false)
  const [newPatient, setNewPatient] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    convenio: 'none',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setStep(1)
    setSelectedPatient(null)
    setSelectedProf(null)
    setSelectedType('')
    setSelectedDate(new Date())
    setSelectedTime('')
    setOcupacao([])
    setSearchQuery('')
    setShowCreatePatient(false)
    setNewPatient({ nome: '', cpf: '', telefone: '', convenio: 'none' })
  }

  const handleClose = (open: boolean) => {
    setNewAppointmentOpen(open)
    if (!open) {
      setTimeout(() => {
        reset()
        if (setPreSelectedPatient) setPreSelectedPatient(null)
      }, 300)
    }
  }

  // Prefill on open (editing / pre-selected patient / fresh)
  useEffect(() => {
    if (!isNewAppointmentOpen) return
    if (editingAppointment) {
      const ag = editingAppointment
      const d = new Date(ag.dataHora)
      setSelectedPatient(ag.expand?.paciente || null)
      setSelectedProf(ag.expand?.profissional || null)
      setSelectedType(ag.tipo || '')
      setSelectedDate(d)
      setSelectedTime(format(d, 'HH:mm'))
      setStep(2)
      return
    }
    setSelectedDate(preSelectedDate || new Date())
    if (preSelectedPatient) {
      setSelectedPatient(preSelectedPatient)
      setStep(2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewAppointmentOpen])

  // Patient search (only when picking a patient on step 1)
  useEffect(() => {
    if (!isNewAppointmentOpen || editingAppointment || preSelectedPatient) return
    const fetchP = async () => {
      setIsSearching(true)
      try {
        const res = await searchPacientes(searchQuery)
        setPacientesResult(res.items)
      } finally {
        setIsSearching(false)
      }
    }
    const t = setTimeout(fetchP, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isNewAppointmentOpen])

  // Load the professional's appointments for the chosen day (slot availability)
  useEffect(() => {
    if (!isNewAppointmentOpen || !selectedProf || !selectedDate) return
    let cancelled = false
    const load = async () => {
      try {
        const all = await getAgendamentosByDateRange(
          startOfDay(selectedDate),
          endOfDay(selectedDate),
        )
        if (cancelled) return
        const occ = (all as any[]).filter(
          (a) =>
            a.profissional === selectedProf.id &&
            a.status !== 'cancelado' &&
            a.id !== editingAppointment?.id,
        )
        setOcupacao(occ)
      } catch {
        if (!cancelled) setOcupacao([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isNewAppointmentOpen, selectedProf, selectedDate, editingAppointment])

  const handleCreateNewPatient = async () => {
    if (!newPatient.nome || newPatient.nome.length < 3) {
      toast({ title: 'Nome deve ter pelo menos 3 caracteres', variant: 'destructive' })
      return
    }
    if (unformat(newPatient.cpf).length !== 11) {
      toast({ title: 'CPF inválido', variant: 'destructive' })
      return
    }
    if (unformat(newPatient.telefone).length < 10) {
      toast({ title: 'Telefone inválido', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        nome: newPatient.nome,
        cpf: unformat(newPatient.cpf),
        telefone: unformat(newPatient.telefone),
        convenio: newPatient.convenio === 'none' ? '' : newPatient.convenio,
        ativo: true,
      }
      const p = await createPaciente(payload)
      setSelectedPatient(p)
      setStep(2)
      setShowCreatePatient(false)
    } catch (e) {
      const errs = extractFieldErrors(e)
      if (errs.cpf) {
        toast({ title: 'CPF já cadastrado.', variant: 'destructive' })
      } else {
        toast({ title: 'Erro ao criar paciente', variant: 'destructive' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeObj = activeTipos.find((t) => t.id === selectedType)
  const slotStep = typeObj?.duracaoMin || selectedProf?.duracaoConsultaMin || 30

  const slots: string[] = []
  for (let mins = WORK_START_H * 60; mins + slotStep <= WORK_END_H * 60; mins += slotStep) {
    const hh = String(Math.floor(mins / 60)).padStart(2, '0')
    const mm = String(mins % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }

  const slotConflict = (startMin: number, dur: number) =>
    ocupacao.some((o: any) => {
      const od = new Date(o.dataHora)
      const os = od.getHours() * 60 + od.getMinutes()
      const oe = os + (o.duracaoMin || 30)
      return startMin < oe && startMin + dur > os
    })

  const isSlotBusy = (slot: string) => {
    const [hh, mm] = slot.split(':').map(Number)
    return slotConflict(hh * 60 + mm, slotStep)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const [h, m] = selectedTime.split(':')
      const date = new Date(selectedDate)
      date.setHours(parseInt(h), parseInt(m), 0, 0)

      // Final conflict guard (the day's occupancy already excludes this appointment when editing)
      if (slotConflict(parseInt(h) * 60 + parseInt(m), slotStep)) {
        toast({
          title: 'Horário em conflito',
          description: 'Este profissional já tem um agendamento nesse horário.',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      const convenioId = selectedPatient?.convenio || ''
      const conv = convenios.find((c) => c.id === convenioId)
      const valor = conv ? conv.valorBaseConsulta : typeObj?.precoBase || 0

      const payload: any = {
        paciente: selectedPatient.id,
        profissional: selectedProf.id,
        tipo: typeObj?.id,
        dataHora: date.toISOString(),
        duracaoMin: slotStep,
        convenio: convenioId,
        valor,
      }

      if (isEditing) {
        await updateAgendamento(editingAppointment.id, payload)
        toast({ title: 'Agendamento atualizado!' })
      } else {
        await createAgendamento({
          ...payload,
          status: 'confirmado',
          criado_por: pb.authStore.record?.id,
        })
        toast({ title: 'Agendamento confirmado!' })
      }
      handleClose(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar agendamento', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isNewAppointmentOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-elevated shadow-xl border-border">
        <div className="flex flex-col bg-secondary p-6 pb-4 border-b border-border gap-4">
          <div className="flex-1">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-deep font-bold tracking-tight">
                {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
              <DialogDescription className="text-subtle">
                {step === 1 && 'Selecione ou cadastre o paciente.'}
                {step === 2 && 'Defina os detalhes da consulta.'}
                {step === 3 && 'Confirme as informações.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-colors',
                  step >= i ? 'bg-lavender-500' : 'bg-border',
                )}
              />
            ))}
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && !showCreatePatient && (
            <div className="space-y-6 animate-fade-in">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-subtle" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar paciente por nome ou CPF..."
                  className="pl-9 h-11 font-medium bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-3">
                  Resultados
                </p>
                {isSearching ? (
                  <p className="text-sm text-subtle italic">Buscando...</p>
                ) : pacientesResult.length > 0 ? (
                  pacientesResult.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p)
                        setStep(2)
                      }}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-lavender-300 hover:bg-lavender-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{p.nome[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-deep">{p.nome}</p>
                          <p className="text-xs font-mono text-subtle">
                            {p.cpf ? formatCPF(p.cpf) : 'Sem CPF'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-subtle" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-subtle italic">Nenhum paciente encontrado.</p>
                )}
              </div>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-subtle text-[10px] uppercase font-bold tracking-widest">
                  Ou
                </span>
                <div className="flex-grow border-t border-border"></div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowCreatePatient(true)}
                className="w-full h-11 border-dashed border-2 hover:bg-lavender-50 hover:text-lavender-700 hover:border-lavender-300 text-subtle bg-background"
              >
                <UserPlus className="mr-2 h-4 w-4" /> Cadastrar Novo Paciente
              </Button>
            </div>
          )}

          {step === 1 && showCreatePatient && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="font-bold text-deep">Novo Paciente</h4>
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={newPatient.nome}
                  onChange={(e) => setNewPatient({ ...newPatient, nome: e.target.value })}
                  placeholder="Ex: Maria Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={newPatient.cpf}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, cpf: formatCPF(e.target.value) })
                    }
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={newPatient.telefone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, telefone: formatPhone(e.target.value) })
                    }
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Convênio</Label>
                  <Select
                    value={newPatient.convenio}
                    onValueChange={(val) => setNewPatient({ ...newPatient, convenio: val })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Particular" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Particular</SelectItem>
                      {activeConvenios.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreatePatient(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateNewPatient}
                  disabled={!newPatient.nome || isSubmitting}
                  className="flex-1 bg-lavender-500 hover:bg-lavender-600 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Salvar e Continuar'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-slide-up">
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-3 block">
                  Tipo de Atendimento
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {activeTipos.map((t) => {
                    const colorMap: Record<string, string> = {
                      warm: 'bg-warm/30 text-yellow-900 border-warm/40',
                      mint: 'bg-mint/20 text-mint-900 border-mint/30',
                      primary: 'bg-lavender-200 text-lavender-900 border-lavender-300',
                      info: 'bg-blue-100 text-blue-900 border-blue-200',
                    }
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedType(t.id)
                          setSelectedTime('')
                        }}
                        className={cn(
                          'p-3 rounded-lg border text-left font-medium text-sm transition-all hover:scale-[1.02]',
                          selectedType === t.id
                            ? colorMap[t.categoria] || colorMap.primary
                            : 'bg-background border-border text-subtle hover:bg-secondary hover:text-deep',
                        )}
                      >
                        {t.nome}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-3 block">
                  Profissional
                </Label>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                  {activeProfissionais.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProf(p)
                        setSelectedTime('')
                      }}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border min-w-[100px] transition-all hover:scale-[1.02]',
                        selectedProf?.id === p.id
                          ? 'border-lavender-500 bg-lavender-50 shadow-sm'
                          : 'border-border bg-background hover:bg-secondary',
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        {p.foto && <AvatarImage src={pb.files.getURL(p, p.foto)} />}
                        <AvatarFallback>{p.nome[0]}</AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          'text-xs font-medium text-center',
                          selectedProf?.id === p.id ? 'text-lavender-700' : 'text-deep',
                        )}
                      >
                        {p.nome.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-3 block">
                  Data da Consulta
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-11 justify-start text-left font-medium bg-background border-border capitalize"
                    >
                      <CalendarDays className="mr-2 h-4 w-4 text-subtle" />
                      {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        if (d) {
                          setSelectedDate(d)
                          setSelectedTime('')
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {selectedProf && (
                <div className="animate-fade-in">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-3 block">
                    Horários{' '}
                    <span className="text-subtle/70 normal-case font-medium">
                      ({format(selectedDate, 'dd/MM')} · {slotStep} min)
                    </span>
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((time) => {
                      const busy = isSlotBusy(time)
                      return (
                        <button
                          key={time}
                          disabled={busy}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            'py-2 rounded-md border font-mono text-sm transition-all',
                            busy
                              ? 'bg-secondary border-border text-subtle/40 line-through cursor-not-allowed'
                              : selectedTime === time
                                ? 'bg-deep text-white border-deep shadow-md'
                                : 'bg-background border-border text-deep hover:border-lavender-400 hover:bg-lavender-50 hover:scale-[1.05]',
                          )}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-subtle mt-2">
                    Horários riscados já estão ocupados para este profissional no dia.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-slide-up">
              <div className="bg-secondary rounded-xl p-5 border border-border space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarFallback>{selectedPatient?.nome[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-display font-bold text-lg text-deep tracking-tight">
                      {selectedPatient?.nome}
                    </h4>
                    <p className="text-sm text-subtle">
                      {selectedPatient?.telefone || 'Sem telefone'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-xs text-subtle mb-1 flex items-center gap-1 font-medium">
                      <CalendarDays className="h-3 w-3" /> Data e Hora
                    </p>
                    <p className="font-mono font-medium text-deep capitalize">
                      {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}, {selectedTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-subtle mb-1 flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3" /> Duração
                    </p>
                    <p className="font-mono font-medium text-deep">{slotStep} min</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-subtle mb-1 font-medium">Profissional / Tipo</p>
                    <p className="font-medium text-deep">
                      {selectedProf?.nome}{' '}
                      <span className="text-muted-foreground font-normal">({typeObj?.nome})</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between p-6 pt-4 border-t border-border bg-background">
          {step > 1 && !showCreatePatient ? (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              className="text-subtle hover:text-deep hover:bg-secondary"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          ) : (
            <div />
          )}

          {step < 3 && !showCreatePatient && (
            <Button
              className="bg-lavender-500 hover:bg-lavender-600 text-white shadow-lavender-glow transition-all active:scale-95"
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedPatient) ||
                (step === 2 && (!selectedType || !selectedProf || !selectedTime))
              }
            >
              Continuar <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button
              className="bg-deep hover:bg-deep/90 text-white shadow-lg transition-all active:scale-95"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4 text-mint" />
              )}{' '}
              {isEditing ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
