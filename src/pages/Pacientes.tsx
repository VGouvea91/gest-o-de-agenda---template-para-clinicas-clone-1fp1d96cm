import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Edit2,
  AlertTriangle,
  Baby,
  Stethoscope,
  User,
  Activity,
  Camera,
  Loader2,
} from 'lucide-react'

import pb from '@/lib/pocketbase/client'
import { getPacientes, createPaciente, updatePaciente } from '@/services/pacientes'
import { getAgendamentosPaciente } from '@/services/agendamentos'
import { getConvenios } from '@/services/cadastros'

import { useModals } from '@/contexts/ModalContext'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { toast } from '@/hooks/use-toast'
import { format, differenceInYears, isFuture } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CONTAINER } from '@/lib/layout'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

const patientSchema = z.object({
  nome: z.string().min(3, 'Mínimo de 3 caracteres'),
  cpf: z.string().min(14, 'CPF inválido').transform(unformat),
  telefone: z.string().min(14, 'Telefone inválido').transform(unformat),
  email: z.string().email('Email inválido').or(z.literal('')),
  dataNascimento: z.string().optional(),
  convenio: z.string().optional(),
  numeroCarteirinha: z.string().optional(),
  ativo: z.boolean().default(true),
  flags: z
    .object({
      primeira_vez: z.boolean().default(false),
      alergia_importante: z.boolean().default(false),
      gestante: z.boolean().default(false),
      menor_de_idade: z.boolean().default(false),
    })
    .default({}),
})

export default function Pacientes() {
  const { setPreSelectedPatient, setNewAppointmentOpen } = useModals()
  const [pacientes, setPacientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [selectedConvenio, setSelectedConvenio] = useState('todos')
  const [convenios, setConvenios] = useState<any[]>([])

  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<any>(null)

  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [profilePatient, setProfilePatient] = useState<any>(null)
  const [patientAppointments, setPatientAppointments] = useState<any[]>([])

  const [confirmEditOpen, setConfirmEditOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [pendingChanges, setPendingChanges] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debouncedSaveRef = useRef<NodeJS.Timeout | null>(null)

  const form = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      dataNascimento: '',
      convenio: '',
      numeroCarteirinha: '',
      ativo: true,
      flags: {
        primeira_vez: false,
        alergia_importante: false,
        gestante: false,
        menor_de_idade: false,
      },
    },
  })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadData = async () => {
    setLoading(true)
    try {
      const convs = await getConvenios()
      setConvenios(convs.filter((c: any) => c.ativo))
      const res = await getPacientes(1, debouncedSearch, showInactive, selectedConvenio)
      setPacientes(res.items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [debouncedSearch, showInactive, selectedConvenio])

  useRealtime('pacientes', loadData)

  useEffect(() => {
    if (Object.keys(pendingChanges).length > 0) {
      if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current)
      debouncedSaveRef.current = setTimeout(() => {
        saveProfileChanges(pendingChanges)
      }, 1500)
    }
    return () => {
      if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current)
    }
  }, [pendingChanges])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pendingChanges).length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pendingChanges])

  const saveProfileChanges = async (changes: any) => {
    if (Object.keys(changes).length === 0) return
    setIsSaving(true)
    try {
      const payload = { ...changes }
      if (payload.cpf) payload.cpf = unformat(payload.cpf)
      if (payload.telefone) payload.telefone = unformat(payload.telefone)
      if (payload.convenio === 'none') payload.convenio = ''

      const updated = await updatePaciente(profilePatient.id, payload)
      setProfilePatient(updated)
      setPendingChanges({})
      toast({ title: 'Alterações salvas automaticamente', duration: 2000 })
      loadData()
    } catch (e) {
      const errs = extractFieldErrors(e)
      toast({
        title: 'Erro ao salvar',
        description: Object.values(errs).join(', ') || 'Verifique os dados informados',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfileSheetChange = async (open: boolean) => {
    if (!open) {
      if (Object.keys(pendingChanges).length > 0) {
        if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current)
        await saveProfileChanges(pendingChanges)
        toast({ title: 'Suas alterações foram salvas antes de sair.' })
      }
      setProfileSheetOpen(false)
      setIsEditing(false)
      setPendingChanges({})
      setEditData({})
    } else {
      setProfileSheetOpen(true)
    }
  }

  const handleEditChange = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }))
    setPendingChanges((prev: any) => ({ ...prev, [field]: value }))
  }

  const startEditing = () => {
    setEditData({
      nome: profilePatient.nome,
      cpf: formatCPF(profilePatient.cpf),
      telefone: formatPhone(profilePatient.telefone),
      email: profilePatient.email || '',
      dataNascimento: profilePatient.dataNascimento
        ? profilePatient.dataNascimento.split(' ')[0]
        : '',
      convenio: profilePatient.convenio || 'none',
      numeroCarteirinha: profilePatient.numeroCarteirinha || '',
      ativo: profilePatient.ativo ?? true,
    })
    setIsEditing(true)
    setConfirmEditOpen(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profilePatient) return

    try {
      setIsSaving(true)
      const updated = await updatePaciente(profilePatient.id, { foto: file })
      setProfilePatient(updated)
      toast({ title: 'Foto atualizada com sucesso' })
      loadData()
    } catch (error) {
      toast({ title: 'Erro ao atualizar foto', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useRealtime('agendamentos', (e) => {
    if (profileSheetOpen && profilePatient) {
      if (!e.record.id || e.record.paciente === profilePatient.id) {
        getAgendamentosPaciente(profilePatient.id).then(setPatientAppointments).catch(console.error)
      }
    }
  })

  const openCreate = () => {
    setEditingPatient(null)
    form.reset({
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      dataNascimento: '',
      convenio: 'none',
      numeroCarteirinha: '',
      ativo: true,
      flags: {
        primeira_vez: false,
        alergia_importante: false,
        gestante: false,
        menor_de_idade: false,
      },
    })
    setEditSheetOpen(true)
  }

  const openEdit = (p: any) => {
    setEditingPatient(p)
    form.reset({
      nome: p.nome,
      cpf: formatCPF(p.cpf),
      telefone: formatPhone(p.telefone),
      email: p.email || '',
      dataNascimento: p.dataNascimento ? p.dataNascimento.split(' ')[0] : '',
      convenio: p.convenio || 'none',
      numeroCarteirinha: p.numeroCarteirinha || '',
      ativo: p.ativo ?? true,
      flags: p.flags || {
        primeira_vez: false,
        alergia_importante: false,
        gestante: false,
        menor_de_idade: false,
      },
    })
    setEditSheetOpen(true)
  }

  const openProfile = async (p: any) => {
    setProfilePatient(p)
    setPatientAppointments([])
    setProfileSheetOpen(true)
    setIsEditing(false)
    setPendingChanges({})
    setEditData({})
    try {
      const appts = await getAgendamentosPaciente(p.id)
      setPatientAppointments(appts)
    } catch (e) {
      console.error(e)
    }
  }

  const onSubmit = async (data: any) => {
    const payload = { ...data }
    if (payload.convenio === 'none') payload.convenio = ''

    try {
      if (editingPatient) {
        await updatePaciente(editingPatient.id, payload)
        toast({ title: 'Paciente atualizado com sucesso' })
      } else {
        await createPaciente(payload)
        toast({ title: 'Paciente cadastrado com sucesso' })
      }
      setEditSheetOpen(false)
      loadData()
    } catch (e) {
      const errs = extractFieldErrors(e)
      Object.keys(errs).forEach((k) => {
        if (k === 'cpf') form.setError('cpf', { message: 'CPF já cadastrado' })
        else form.setError(k as any, { message: errs[k] })
      })
      if (!Object.keys(errs).length) {
        toast({ title: 'Erro ao salvar', variant: 'destructive' })
      }
    }
  }

  const handleNewAppointment = () => {
    if (profilePatient) {
      setPreSelectedPatient(profilePatient)
      setProfileSheetOpen(false)
      setNewAppointmentOpen(true)
    }
  }

  const isEmpty =
    pacientes.length === 0 &&
    !loading &&
    !debouncedSearch &&
    !showInactive &&
    selectedConvenio === 'todos'
  const isSearchEmpty = pacientes.length === 0 && !loading && !isEmpty

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 relative overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="pt-12 pb-8 bg-base relative overflow-hidden border-b border-border/50">
          <div
            className="absolute inset-0 pointer-events-none z-[0] opacity-[0.03] mix-blend-multiply"
            style={{
              backgroundImage:
                'url(https://img.usecurling.com/p/800/800?q=vintage%20medical%20apothecary%20herbs&color=black)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className={cn(CONTAINER, 'relative z-10')}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-deep tracking-tight mb-2">
                  Pacientes
                </h1>
                <p className="text-base text-subtle font-medium">
                  Gerencie o cadastro de pacientes da clínica.
                </p>
              </div>
              <Button
                onClick={openCreate}
                className="bg-lavender-500 hover:bg-lavender-600 text-white shadow-lavender-glow w-full md:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Paciente
              </Button>
            </div>
          </div>
        </div>

        <div className={cn(CONTAINER, 'grid grid-cols-1 md:grid-cols-12 gap-6 pt-6')}>
          <div className="md:col-span-4 order-first md:order-last">
            <div className="bg-elevated border border-border rounded-xl p-5 shadow-sm flex flex-col gap-5 sticky top-24">
              <div>
                <h3 className="font-bold text-deep text-sm uppercase tracking-wider mb-1">
                  Filtros & Busca
                </h3>
                <p className="text-xs text-subtle">Refine a lista de pacientes</p>
              </div>

              <div className="relative w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-subtle" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou CPF..."
                  className="pl-9 h-11 bg-background"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs text-subtle font-medium uppercase tracking-wider mb-1">
                  Convênio
                </Label>
                <div className="flex flex-wrap gap-2">
                  {['todos', 'none', ...convenios.map((c) => c.id)].map((c) => {
                    const label =
                      c === 'todos'
                        ? 'Todos'
                        : c === 'none'
                          ? 'Particular'
                          : convenios.find((x) => x.id === c)?.nome
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedConvenio(c)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
                          selectedConvenio === c
                            ? 'bg-lavender-100 text-lavender-800 border-lavender-200'
                            : 'bg-background text-subtle border-border hover:bg-secondary hover:text-deep',
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Label
                  htmlFor="show-inactive"
                  className="text-sm text-subtle whitespace-nowrap cursor-pointer"
                >
                  Mostrar inativos
                </Label>
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-8 order-last md:order-first space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-[160px] rounded-xl" />
                ))}
              </div>
            ) : isEmpty ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="w-40 h-40 bg-secondary rounded-full flex items-center justify-center mb-6 border border-dashed border-border">
                  <User className="w-16 h-16 text-lavender-300" />
                </div>
                <h3 className="font-display text-xl font-bold text-deep mb-2">Sem pacientes</h3>
                <p className="text-subtle mb-6 max-w-md">
                  O banco de dados de pacientes está vazio. Comece cadastrando o primeiro paciente
                  da clínica.
                </p>
                <Button
                  onClick={openCreate}
                  className="bg-lavender-500 hover:bg-lavender-600 text-white shadow-lavender-glow"
                >
                  Cadastrar paciente
                </Button>
              </div>
            ) : isSearchEmpty ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <Search className="w-12 h-12 text-subtle mb-4" />
                <p className="text-deep font-medium">Nenhum paciente encontrado para "{search}"</p>
                <p className="text-subtle text-sm">Tente ajustar os filtros ou a busca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                {pacientes.map((p) => {
                  const age = p.dataNascimento
                    ? differenceInYears(new Date(), new Date(p.dataNascimento))
                    : null
                  const convNome = p.expand?.convenio?.nome || 'Particular'

                  return (
                    <div
                      key={p.id}
                      onClick={() => openProfile(p)}
                      className={cn(
                        'bg-elevated p-5 rounded-xl border border-border hover:border-lavender-300 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-3',
                        !p.ativo && 'opacity-60 grayscale',
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                            {p.foto && (
                              <AvatarImage
                                src={pb.files.getURL(p, p.foto)}
                                className="object-cover"
                              />
                            )}
                            <AvatarFallback className="bg-lavender-100 text-lavender-700 font-bold">
                              {p.nome[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-display font-bold text-deep group-hover:text-lavender-700 transition-colors line-clamp-1">
                              {p.nome}
                            </h4>
                            <p className="text-xs text-subtle font-mono">
                              {formatCPF(p.cpf)} {age !== null && `• ${age} anos`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-subtle hover:text-lavender-600 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(p)
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 text-subtle bg-secondary px-2 py-1 rounded-md font-mono">
                          <Phone className="w-3 h-3" /> {formatPhone(p.telefone)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-lavender-700 bg-lavender-50 px-2 py-1 rounded-md font-medium">
                          <Activity className="w-3 h-3" /> {convNome}
                        </span>
                      </div>

                      {p.flags &&
                        (p.flags.primeira_vez ||
                          p.flags.alergia_importante ||
                          p.flags.gestante ||
                          p.flags.menor_de_idade) && (
                          <div className="flex flex-wrap gap-1 mt-1 border-t border-border pt-3">
                            {p.flags.primeira_vez && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-800 border-none font-medium hover:bg-blue-200"
                              >
                                1ª Vez
                              </Badge>
                            )}
                            {p.flags.alergia_importante && (
                              <Badge
                                variant="secondary"
                                className="bg-red-100 text-red-800 border-none font-medium hover:bg-red-200"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" /> Alergia
                              </Badge>
                            )}
                            {p.flags.gestante && (
                              <Badge
                                variant="secondary"
                                className="bg-pink-100 text-pink-800 border-none font-medium hover:bg-pink-200"
                              >
                                <Baby className="w-3 h-3 mr-1" /> Gestante
                              </Badge>
                            )}
                            {p.flags.menor_de_idade && (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-100 text-yellow-800 border-none font-medium hover:bg-yellow-200"
                              >
                                Menor
                              </Badge>
                            )}
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="sm:max-w-md w-full bg-elevated border-l-border p-0 flex flex-col">
          <SheetHeader className="p-6 border-b border-border bg-secondary/50">
            <SheetTitle className="font-display text-xl">
              {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
            </SheetTitle>
            <SheetDescription>Preencha os dados completos do paciente.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 p-6">
            <form id="patient-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input {...form.register('nome')} placeholder="Ex: Maria Silva" />
                  {form.formState.errors.nome && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.nome.message as string}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CPF *</Label>
                    <Controller
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(formatCPF(e.target.value))}
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                      )}
                    />
                    {form.formState.errors.cpf && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.cpf.message as string}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Controller
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(formatPhone(e.target.value))}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                      )}
                    />
                    {form.formState.errors.telefone && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.telefone.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input type="date" {...form.register('dataNascimento')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      {...form.register('email')}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Convênio</Label>
                    <Controller
                      control={form.control}
                      name="convenio"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || 'none'}>
                          <SelectTrigger>
                            <SelectValue placeholder="Particular" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Particular</SelectItem>
                            {convenios.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº Carteirinha</Label>
                    <Input {...form.register('numeroCarteirinha')} />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <Label>Sinalizações Clínicas (Flags)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      control={form.control}
                      name="flags.primeira_vez"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="f-1vez"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label htmlFor="f-1vez" className="text-sm font-normal cursor-pointer">
                            1ª Vez
                          </Label>
                        </div>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="flags.alergia_importante"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="f-alergia"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label
                            htmlFor="f-alergia"
                            className="text-sm font-normal text-red-600 cursor-pointer"
                          >
                            Alergia Importante
                          </Label>
                        </div>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="flags.gestante"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="f-gestante"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label
                            htmlFor="f-gestante"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Gestante
                          </Label>
                        </div>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="flags.menor_de_idade"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="f-menor"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label htmlFor="f-menor" className="text-sm font-normal cursor-pointer">
                            Menor de Idade
                          </Label>
                        </div>
                      )}
                    />
                  </div>
                </div>

                {editingPatient && (
                  <div className="pt-4 border-t border-border">
                    <Controller
                      control={form.control}
                      name="ativo"
                      render={({ field }) => (
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border">
                          <div>
                            <Label className="text-base font-medium">Paciente Ativo</Label>
                            <p className="text-xs text-subtle">
                              Desativar ocultará o paciente das buscas.
                            </p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>
            </form>
          </ScrollArea>
          <SheetFooter className="p-6 border-t border-border bg-background">
            <Button variant="outline" onClick={() => setEditSheetOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="patient-form"
              disabled={!form.formState.isValid}
              className="bg-lavender-500 hover:bg-lavender-600 text-white"
            >
              Salvar Paciente
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={profileSheetOpen} onOpenChange={handleProfileSheetChange}>
        <SheetContent className="sm:max-w-md w-full bg-elevated border-l-border p-0 flex flex-col">
          {profilePatient && (
            <>
              <div className="p-6 border-b border-border bg-lavender-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-lavender-200/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 text-subtle hover:text-lavender-600"
                      onClick={() => setConfirmEditOpen(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-1.5" /> Editar
                    </Button>
                  )}
                  {isEditing && isSaving && (
                    <div className="absolute right-0 top-0 text-[10px] text-lavender-700 flex items-center gap-1 font-medium bg-lavender-100 px-2 py-1 rounded-md shadow-sm">
                      <Loader2 className="w-3 h-3 animate-spin" /> Salvando
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handlePhotoUpload}
                  />

                  <Avatar
                    className={cn(
                      'h-20 w-20 border-4 border-white shadow-md mb-4',
                      isEditing && 'cursor-pointer group',
                    )}
                    onClick={() => isEditing && fileInputRef.current?.click()}
                  >
                    {profilePatient.foto && (
                      <AvatarImage
                        src={pb.files.getURL(profilePatient, profilePatient.foto)}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="text-2xl bg-lavender-100 text-lavender-700 font-bold">
                      {profilePatient.nome[0].toUpperCase()}
                    </AvatarFallback>
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Camera className="text-white w-6 h-6" />
                      </div>
                    )}
                  </Avatar>

                  {isEditing ? (
                    <div className="space-y-2 w-full px-4 mb-4">
                      <Input
                        value={editData.nome}
                        onChange={(e) => handleEditChange('nome', e.target.value)}
                        className="text-center font-display text-xl font-bold h-9"
                      />
                      <Input
                        value={editData.cpf}
                        onChange={(e) => handleEditChange('cpf', formatCPF(e.target.value))}
                        maxLength={14}
                        className="text-center text-sm font-mono h-8"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="font-display text-2xl font-bold text-deep tracking-tight mb-1">
                        {profilePatient.nome}
                      </h2>
                      <p className="text-sm text-subtle font-mono mb-4">
                        {formatCPF(profilePatient.cpf)}
                      </p>
                    </>
                  )}

                  <Button
                    onClick={handleNewAppointment}
                    className="w-full bg-deep hover:bg-deep/90 text-white shadow-md rounded-xl transition-transform active:scale-95"
                  >
                    <Calendar className="w-4 h-4 mr-2" /> Novo Agendamento
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8 pb-6">
                  <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-3">
                      Contato & Pessoal
                    </h3>
                    <div className="bg-background rounded-xl border border-border p-1">
                      <div className="flex items-center gap-3 p-3 border-b border-border hover:bg-secondary/50 transition-colors">
                        <Phone className="w-4 h-4 text-subtle shrink-0" />
                        {isEditing ? (
                          <Input
                            value={editData.telefone}
                            onChange={(e) =>
                              handleEditChange('telefone', formatPhone(e.target.value))
                            }
                            maxLength={15}
                            className="h-8 text-sm font-mono border-transparent hover:border-input focus:border-input bg-transparent px-2"
                            placeholder="Telefone"
                          />
                        ) : (
                          <a
                            href={`tel:${profilePatient.telefone}`}
                            className="text-sm font-medium hover:text-lavender-600 font-mono px-2"
                          >
                            {formatPhone(profilePatient.telefone)}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 p-3 border-b border-border hover:bg-secondary/50 transition-colors">
                        <Mail className="w-4 h-4 text-subtle shrink-0" />
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editData.email}
                            onChange={(e) => handleEditChange('email', e.target.value)}
                            className="h-8 text-sm border-transparent hover:border-input focus:border-input bg-transparent px-2"
                            placeholder="E-mail"
                          />
                        ) : profilePatient.email ? (
                          <a
                            href={`mailto:${profilePatient.email}`}
                            className="text-sm font-medium hover:text-lavender-600 px-2"
                          >
                            {profilePatient.email}
                          </a>
                        ) : (
                          <span className="text-sm text-subtle italic px-2">Não informado</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors">
                        <Calendar className="w-4 h-4 text-subtle shrink-0" />
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editData.dataNascimento}
                            onChange={(e) => handleEditChange('dataNascimento', e.target.value)}
                            className="h-8 text-sm border-transparent hover:border-input focus:border-input bg-transparent px-2"
                          />
                        ) : (
                          <span className="text-sm font-medium px-2">
                            {profilePatient.dataNascimento
                              ? format(new Date(profilePatient.dataNascimento), 'dd/MM/yyyy', {
                                  locale: ptBR,
                                })
                              : 'Não informado'}
                            {profilePatient.dataNascimento && (
                              <span className="text-subtle ml-2">
                                (
                                {differenceInYears(
                                  new Date(),
                                  new Date(profilePatient.dataNascimento),
                                )}{' '}
                                anos)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-3">
                      Plano de Saúde
                    </h3>
                    <div className="bg-background rounded-xl border border-border p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-lavender-50 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 text-lavender-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        {isEditing ? (
                          <>
                            <Select
                              value={editData.convenio}
                              onValueChange={(v) => handleEditChange('convenio', v)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Particular" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Particular</SelectItem>
                                {convenios.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Nº da Carteirinha"
                              value={editData.numeroCarteirinha}
                              onChange={(e) =>
                                handleEditChange('numeroCarteirinha', e.target.value)
                              }
                              className="h-8 text-sm font-mono"
                            />
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-deep">
                              {profilePatient.expand?.convenio?.nome || 'Particular'}
                            </p>
                            {profilePatient.numeroCarteirinha && (
                              <p className="text-xs text-subtle font-mono">
                                Cart: {profilePatient.numeroCarteirinha}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </section>
                  {isEditing && (
                    <section>
                      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border">
                        <div>
                          <Label className="text-base font-medium">Paciente Ativo</Label>
                          <p className="text-xs text-subtle">
                            Desativar ocultará o paciente das buscas.
                          </p>
                        </div>
                        <Switch
                          checked={editData.ativo}
                          onCheckedChange={(v) => handleEditChange('ativo', v)}
                        />
                      </div>
                    </section>
                  )}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-subtle">
                        Resumo de Atendimentos
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-background rounded-xl border border-border p-4 flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-2xl font-display font-bold text-green-600 mb-1">
                          {patientAppointments.filter((a) => a.status === 'realizado').length}
                        </span>
                        <span className="text-xs font-medium text-subtle">Total de Visitas</span>
                      </div>
                      <div className="bg-background rounded-xl border border-border p-4 flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-2xl font-display font-bold text-red-600 mb-1">
                          {patientAppointments.filter((a) => a.status === 'faltou').length}
                        </span>
                        <span className="text-xs font-medium text-subtle">Faltas</span>
                      </div>
                    </div>

                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-subtle mb-3 flex justify-between items-center">
                      Histórico de Consultas
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {patientAppointments.length}
                      </Badge>
                    </h3>

                    {patientAppointments.length === 0 ? (
                      <div className="bg-background rounded-xl border border-border border-dashed p-6 text-center">
                        <p className="text-sm text-subtle italic">
                          Nenhum histórico de agendamentos encontrado.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-border/50">
                        {patientAppointments.map((a) => {
                          const date = new Date(a.dataHora)

                          let statusColor = 'bg-secondary text-subtle'
                          let statusLabel = a.status

                          if (a.status === 'realizado') {
                            statusColor = 'bg-green-100 text-green-800'
                            statusLabel = 'Realizado'
                          } else if (a.status === 'faltou') {
                            statusColor = 'bg-red-100 text-red-800'
                            statusLabel = 'Faltou'
                          } else if (a.status === 'cancelado') {
                            statusColor = 'bg-amber-100 text-amber-800'
                            statusLabel = 'Cancelado'
                          } else if (a.status === 'confirmado') {
                            statusColor = 'bg-blue-100 text-blue-800'
                            statusLabel = 'Confirmado'
                          } else if (a.status === 'aguardando') {
                            statusColor = 'bg-blue-50 text-blue-600'
                            statusLabel = 'Aguardando'
                          }

                          return (
                            <div
                              key={a.id}
                              className="relative flex items-start gap-4 pb-6 last:pb-0"
                            >
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-lavender-50 text-lavender-600 shrink-0 z-10">
                                <Calendar className="w-4 h-4" />
                              </div>

                              <div className="flex-1 bg-background p-4 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-xs font-mono text-subtle mb-1">
                                      {format(date, 'dd/MM/yyyy HH:mm')}
                                    </p>
                                    <p className="font-medium text-sm text-deep">
                                      {a.expand?.tipo?.nome}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      'border-none text-[10px] font-medium uppercase',
                                      statusColor,
                                    )}
                                  >
                                    {statusLabel}
                                  </Badge>
                                </div>

                                <p className="text-xs text-subtle flex items-center gap-1.5 mb-3">
                                  <Stethoscope className="w-3.5 h-3.5" /> Dr(a).{' '}
                                  {a.expand?.profissional?.nome}
                                </p>

                                <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                                  <p className="text-xs text-subtle italic leading-relaxed">
                                    {a.observacoes || 'Sem observações'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>{' '}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmEditOpen} onOpenChange={setConfirmEditOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja editar as informações deste paciente? As alterações serão salvas
              automaticamente enquanto você digita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={startEditing}
              className="bg-lavender-500 hover:bg-lavender-600 text-white"
            >
              Sim, editar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
